// Reference-only adapter. The exact original equations are protected by tests/legacy-physics.cjs.
import { SHIP, toWorld, profileOf, yawFactor } from './ship-profile.mjs';
import { TELE } from './telegraph.mjs';
export function legacyVesselStep(s, dt, keys = {}, contact, onClutch = () => {}) {
  const profile = profileOf(s);
  s.rudderCmd ??= s.rudder;
  if (keys.left) s.rudderCmd = Math.max(-1, s.rudderCmd - dt);
  if (keys.right) s.rudderCmd = Math.min(1, s.rudderCmd + dt);
  const c = Math.cos(s.h),
    n = Math.sin(s.h);
  const boat = {
    x: -s.z,
    y: s.x,
    hdg: s.h,
    vx: s.u * c - s.v * n,
    vy: s.u * n + s.v * c,
    r: s.r,
    rudder: s.rudder,
    rudderCmd: s.rudderCmd,
    tele: TELE[s.teleIdx ?? 3],
    rpm: s.rpm,
    engDir: s.engDir ?? Math.sign(s.rpm),
    startT: s.startT ?? 0,
    bow: s.moored ? 0 : (keys.bowL ? -1 : 0) + (keys.bowR ? 1 : 0),
    L: profile.length,
    B: profile.beam,
    cargo: s.cargo,
    target: s.target || 500,
    fatigue: 0,
  };
  const moored = s.moored,
    state = { hitCD: 0 },
    WX = { wind: { x: 0, y: 0 } },
    EV = {},
    simClock = 0;
  const RUD_MAX = SHIP.maxRudder,
    toPx = toWorld,
    currentAt = () => ({ vx: 0, vy: 0 }),
    up = (k) => (k === 'motor' ? profile.motor : profile.bow),
    SND = {
      clutch(reversing) {
        onClutch(reversing);
      },
    };
  // Real time by default. The 3× option changes tempo, not handling rules.
  const timeScale = s.timeScale === SHIP.legacyTimeScale ? SHIP.legacyTimeScale : 1;
  for (let i = 0; i < timeScale; i++) {
    physics(dt);
    if (contact && !moored) {
      const collisionState = {
        x: boat.y,
        z: -boat.x,
        h: boat.hdg,
        r: boat.r,
        u: boat.vx * Math.cos(boat.hdg) + boat.vy * Math.sin(boat.hdg),
        v: -boat.vx * Math.sin(boat.hdg) + boat.vy * Math.cos(boat.hdg),
        damage: s.damage,
        hitCD: s.hitCD || 0,
        shipId: profile.id,
      };
      contact(collisionState, dt);
      boat.x = -collisionState.z;
      boat.y = collisionState.x;
      boat.r = collisionState.r;
      boat.vx = collisionState.u * Math.cos(boat.hdg) - collisionState.v * Math.sin(boat.hdg);
      boat.vy = collisionState.u * Math.sin(boat.hdg) + collisionState.v * Math.cos(boat.hdg);
      s.damage = collisionState.damage;
      s.hitCD = collisionState.hitCD;
    }
  }
  s.x = boat.y;
  s.z = -boat.x;
  s.h = boat.hdg;
  s.r = boat.r;
  s.rudder = boat.rudder;
  s.rpm = boat.rpm;
  s.engDir = boat.engDir;
  s.startT = boat.startT;
  s.u = boat.vx * Math.cos(s.h) + boat.vy * Math.sin(s.h);
  s.v = -boat.vx * Math.sin(s.h) + boat.vy * Math.cos(s.h);
  function physics(dt) {
    const b = boat;
    if (state.hitCD > 0) state.hitCD -= dt;
    if (moored) {
      b.vx = b.vy = b.r = 0;
      b.rudder += (b.rudderCmd - b.rudder) * Math.min(1, dt * 1.5);
      return;
    }
    const tired = b.fatigue >= 100;
    if (!(b.jamT > 0))
      b.rudder +=
        (b.rudderCmd + (tired ? Math.sin(simClock * 0.7) * 0.15 : 0) - b.rudder) *
        Math.min(1, dt * (tired ? 0.6 : 1.5)); // oververmoeid: traag en slingerend; klemmend roer blijft staan roer
    const cos = Math.cos(b.hdg),
      sin = Math.sin(b.hdg);
    const c = currentAt(b.x, b.y);
    const rvx = b.vx - c.vx,
      rvy = b.vy - c.vy;
    let u = rvx * cos + rvy * sin,
      v = -rvx * sin + rvy * cos;
    const massK = 1 / (1 + 0.45 * (b.cargo / Math.max(1, b.target))); // geladen = trager optrekken en afstoppen
    // motor volgt de telegraaf traag (langzaamloper: toeren op- en afbouwen kost tijd), vermogen 'rpm' in plaats van de stand zelf
    // omkeren via de pneumatische keerkoppeling: koppeling ontluchten (vermogen naar nul), motor loopt stationair door, dan de andere kant inkoppelen
    if (b.rpm === undefined) {
      b.rpm = b.tele;
      b.engDir = Math.sign(b.tele);
      b.startT = 0;
    }
    if (b.blackout > 0) {
      b.rpm += Math.max(-0.5 * dt, Math.min(0.5 * dt, -b.rpm));
      b.bow = 0;
    } else {
      const want = Math.sign(b.tele);
      if (b.startT > 0) {
        b.startT -= dt;
      } // koppeling schakelt om: even geen vermogen op de schroef
      else if (want !== 0 && b.engDir !== want) {
        // andere richting gevraagd: eerst uitkoppelen naar nul, dan inkoppelen
        const wasRunning = b.engDir !== 0;
        if (Math.abs(b.rpm) > 0.01) b.rpm += Math.max(-0.2 * dt, Math.min(0.2 * dt, -b.rpm));
        else {
          b.rpm = 0;
          b.engDir = want;
          b.startT = wasRunning ? 2.5 : 1.2;
          SND.clutch(wasRunning);
        }
      } else {
        const rate = Math.abs(b.tele) > Math.abs(b.rpm) ? 0.07 : 0.12;
        b.rpm += Math.max(-rate * dt, Math.min(rate * dt, b.tele - b.rpm));
        if (want === 0 && Math.abs(b.rpm) < 0.01) {
          b.rpm = 0;
          b.engDir = 0;
        }
      }
    }
    let wu = 0,
      wv = 0;
    const DYN = 0.4; // massatraagheid: stuwkracht én weerstand lager → zelfde topsnelheid, langzamer optrekken en uitlopen
    const maxThrust = up('motor') * massK * DYN,
      thrust =
        Math.sign(b.rpm) * Math.pow(Math.abs(b.rpm), 1.6) * maxThrust * (b.rpm < 0 ? 0.7 : 1); // niet-lineair: lage standen blijven traag, vol gas ~31 km/h
    const du = thrust - (0.08 * u * Math.abs(u) + 0.05 * u) * DYN;
    const dv = -1.2 * v * Math.abs(v) - 0.9 * v;
    {
      const wxx = WX.wind.x + (EV.wind ? EV.wind.x : 0),
        wyy = WX.wind.y + (EV.wind ? EV.wind.y : 0);
      if (wxx || wyy) {
        const k = 1.4 - 0.7 * (b.cargo / Math.max(1, b.target)),
          c = Math.cos(b.hdg),
          sn = Math.sin(b.hdg);
        wu = (wxx * c + wyy * sn) * k * 0.35;
        wv = (-wxx * sn + wyy * c) * k * 0.35;
      }
    }
    const flow = Math.max(-4, Math.min(6, u + (b.rpm > 0 ? b.rpm * 2.0 : 0))); // plafond: geen tolboot op volle vaart
    // roer tot 60°: roerkracht ~ sin(hoek), genormeerd zodat 35° gelijk blijft aan vroeger; bij grote hoeken extra weerstand (vaartverlies)
    const rudDeg = b.rudder * RUD_MAX,
      rudEff = Math.sin((rudDeg * Math.PI) / 180) / Math.sin((35 * Math.PI) / 180),
      rudDrag = Math.pow(Math.abs(b.rudder), 2) * 0.35;
    // Original-source rudder gain, retained for the parity oracle.
    const helmGain = 1;
    const rudForce = rudEff * flow * Math.abs(flow) * 0.09 * helmGain;
    const bowF = 0.04 * up('boeg') * Math.max(0, 1 - Math.abs(u) / 3.5); // boegschroef verliest kracht boven ~2 m/s vaart door het water
    const yawK = yawFactor(profile); // langer schip: meer traagheid om de as, draait trager
    const dr =
      ((rudForce * 0.06 + b.bow * bowF) * yawK - b.r * 0.9 - b.r * Math.abs(b.r) * 2.0) * 1;
    u += (du + wu - rudDrag * u * Math.abs(u) * 0.06 * 1) * dt;
    v += (dv + wv - rudForce * 0.3 + b.bow * bowF * 4.5) * dt;
    b.r += dr * dt;
    // stroomschering: kop en hek in verschillende stroom (bekkenmond, oever) geeft een draaimoment
    const Lp = toPx(b.L) * 0.45,
      cb = currentAt(b.x + cos * Lp, b.y + sin * Lp),
      cst = currentAt(b.x - cos * Lp, b.y - sin * Lp);
    const shear = -(cb.vx - cst.vx) * sin + (cb.vy - cst.vy) * cos; // dwarscomponent verschil, m/s
    b.r += shear * 0.07 * dt; // stroomverschil over de scheepslengte grijpt de kop
    b.vx = u * cos - v * sin + c.vx;
    b.vy = u * sin + v * cos + c.vy;
    b.hdg += b.r * dt;
    b.x += toPx(b.vx) * dt;
    b.y += toPx(b.vy) * dt;
  }
}
