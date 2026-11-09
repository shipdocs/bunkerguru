// "Varen naar…": the boring part of a trip is cut out. The ship is carried along the
// route advice to an approach point short of the destination (or of a closed bridge or
// lock); time, tide, traffic and rivals move on as if you had sailed it. Manoeuvring,
// berthing and every interesting decision stay with the player.
import { waterAt, currentAt, tideSpeed } from '../maps/index.mjs';
import { routePoints, LOGIC, CLOCK_RATE, MAP } from './harbor.mjs';
import { updateTraffic } from './traffic.mjs';
import { updateGates } from './gates.mjs';
import { updateRivals } from './rivals.mjs';
import { target } from './simulation.mjs';
import { berthOf } from './harbor.mjs';
export const FAST_MIN_DISTANCE = 450, // closer than this: just sail
  APPROACH = 280, // stop this far (along the route) before the destination
  CRUISE = 5.0; // m/s over the cut-out stretch

function crossesGate(a, b, g) {
  // Segment a→b against the gate rectangle (sampled; gates are short).
  const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 10));
  for (let i = 0; i <= n; i++) {
    const x = a.x + ((b.x - a.x) * i) / n,
      z = a.z + ((b.z - a.z) * i) / n;
    if (x > g.x0 - 5 && x < g.x1 + 5 && z > g.z0 - 5 && z < g.z1 + 5) return i / n;
  }
  return -1;
}
export function planFastTravel(s, world) {
  const t = target(s);
  if (!t) return { ok: false, why: 'Geen bestemming: kies eerst een klus (N).' };
  if (s.moored) return { ok: false, why: 'Gooi eerst los (M).' };
  if (s.phase === 'sunk') return { ok: false, why: '' };
  if (Math.hypot(t.x - s.x, t.z - s.z) < FAST_MIN_DISTANCE)
    return { ok: false, why: 'Je bent er bijna – dit stuk vaar je zelf.' };
  const pts = routePoints(s, t);
  const segs = [];
  let total = 0,
    stopAt = Infinity,
    gateName = null;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i],
      b = pts[i + 1],
      len = Math.hypot(b.x - a.x, b.z - a.z);
    for (const g of world.gates)
      if (g.state !== 'open') {
        const f = crossesGate(a, b, g);
        if (f >= 0 && total + f * len < stopAt) {
          stopAt = total + f * len - 200;
          gateName = g.name;
        }
      }
    segs.push({ a, b, len, at: total });
    total += len;
  }
  // With a strong current you arrive further out: more room to stop or turn.
  let dist = Math.min(total - APPROACH - 70 * Math.abs(s.tideSpeed || 0), stopAt);
  // Back off until the hull has room on all sides.
  for (; dist > 0; dist -= 40) {
    const sg = segs.find((q) => dist >= q.at && dist <= q.at + q.len) || segs[segs.length - 1];
    const f = Math.max(0, Math.min(1, (dist - sg.at) / sg.len));
    const x = sg.a.x + (sg.b.x - sg.a.x) * f,
      z = sg.a.z + (sg.b.z - sg.a.z) * f;
    const h = Math.atan2(sg.b.x - sg.a.x, -(sg.b.z - sg.a.z));
    const bowX = x + Math.sin(h) * 55,
      bowZ = z - Math.cos(h) * 55,
      sternX = x - Math.sin(h) * 55,
      sternZ = z + Math.cos(h) * 55;
    const busy = [...world.traffic, ...world.rivals.filter((r) => r.mode !== 'sunk')].some(
      (o) => Math.hypot(o.x - x, o.z - z) < 70 + (o.length || 110) / 2,
    );
    // A destination inside a basin: stop on the river in front of the mouth, so the
    // turn into the basin (with the current on the beam) is the player's own.
    const inBasinTarget = Math.abs(t.z) > MAP.riverHalf,
      onRiver = Math.abs(z) < MAP.riverHalf - 20;
    const sameBasin = Math.abs(s.z) > MAP.riverHalf && Math.abs(s.x - t.x) < 400;
    if (inBasinTarget && !onRiver && !sameBasin) continue;
    if (!busy && waterAt(x, z, 20) && waterAt(bowX, bowZ, 12) && waterAt(sternX, sternZ, 12))
      return { ok: true, x, z, h, dist, target: t, gateName };
  }
  return { ok: false, why: 'Hier valt niets door te varen – dit stuk vaar je zelf.' };
}
// Carry the ship along and let the world move on. Returns the toast text.
export function fastTravel(s, world, fx = {}) {
  const p = planFastTravel(s, world);
  if (!p.ok) return p.why;
  const simSeconds = p.dist / CRUISE;
  // The world keeps turning: traffic, bridges, locks and the rivals.
  const boats = () => [s, ...world.rivals.filter((r) => r.mode !== 'sunk')];
  let stolen = null;
  for (let t = 0; t < simSeconds; ) {
    const dt = Math.min(0.25, simSeconds - t);
    // A ghost of the player moves along so traffic and rivals react sensibly.
    s.x += ((p.x - s.x) * dt) / (simSeconds - t);
    s.z += ((p.z - s.z) * dt) / (simSeconds - t);
    updateTraffic(world.traffic, dt, boats());
    updateGates(world.gates, dt, boats());
    stolen = updateRivals(world.rivals, dt, s, world.traffic, {}, world.gates) || stolen;
    t += dt;
  }
  const logic = simSeconds * LOGIC;
  s.clock = (s.clock || 0) + simSeconds;
  s.tideSpeed = tideSpeed(s.clock, s.tidePhase); // the tide turned on the way, perhaps
  s.elapsed = (s.elapsed || 0) + logic;
  // Breakdowns run their course while you sail (engine.js counts them in logic seconds).
  if (s.blackout > 0) s.blackout = Math.max(0, s.blackout - logic);
  if (s.jamT > 0) s.jamT = Math.max(0, s.jamT - logic);
  if (MAP.id !== 'training') s.fatigue = Math.min(100, (s.fatigue || 0) + (logic * 100) / 1500);
  if (s.phase === 'sail' && s.damage >= 40 && s.cargo > 0 && MAP.id !== 'training')
    s.cargo = Math.max(0, s.cargo - ((logic * (s.damage - 30)) / 70) * 1.2);
  // Dead slow ahead, 1.2 m/s through the water; over the ground the current adds.
  const c = currentAt(p.x, p.z, s.tideSpeed || 0);
  const along = c.x * Math.sin(p.h) - c.z * Math.cos(p.h),
    across = c.x * Math.cos(p.h) + c.z * Math.sin(p.h);
  Object.assign(s, {
    x: p.x,
    z: p.z,
    h: p.h,
    u: 1.2 + along,
    v: across,
    r: 0,
    rpm: 0.15,
    tele: 0.15,
    teleIdx: 4,
    engDir: 1,
    startT: 0,
    rudder: 0,
    rudderCmd: 0,
    braking: false,
    hitCD: 0,
  });
  const mins = Math.round((logic / 60) * CLOCK_RATE);
  if (stolen && s.job && s.phase !== 'done') {
    // A racing rival got alongside first while you were on the way.
    const name = berthOf(s).name;
    s.job = null;
    s.phase = 'free';
    fx.sound?.('alarm', 2);
    fx.board?.();
    return (
      '⏩ ' +
      mins +
      ' min later… ' +
      stolen.rival.name +
      ' lag al langszij ' +
      name +
      ' – klus kwijt!'
    );
  }
  fx.sound?.('horn');
  return (
    '⏩ ' +
    mins +
    ' min later' +
    (p.gateName ? ', voor de ' + p.gateName + ' (C = oproepen)' : ' bij ' + p.target.name) +
    '. ZEER LANGZAAM VOORUIT – de rest is aan jou.'
  );
}
