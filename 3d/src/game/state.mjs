import { DEFAULT_TEMPO, TEMPOS } from './time-scale.mjs';
import { MAP, terminals, waits } from './harbor.mjs';
import { waterAt, worldPose } from '../maps/index.mjs';
import { clamp } from './math.mjs';
import { INERTIA, CURRENTS, DEFAULT_INERTIA, DEFAULT_CURRENT } from './feel-settings.mjs';
import { restoreEquipment } from './vessel-equipment.mjs';
// 6: the position is saved in the warped world (bends, leaning basins). A version 5
// save holds the same place on the straight map and is carried over.
export const STATE_VERSION = 6;
// One career, saved per browser. Position belongs to the map it was saved on.
export function fresh() {
  const st = MAP.start;
  return {
    version: STATE_VERSION,
    mapId: MAP.id,
    // A harbour rebuilt on its real outline has a new layout: older voyages there
    // (berths, positions) do not carry over.
    ...(MAP.layout ? { layout: MAP.layout } : {}),
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
    inertia: DEFAULT_INERTIA,
    currentFeel: DEFAULT_CURRENT,
    shipId: 'legacy',
    equipment: restoreEquipment(),
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
    tidePhase: 0.1, // a new career casts off at slack water, the ebb building up
    rivals: [],
    fleet: [],
    fleetMap: null,
    // engine.js: clock = 6:00 plus 0–7 whole hours, so dusk and night come sooner or later.
    startHour: (6 + Math.floor(Math.random() * 8)) * 3600,
    shift: null, // leaderboard: made on the first finished job (ranking.mjs)
    trainingDone: false,
    pumping: false,
    xp: 0,
    news: [],
    paperJobs: 0,
    paperIssue: 0,
  };
}
function startBerth() {
  const st = MAP.mstart;
  const w = waits.find((w) => st.x > w.x0 && st.x < w.x1 && st.z > w.z0 && st.z < w.z1);
  if (w) return { kind: 'wait', id: w.id };
  const t = terminals.find((w) => st.x > w.x0 && st.x < w.x1 && st.z > w.z0 && st.z < w.z1);
  return t ? { kind: 'terminal', id: t.id } : null;
}
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
export function restore(raw) {
  const s = fresh();
  if (!raw || typeof raw !== 'object') return s;
  s.equipment = restoreEquipment(raw.equipment);
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
  if (INERTIA.some((o) => o.id === raw.inertia)) s.inertia = raw.inertia;
  if (CURRENTS.some((o) => o.id === raw.currentFeel)) s.currentFeel = raw.currentFeel;
  if (TEMPOS.includes(raw.timeScale)) s.timeScale = raw.timeScale;
  if (typeof raw.trainingDone === 'boolean') s.trainingDone = raw.trainingDone;
  // Career (fase 2). Careers from before get points for the jobs they already did.
  s.xp = isNum(raw.xp) ? Math.max(0, raw.xp) : s.jobs * 150;
  if (Array.isArray(raw.news)) s.news = raw.news.slice(-40);
  for (const k of ['paperJobs', 'paperIssue']) if (isNum(raw[k])) s[k] = raw[k];
  const sameLayout = (raw.layout || null) === (MAP.layout || null);
  // Rivals keep their money everywhere, their position only on the same map.
  if (Array.isArray(raw.rivals))
    s.rivals = raw.rivals.map((r) =>
      raw.mapId === MAP.id && sameLayout ? r : { gold: r?.gold, jobs: r?.jobs },
    );
  // Your own boats (fase 4) belong to the career: kept on every map.
  if (Array.isArray(raw.fleet))
    s.fleet = raw.fleet.filter((b) => b && typeof b === 'object').slice(0, 2);
  if (typeof raw.fleetMap === 'string') s.fleetMap = raw.fleetMap;
  // Careers from before this field keep their 6:00 start: their clock must not jump.
  s.startHour = isNum(raw.startHour) ? raw.startHour : 6 * 3600;
  // The running shift counts for the harbour it was sailed in; elsewhere a new one starts.
  if (raw.shift && raw.shift.mapId === MAP.id && isNum(raw.shift.id) && isNum(raw.shift.score))
    s.shift = {
      id: raw.shift.id,
      mapId: MAP.id,
      score: Math.max(0, raw.shift.score),
      jobs: Math.max(0, Math.floor(raw.shift.jobs) || 0),
    };
  if (isNum(raw.rudderCmd)) s.rudderCmd = clamp(raw.rudderCmd, -1, 1);
  s.rudder = isNum(raw.rudder) ? clamp(raw.rudder, -1, 1) : s.rudderCmd;
  // Voyage state only on the same map and save version. A version 5 voyage was sailed
  // on the straight map: the boat is put at the same spot in the warped harbour.
  const at =
    raw.version === 5 && isNum(raw.x) && isNum(raw.z)
      ? worldPose({ x: raw.x, z: raw.z, h: isNum(raw.h) ? raw.h : MAP.mstart.h })
      : { x: raw.x, z: raw.z, h: isNum(raw.h) ? raw.h : s.h };
  if (
    (raw.version === STATE_VERSION || raw.version === 5) &&
    raw.mapId === MAP.id &&
    sameLayout &&
    isNum(at.x) &&
    isNum(at.z) &&
    waterAt(at.x, at.z, 4)
  ) {
    Object.assign(s, { x: at.x, z: at.z, h: at.h });
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
    s.jobHit = raw.jobHit === true;
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
