import { timeScaleOf } from './time-scale.mjs';
import { hullContacts, trafficContacts } from './collisions.mjs';
import { vesselStep } from './vessel.mjs';
import {
  terminal,
  receiver,
  berths,
  loadingTerminal,
  acceptContract,
  settle,
  trafficAt,
} from './harbor.mjs';
export { terminal, receiver };
import { clamp } from './math.mjs';
export { clamp } from './math.mjs';
export { fresh, restore } from './state.mjs';
export function target(s) {
  return s.phase === 'load' ? loadingTerminal(s) : berths[s.berthIndex] || receiver;
}
export function readiness(s) {
  let t = target(s);
  return {
    distance: Math.hypot(s.x - t.x, s.z - t.z),
    speed: Math.hypot(s.u, s.v) * 3.6,
    angle: (Math.acos(Math.abs(Math.cos(s.h - (t.h || 0)))) * 180) / Math.PI,
  };
}
export function act(s) {
  if (s.moored) {
    if (s.pumping) return 'Wacht tot de overslag klaar is.';
    s.moored = false;
    return 'Trossen los. Goede vaart!';
  }
  const q = readiness(s),
    dock = loadingTerminal(s),
    atTerminal = Math.hypot(s.x - dock.x, s.z - dock.z) <= 25;
  if (q.distance > 25 && !atTerminal)
    return 'Vaar naar de gemarkeerde ligplaats of de laadterminal.';
  if (q.speed > 2) return 'Eerst afstoppen tot onder 2 km/u.';
  if ((atTerminal ? (Math.acos(Math.abs(Math.cos(s.h))) * 180) / Math.PI : q.angle) > 20)
    return 'Ga parallel aan de kade of het zeeschip liggen.';
  s.moored = true;
  s.braking = false;
  s.u = s.v = s.r = s.tele = s.rpm = 0;
  s.teleIdx = 3;
  s.engDir = 0;
  s.startT = 0;
  return atTerminal
    ? 'Vast aan de terminal. Laden en onderhoud beschikbaar.'
    : 'Vastgemaakt. Start de overslag.';
}
export function pump(s) {
  if (!s.moored) return 'Maak eerst vast met het anker.';
  if (s.phase === 'done') return 'Neem eerst een nieuwe opdracht aan.';
  if (readiness(s).distance > 25) return 'Vaar eerst naar de juiste overslagplaats.';
  if (s.damage >= 100) return 'Je schip is onbruikbaar. Roep pechhulp op.';
  s.pumping = true;
  return s.phase === 'load' ? 'Laden gestart.' : 'Bunkeren gestart.';
}
export function next(s) {
  return acceptContract(s, 'regular');
}
export function step(s, dt, keys = {}, onClutch) {
  dt = clamp(dt, 0, 0.05);
  const scale = timeScaleOf(s);
  s.clock = (s.clock || 0) + dt * scale;
  if (s.phase !== 'done') s.elapsed = (s.elapsed || 0) + dt * scale;
  if (s.damage >= 100) {
    s.tele = 0;
    s.teleIdx = 3;
  }
  vesselStep(
    s,
    dt,
    keys,
    (b, d) => {
      hullContacts(b, d);
      trafficContacts(b, trafficAt(s.clock));
    },
    onClutch,
  );
  if (s.moored) {
    s.u = s.v = s.r = 0;
    if (s.pumping) {
      const rate = (25 + s.level * 10) * dt * scale;
      if (s.phase === 'load') {
        s.cargo = Math.min(s.target, s.cargo + rate);
        if (s.cargo >= s.target) {
          s.phase = 'deliver';
          s.pumping = false;
        }
      } else if (s.phase === 'deliver') {
        s.cargo = Math.max(0, s.cargo - rate);
        if (s.cargo <= 0) settle(s);
      }
    }
    return;
  }
  if (s.damage >= 100) {
    s.u *= Math.exp(-dt * 3);
  }
}
export function recover(s) {
  s.braking = false;
  s.x = terminal.x;
  s.z = terminal.z;
  s.h = 0;
  s.u = s.v = s.r = s.rpm = s.tele = s.rudder = s.rudderCmd = s.engDir = s.startT = 0;
  s.teleIdx = 3;
  s.moored = true;
  s.pumping = false;
  s.phase = 'load';
  s.cargo = 0;
  s.damage = 0;
  s.elapsed = 0;
  s.startDamage = 0;
  s.gold = Math.max(0, s.gold - 100);
}
