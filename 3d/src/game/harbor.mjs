// Harbour rules from the 2D game (engine.js): job schedule, clients and reputation,
// shop upgrades and payment. No DOM. Times are "logic seconds" (see LOGIC).
import { jobScore, addJob } from './ranking.mjs';
import {
  MAP,
  terminals,
  waits,
  customers,
  waterRouteM,
  routeToWorld,
  toMap,
  nextHighWater,
} from '../maps/index.mjs';
import { inRectW } from '../maps/index.mjs';
import { xpForJob, gainXp, addNews } from './career.mjs';
export { MAP, terminals, waits, customers };
export const HARBOR = MAP;
export const berths = customers;
// The 2D game ran three physics seconds per real second; its timers (loading,
// pumping, fatigue, tide, deadlines) ran on real seconds. One logic second here is
// three simulated seconds, so at tempo 3× everything feels exactly like the 2D game.
export const LOGIC = 1 / 3;
export const CLOCK_RATE = 16; // logic second → seconds on the harbour clock (a day in 90 min)
export const START_HOUR = 6 * 3600;
export function clockStr(t) {
  t = ((t % 86400) + 86400) % 86400;
  const h = Math.floor(t / 3600),
    m = Math.floor((t % 3600) / 60);
  return h + ':' + String(m).padStart(2, '0');
}
export const dayClock = (s) => START_HOUR + logicTime(s) * CLOCK_RATE;
export const logicTime = (s) => (s.clock || 0) * LOGIC;

export const UPG = {
  motor: {
    name: 'Motor',
    desc: ['Standaard 1200 pk (31 km/u)', 'Zwaardere motor: 38 km/u', 'Racemotor: 46 km/u'],
    cost: [0, 900, 2200],
    val: [1, 9.5 / 6.2, 13.5 / 6.2],
  },
  boeg: {
    name: 'Boegschroef',
    desc: ['Standaard', 'Dubbele boegschroef (+60 %)', 'Kanaalschroef (+130 %)'],
    cost: [0, 500, 1300],
    val: [1, 1.6, 2.3],
  },
  tanks: {
    name: 'Tanks',
    desc: ['1200 t', '1600 t: grotere klussen', '2000 t: de grote jongens'],
    cost: [0, 700, 1600],
    val: [1200, 1600, 2000],
  },
  fender: {
    name: 'Fenders',
    desc: ['Standaard', 'Dikke fenders: schade −30 %', 'Stootkussens: schade −55 %'],
    cost: [0, 600, 1500],
    val: [1, 0.7, 0.45],
  },
  pomp: {
    name: 'Pomp',
    desc: ['Bunkeren 6 s', 'Snelle pomp: 4 s', 'Turbo-pomp: 2,5 s'],
    cost: [0, 400, 1000],
    val: [6, 4, 2.5],
  },
};
export const up = (s, k) => UPG[k].val[s.lvl?.[k] || 0];
export function buy(s, k) {
  const lvl = s.lvl[k] || 0;
  if (!UPG[k]) return 'Onbekend onderdeel.';
  if (lvl >= 2) return UPG[k].name + ' is al maximaal.';
  if (!atTerminal(s)) return 'De winkel zit aan de laadterminal: maak daar vast.';
  const cost = UPG[k].cost[lvl + 1];
  if (s.gold < cost) return 'Te weinig goud: ' + cost + ' 🪙 nodig.';
  s.gold -= cost;
  s.lvl[k] = lvl + 1;
  return '🛠 ' + UPG[k].name + ': ' + UPG[k].desc[lvl + 1];
}

const CLIENTS = [
  'Maasland Shipping',
  'Nordzee Tankers',
  'Delta Lines',
  'Scheldt Carriers',
  'Hanze Bulk',
];
export function clientOf(b) {
  let h = 0;
  for (const ch of b.name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return CLIENTS[h % CLIENTS.length];
}
export const repOf = (s, c) => s.rep?.[c] ?? 50;
export function addRep(s, c, d) {
  s.rep = s.rep || {};
  s.rep[c] = Math.max(0, Math.min(100, repOf(s, c) + d));
}
export const tariff = (s, c) => 0.8 + repOf(s, c) / 250;

export const terminalOf = (s) => terminals[s.job?.terminal ?? 0] || terminals[0];
export const berthOf = (s) => customers[s.job?.berth ?? 0] || customers[0];
// p: a boat in the world; r: a map rectangle (zone, terminal, waiting place).
export const inZone = (p, r, m = 0) => inRectW(r, p.x, p.z, m);
export const atTerminal = (s) => terminals.some((t) => inZone(s, t, 2));
export const waitAt = (s) => waits.find((w) => inZone(s, w, 2)) || null;

function pickTarget(s, rnd) {
  const cap = up(s, 'tanks'),
    opts = [600, 800, 1000, 1200, 1600, 2000].filter((t) => t <= cap);
  return opts[Math.floor(rnd() * opts.length)];
}
export function estTime(s, ti, bi) {
  const t = terminals[ti],
    b = customers[bi];
  const d = (Math.hypot(t.x - s.x, t.z - s.z) + Math.hypot(b.x - t.x, b.z - t.z)) * 1.3;
  return d / 5.5 + 60 + up(s, 'pomp') + 45;
}
const tidePhase = (s) => s.tidePhase || 0;
// Dilemma jobs: each one says plainly what you gain and what you risk.
export const TWISTS = {
  hazmat: {
    tag: '☣️ GEVAARLIJK',
    mult: 1.35,
    reward: '+35% loon',
    risk: 'elke nieuwe schade kost −10 reputatie en haalt de krant',
  },
  race: {
    tag: '🏁 WEDSTRIJD',
    mult: 1.4,
    reward: '+40% loon',
    risk: 'een concurrent gaat zeker ook voor dit schip',
  },
  storm: {
    tag: '💨 STORM',
    mult: 1.3,
    reward: '+30% loon',
    risk: 'harde wind dwars in zolang de klus loopt',
  },
};
function newOffer(s, kind, rnd) {
  const busy = new Set([s.job?.berth, ...s.offers.map((o) => o.berth)]);
  const pool = customers.map((_, i) => i).filter((i) => !busy.has(i));
  if (!pool.length) return null;
  const bi = pool[Math.floor(rnd() * pool.length)],
    ti = Math.floor(rnd() * terminals.length),
    b = customers[bi];
  const target = pickTarget(s, rnd),
    client = clientOf(b),
    est = estTime(s, ti, bi),
    now = logicTime(s);
  const slot = now + est * (0.9 + rnd() * 2.2);
  let deadline, mult;
  if (kind === 'kort') [deadline, mult] = [slot + est * 0.8, 1];
  else if (kind === 'lang') [deadline, mult] = [slot + est * 1.3, 1.25];
  else if (kind === 'spoed') [deadline, mult] = [now + est * 1.15, 1.6];
  else {
    // HW in logic seconds: tide period is in simulated seconds, so convert.
    const hw = nextHighWater(slot / LOGIC, tidePhase(s));
    deadline = hw === null ? slot + est : hw * LOGIC;
    mult = 1.35;
  }
  // A dilemma now and then (fase 3): more money, one clear risk.
  const tw = rnd(),
    twist = tw < 0.14 ? 'hazmat' : tw < 0.27 && !b.gate ? 'race' : tw < 0.38 ? 'storm' : null;
  const pay = Math.round(
    target * 0.6 * mult * (b.gate ? 1.3 : 1) * tariff(s, client) * (TWISTS[twist]?.mult || 1),
  );
  return {
    twist,
    id: Math.floor(rnd() * 1e9),
    berth: bi,
    terminal: ti,
    target,
    kind,
    client,
    deadline: b.gate ? deadline + 120 : deadline,
    est,
    pay,
    vip: repOf(s, client) >= 75,
    taken: null,
  };
}
// Drop expired jobs, refill to six, sort by time — exactly like planTick().
export function planTick(s, rnd = Math.random) {
  if (MAP.id === 'training') return;
  const now = logicTime(s);
  s.offers = (s.offers || []).filter(
    (o) => o.deadline - now > -30 && !(o.taken && now - o.takenAt > 20),
  );
  const kinds = MAP.current.tide
    ? ['kort', 'getij', 'spoed', 'kort', 'lang', 'getij']
    : ['kort', 'lang', 'spoed', 'kort', 'lang', 'kort'];
  let guard = 0;
  while (s.offers.length < 6 && guard++ < 20) {
    let k = kinds[s.offers.length % kinds.length];
    if (k === 'spoed' && s.offers.some((o) => o.kind === 'spoed')) k = 'kort';
    const o = newOffer(s, k, rnd);
    if (!o) break;
    s.offers.push(o);
  }
  s.offers.sort((a, b) => a.deadline - b.deadline);
}
export function acceptOffer(s, id) {
  const o = s.offers.find((x) => x.id === id && !x.taken);
  if (!o) return false;
  s.job = { ...o };
  s.offers = s.offers.filter((x) => x !== o);
  startJob(s);
  return true;
}
// Job without the schedule (training map, or "N" with nothing chosen yet).
export function quickJob(s, rnd = Math.random) {
  const bi = MAP.id === 'training' ? 0 : Math.floor(rnd() * customers.length);
  const ti = Math.floor(rnd() * terminals.length),
    target = MAP.id === 'training' ? 600 : pickTarget(s, rnd);
  s.job = {
    id: 0,
    berth: bi,
    terminal: ti,
    target,
    kind: 'kort',
    client: clientOf(customers[bi]),
    deadline: 0,
    est: estTime(s, ti, bi),
    pay: Math.round(target * 0.6),
    vip: false,
  };
  startJob(s);
}
function startJob(s) {
  s.target = s.job.target;
  if (s.cargo > s.target) s.cargo = s.target;
  s.phase = s.cargo >= s.target ? 'sail' : 'load';
  Object.assign(s, {
    holdT: 0,
    bunkerT: 0,
    elapsed: 0,
    leakWarned: false,
    deliver: 0,
    jobDamage: s.damage,
    jobHit: false,
    vtsBonus: 0,
    dockTip: 0,
    jobAnchors: 0,
  });
}
export function deadlineText(s) {
  const j = s.job;
  if (!j || !j.deadline) return '';
  const at = clockStr(dayClock(s) + (j.deadline - logicTime(s)) * CLOCK_RATE);
  return j.kind === 'getij' ? '🌊 vóór HW ' + at : '⏱ ETA ' + at;
}
export function timeLeft(s) {
  const j = s.job;
  if (!j || !j.deadline) return null;
  return ((j.deadline - logicTime(s)) / 60) * CLOCK_RATE; // harbour minutes
}
export const kindLabel = (k) =>
  k === 'spoed' ? '⏱ SPOED' : k === 'getij' ? '🌊 GETIJ' : k === 'lang' ? '🧭 LANG' : '✅ KORT';

// Payment at the end of bunkering (engine.js logic(), phase 'bunker').
export function settle(s) {
  const j = s.job,
    now = logicTime(s);
  const base = j ? j.pay : Math.round(s.target * 0.6),
    late = j && j.deadline ? now - j.deadline : -1,
    onTime = late <= 0;
  const frac = Math.max(0, Math.min(1, (s.deliver || s.target) / s.target)),
    base2 = Math.round(base * frac);
  const pay = onTime ? base2 : Math.round(base2 * Math.max(0.5, 1 - late / Math.max(60, j.est))),
    bonus = onTime ? Math.round(base2 * 0.25) : 0,
    clean = s.damage < 0.5 ? 150 : 0; // engine.js: no damage at all, not just no new damage
  const tip = s.dockTip || 0;
  const total = pay + bonus + clean + (s.vtsBonus || 0) + tip;
  const result = { pay, bonus, clean, onTime, late, frac, total, vts: s.vtsBonus || 0, tip };
  s.phase = 'done';
  s.doneT = 0;
  s.lastJob = result;
  if (MAP.id === 'training') {
    s.trainingDone = true;
    return result;
  }
  s.gold += total;
  s.jobs++;
  s.earned = (s.earned || 0) + total;
  // Leaderboard of this harbour: the job's score joins the running shift.
  result.score = jobScore({ onTime, late, damage: s.damage, vts: s.vtsBonus });
  result.shift = { ...addJob(s, MAP.id, result.score) };
  const d = (s.day = s.day || { jobs: 0, onTime: 0, clean: 0, goalDone: false });
  d.jobs++;
  if (onTime) d.onTime++;
  if (clean) d.clean++;
  if (j) addRep(s, j.client, (onTime ? 3 : -5) + (clean ? 2 : s.damage > 20 ? -4 : 0));
  // A dangerous cargo spilled into the news: the client remembers.
  if (j?.twist === 'hazmat' && (s.jobHit || s.damage > (s.jobDamage || 0) + 0.5)) {
    addRep(s, j.client, -10);
    result.hazmat = true;
    addNews(
      s,
      'hazmat',
      'Schade bij gevaarlijke lading: ' + (j.client || 'rederij') + ' eist onderzoek',
    );
  }
  if (!d.goalDone && d.onTime >= 3 && d.clean >= 3) {
    d.goalDone = true;
    s.gold += 300;
    result.dayGoal = true;
  }
  // Career: points, perhaps a promotion, and a line for the Havenkrant.
  const b = customers[j?.berth ?? 0];
  result.anchors = s.jobAnchors || 0;
  result.xp = xpForJob(result, result.anchors);
  result.promotion = gainXp(s, result.xp);
  if (result.anchors === 3) addNews(s, 'strak', 'Bunkerguru legt STRAK aan bij ' + b.name);
  if (!onTime)
    addNews(
      s,
      'late',
      'Bunkerboot te laat bij ' + b.name + ' – ' + (j?.client || 'rederij') + ' morrend',
    );
  else
    addNews(
      s,
      'job',
      'Bunkerguru levert ' + Math.round(s.deliver || s.target) + ' t aan ' + b.name,
    );
  if (result.promotion)
    addNews(s, 'rank', 'Bunkerguru gepromoveerd tot ' + result.promotion.name + '!');
  s.job = null;
  return result;
}

// Route advice, cached: recomputed when the target changes or the boat moved 30 m.
let routeCache = null;
export function routePoints(s, t) {
  if (
    !routeCache ||
    routeCache.t !== t ||
    Math.hypot(routeCache.x - s.x, routeCache.z - s.z) > 30
  ) {
    // Planned on the map, shown and sailed in the world.
    const goal = { x: t.x, z: t.z },
      a = toMap(s.x, s.z),
      b = toMap(t.x, t.z);
    // Prefer wide clearance (a 110 m hull sweeps wide in bends); narrow only if needed.
    const wide = waterRouteM(a, b, 30);
    const ok = wide.length > 2 || Math.hypot(b.x - a.x, b.z - a.z) < 400;
    routeCache = {
      t,
      x: s.x,
      z: s.z,
      pts: routeToWorld(ok ? wide : waterRouteM(a, b, 12), { x: s.x, z: s.z }, goal),
    };
  }
  const pts = routeCache.pts.slice();
  pts[0] = { x: s.x, z: s.z };
  return pts;
}
