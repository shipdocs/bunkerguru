import { timeScaleOf } from './time-scale.mjs';
import { profileOf, yawFactor, SHIP } from './ship-profile.mjs';
import { clamp } from './math.mjs';

// "Schipper" handling: the original Bunkerguru equations from engine.js (DYN 0.4 inertia,
// rudder side force and drift, slow two-stroke rpm, pneumatic reversing clutch, current
// shear over the hull), expressed in the 3D frame. u = ahead, v = starboard (m/s, over
// ground); x east, z south; heading h in radians, positive turns to starboard.
// currentAt(x, z) returns the water velocity {x, z} in m/s; wind {x, z} is optional.
// Feel (3D, on request): the hull picks up speed a bit quicker and loses it a bit
// slower than engine.js. Same forces, same top speed and stopping point of balance:
// only how fast the speed moves towards it. {up: 1, down: 1} gives engine.js exactly.
export const FEEL = { up: 1.3, down: 0.75 };
export function simStep(s, dt, keys = {}, contact, onClutch = () => {}, tele = 0, env = {}) {
  const p = profileOf(s);
  const currentAt = env.currentAt || (() => ({ x: 0, z: 0 }));
  const up = env.upgrades || {};
  const feel = env.feel || FEEL;
  const total = clamp(dt, 0, 0.05) * timeScaleOf(s);
  const count = Math.max(1, Math.ceil(total / (1 / 60))),
    h = total / count;
  const helmDirection = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  const tired = (s.fatigue || 0) >= 100;
  // engine.js input(): once per frame, 1/s of rudder command in real time.
  s.rudderCmd = Number.isFinite(keys.helm)
    ? clamp(keys.helm, -1, 1)
    : clamp((s.rudderCmd ?? s.rudder ?? 0) + helmDirection * clamp(dt, 0, 0.05), -1, 1);
  for (let i = 0; i < count; i++) {
    if (s.moored) {
      s.u = s.v = s.r = 0;
      s.rudder += (s.rudderCmd - s.rudder) * Math.min(1, h * 1.5);
      s.braking = false;
      continue;
    }
    // Stuurmachine: volgt de opdracht; oververmoeid traag en slingerend, klemmend roer blijft staan.
    if (!(s.jamT > 0))
      s.rudder +=
        (s.rudderCmd + (tired ? Math.sin((s.clock || 0) * 0.7) * 0.15 : 0) - s.rudder) *
        Math.min(1, h * (tired ? 0.6 : 1.5));
    const sn = Math.sin(s.h),
      cs = Math.cos(s.h);
    // Ground velocity in world frame, then relative to the water.
    const c = currentAt(s.x, s.z);
    const gx = sn * s.u + cs * s.v,
      gz = -cs * s.u + sn * s.v;
    const rx = gx - c.x,
      rz = gz - c.z;
    let u = rx * sn - rz * cs,
      v = rx * cs + rz * sn;
    // engine.js: cargo relative to the job's target load (full = 45 % slower response).
    const load = clamp(s.cargo / Math.max(1, s.target || p.tankCapacity), 0, 1);
    const massK = 1 / (1 + 0.45 * load);
    // AFSTOPPEN in schippersstand: hulpje dat de telegraaf naar volle kracht achteruit zet
    // tot het schip stil ligt, via de echte keerkoppeling. Geen magische rem.
    let wanted = tele;
    if (s.braking) {
      wanted = u > 0.25 ? -0.6 : u < -0.25 ? 0.3 : 0;
      if (Math.abs(u) <= 0.25 && Math.abs(s.rpm) < 0.05) {
        s.braking = false;
        s.teleIdx = 3;
        wanted = 0;
      }
    }
    s.tele = wanted;
    const want = Math.sign(wanted);
    // engine.js: blackout = engine stops at 0.5/s, no clutch, no bow thruster.
    // Engine switched off (O): it runs down like a blackout and ignores the telegraph.
    if (s.blackout > 0 || s.engineOff) s.rpm += clamp(-s.rpm, -0.5 * h, 0.5 * h);
    else if (s.startT > 0) s.startT -= h;
    else if (want !== 0 && s.engDir !== want) {
      const wasRunning = s.engDir !== 0;
      if (Math.abs(s.rpm) > 0.01) s.rpm += clamp(-s.rpm, -0.2 * h, 0.2 * h);
      else {
        s.rpm = 0;
        s.engDir = want;
        s.startT = wasRunning ? 2.5 : 1.2;
        onClutch(wasRunning);
      }
    } else {
      const rate = Math.abs(wanted) > Math.abs(s.rpm) ? 0.07 : 0.12;
      s.rpm += clamp(wanted - s.rpm, -rate * h, rate * h);
      if (want === 0 && Math.abs(s.rpm) < 0.01) {
        s.rpm = 0;
        s.engDir = 0;
      }
    }
    const DYN = 0.4;
    const motor = p.motor * (up.motor || 1),
      bowK = p.bow * (up.bow || 1);
    const thrust =
      Math.sign(s.rpm) *
      Math.pow(Math.abs(s.rpm), 1.6) *
      motor *
      massK *
      DYN *
      (s.rpm < 0 ? 0.7 : 1);
    const du0 = thrust - (0.08 * u * Math.abs(u) + 0.05 * u) * DYN;
    // Speeding up (force along the motion, or from rest): feel.up; slowing: feel.down.
    const du = du0 * (du0 * u >= 0 ? feel.up : feel.down);
    const dv = -1.2 * v * Math.abs(v) - 0.9 * v;
    let wu = 0,
      wv = 0;
    if (env.wind && (env.wind.x || env.wind.z)) {
      const k = 1.4 - 0.7 * load;
      wu = (env.wind.x * sn - env.wind.z * cs) * k * 0.35;
      wv = (env.wind.x * cs + env.wind.z * sn) * k * 0.35;
    }
    const flow = clamp(u + (s.rpm > 0 ? s.rpm * 2.0 : 0), -4, 6);
    const rudDeg = s.rudder * SHIP.maxRudder,
      rudEff = Math.sin((rudDeg * Math.PI) / 180) / Math.sin((35 * Math.PI) / 180),
      rudDrag = Math.pow(Math.abs(s.rudder), 2) * 0.35;
    const rudForce = rudEff * flow * Math.abs(flow) * 0.09;
    const bow = s.blackout > 0 ? 0 : (keys.bowR ? 1 : 0) - (keys.bowL ? 1 : 0);
    const bowF = 0.04 * bowK * Math.max(0, 1 - Math.abs(u) / 3.5);
    const yawK = yawFactor(p);
    const dr = (rudForce * 0.06 + bow * bowF) * yawK - s.r * 0.9 - s.r * Math.abs(s.r) * 2.0;
    u += (du + wu - rudDrag * u * Math.abs(u) * 0.06) * h;
    v += (dv + wv - rudForce * 0.3 + bow * bowF * 4.5) * h;
    s.r += dr * h;
    // Stroomschering: kop en hek in verschillende stroom geven een draaimoment.
    const Lp = p.length * 0.45,
      cb = currentAt(s.x + sn * Lp, s.z - cs * Lp),
      ct = currentAt(s.x - sn * Lp, s.z + cs * Lp);
    const shear = (cb.x - ct.x) * cs + (cb.z - ct.z) * sn;
    s.r += shear * 0.07 * h;
    // Back to ground frame.
    const wx = sn * u + cs * v + c.x,
      wz = -cs * u + sn * v + c.z;
    s.h += s.r * h;
    s.x += wx * h;
    s.z += wz * h;
    const ns = Math.sin(s.h),
      nc = Math.cos(s.h);
    s.u = wx * ns - wz * nc;
    s.v = wx * nc + wz * ns;
    if (contact) contact(s, h);
  }
}
