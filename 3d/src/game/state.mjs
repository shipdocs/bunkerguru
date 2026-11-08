import { timeScaleOf, DEFAULT_TEMPO } from './time-scale.mjs';
import { hullContacts } from './collisions.mjs';
import { terminal, berths, HARBOR, contractOf } from './harbor.mjs';
import { clamp } from './math.mjs';
export function fresh() {
  return {
    x: terminal.x,
    z: terminal.z,
    h: 0,
    u: 0,
    v: 0,
    r: 0,
    rpm: 0,
    tele: 0,
    teleIdx: 3,
    engDir: 0,
    startT: 0,
    rudderCmd: 0,
    rudder: 0,
    cargo: 0,
    gold: 300,
    jobs: 0,
    damage: 0,
    phase: 'load',
    moored: true,
    pumping: false,
    level: 0,
    shipId: 'legacy',
    handlingVersion: 1,
    braking: false,
    mapVersion: HARBOR.version,
    timeScale: DEFAULT_TEMPO,
    paceVersion: 1,
    hitCD: 0,
    contractId: 'regular',
    berthIndex: 0,
    target: 500,
    elapsed: 0,
    clock: 0,
    startDamage: 0,
    earned: 0,
    reputation: 50,
    goalClaimed: false,
    lastPayout: 0,
    lastLate: false,
    lastClean: true,
  };
}
export function restore(raw) {
  const s = fresh();
  if (!raw || typeof raw !== 'object') return s;
  for (const k of Object.keys(s))
    if (typeof raw[k] === typeof s[k] && (typeof raw[k] !== 'number' || Number.isFinite(raw[k])))
      s[k] = raw[k];
  s.shipId = 'legacy';
  s.phase = ['load', 'deliver', 'done'].includes(s.phase) ? s.phase : 'load';
  s.contractId = ['regular', 'express', 'small'].includes(s.contractId) ? s.contractId : 'regular';
  s.berthIndex = clamp(Math.floor(s.berthIndex), 0, berths.length - 1);
  s.target = contractOf(s).tonnes;
  s.cargo = clamp(s.cargo, 0, s.target);
  s.damage = clamp(s.damage, 0, 100);
  s.level = clamp(Math.floor(s.level), 0, 3);
  s.gold = Math.max(0, s.gold);
  s.jobs = Math.max(0, Math.floor(s.jobs));
  s.clock = Math.max(0, s.clock);
  s.elapsed = Math.max(0, s.elapsed);
  s.reputation = clamp(s.reputation, 0, 100);
  if (raw.mapVersion !== HARBOR.version || raw.shipId !== 'legacy') {
    s.x = terminal.x;
    s.z = terminal.z;
    s.h = 0;
    s.moored = true;
    s.elapsed = 0;
  }
  s.mapVersion = HARBOR.version;
  s.x = clamp(s.x, -HARBOR.halfWidth + 30, HARBOR.halfWidth - 30);
  s.z = clamp(s.z, -HARBOR.halfLength + 30, HARBOR.halfLength - 30);
  s.timeScale = raw.paceVersion === 1 ? timeScaleOf(s) : DEFAULT_TEMPO;
  s.paceVersion = 1;
  s.handlingVersion = 1;
  s.braking = false;
  s.rudder = clamp(s.rudder, -1, 1);
  s.rudderCmd = clamp(s.rudderCmd, -1, 1);
  s.u = s.v = s.r = s.rpm = s.tele = s.engDir = s.startT = 0;
  s.teleIdx = 3;
  s.pumping = false;
  hullContacts(s, 0);
  return s;
}
