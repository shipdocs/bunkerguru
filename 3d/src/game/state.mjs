import { DEFAULT_TEMPO, TEMPOS } from './time-scale.mjs';
import { MAP, terminals, waits } from './harbor.mjs';
import { waterAt } from '../maps/index.mjs';
import { clamp } from './math.mjs';
export const STATE_VERSION = 5;
// One career, saved per browser. Position belongs to the map it was saved on.
export function fresh() {
  const st = MAP.start;
  return {
    version: STATE_VERSION,
    mapId: MAP.id,
    x: st.x,
    z: st.z,
    h: st.h,
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
    braking: false,
    handling: 'schipper',
    shipId: 'legacy',
    timeScale: DEFAULT_TEMPO,
    moored: !!startBerth(),
    mooredTo: startBerth(),
    cargo: 0,
    target: 800,
    damage: 0,
    fatigue: 0,
    hitCD: 0,
    gold: 300,
    jobs: 0,
    earned: 0,
    lvl: { motor: 0, boeg: 0, tanks: 0, fender: 0, pomp: 0 },
    rep: {},
    day: { jobs: 0, onTime: 0, clean: 0, goalDone: false },
    phase: 'free',
    job: null,
    offers: [],
    lastJob: null,
    holdT: 0,
    bunkerT: 0,
    doneT: 0,
    deliver: 0,
    jobDamage: 0,
    vtsBonus: 0,
    clock: 0,
    tidePhase: 1.3,
    rivals: [],
    trainingDone: false,
    pumping: false,
  };
}
function startBerth() {
  const st = MAP.start;
  const w = waits.find((w) => st.x > w.x0 && st.x < w.x1 && st.z > w.z0 && st.z < w.z1);
  if (w) return { kind: 'wait', id: w.id };
  const t = terminals.find((w) => st.x > w.x0 && st.x < w.x1 && st.z > w.z0 && st.z < w.z1);
  return t ? { kind: 'terminal', id: t.id } : null;
}
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
export function restore(raw) {
  const s = fresh();
  if (!raw || typeof raw !== 'object') return s;
  // Career survives everything: money, jobs, upgrades, reputation, settings.
  for (const k of ['gold', 'jobs', 'earned', 'clock', 'tidePhase'])
    if (isNum(raw[k])) s[k] = raw[k];
  s.gold = Math.max(0, s.gold);
  s.jobs = Math.max(0, Math.floor(s.jobs));
  if (raw.lvl && typeof raw.lvl === 'object')
    for (const k of Object.keys(s.lvl)) s.lvl[k] = clamp(Math.floor(raw.lvl[k] || 0), 0, 2);
  if (raw.rep && typeof raw.rep === 'object') s.rep = { ...raw.rep };
  if (raw.day && typeof raw.day === 'object') s.day = { ...s.day, ...raw.day };
  if (['schipper', 'arcade'].includes(raw.handling)) s.handling = raw.handling;
  if (TEMPOS.includes(raw.timeScale)) s.timeScale = raw.timeScale;
  if (typeof raw.trainingDone === 'boolean') s.trainingDone = raw.trainingDone;
  if (Array.isArray(raw.rivals)) s.rivals = raw.rivals;
  if (isNum(raw.rudderCmd)) s.rudderCmd = clamp(raw.rudderCmd, -1, 1);
  s.rudder = isNum(raw.rudder) ? clamp(raw.rudder, -1, 1) : s.rudderCmd;
  // Voyage state only on the same map and save version.
  if (
    raw.version === STATE_VERSION &&
    raw.mapId === MAP.id &&
    isNum(raw.x) &&
    isNum(raw.z) &&
    waterAt(raw.x, raw.z, 4)
  ) {
    Object.assign(s, { x: raw.x, z: raw.z, h: isNum(raw.h) ? raw.h : s.h });
    for (const k of [
      'cargo',
      'target',
      'damage',
      'fatigue',
      'deliver',
      'jobDamage',
      'holdT',
      'bunkerT',
      'elapsed',
    ])
      if (isNum(raw[k])) s[k] = raw[k];
    s.damage = clamp(s.damage, 0, 99);
    s.fatigue = clamp(s.fatigue, 0, 100);
    s.moored = !!raw.moored;
    s.mooredTo = raw.moored ? raw.mooredTo || null : null;
    if (['load', 'sail', 'bunker', 'done', 'free'].includes(raw.phase)) s.phase = raw.phase;
    if (raw.job && typeof raw.job === 'object') s.job = raw.job;
    if (Array.isArray(raw.offers)) s.offers = raw.offers;
    if (!s.job && ['load', 'sail', 'bunker'].includes(s.phase)) s.phase = 'free';
    if (s.phase === 'bunker' && !s.moored) s.phase = 'sail';
  }
  // Engine stopped, helm kept: resuming never surprises the skipper.
  s.u = s.v = s.r = s.rpm = s.tele = s.engDir = s.startT = 0;
  s.teleIdx = 3;
  s.braking = false;
  return s;
}
