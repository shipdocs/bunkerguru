// Long headless run on one map (BUNKERGURU_MAP): geometry checks plus 30 simulated
// minutes of traffic and rivals. Prints a JSON report for tests/maps.test.mjs.
import {
  MAP,
  terminals,
  waits,
  customers,
  waterAt,
  waterRoute,
  landAt,
} from '../../src/maps/index.mjs';
import { fresh, step, createWorldState, mooringCandidate } from '../../src/game/simulation.mjs';
import { hullContacts } from '../../src/game/collisions.mjs';
import { quickJob, planTick } from '../../src/game/harbor.mjs';
import { buyBoat, dispatch, idleBoats, fleetOf } from '../../src/game/fleet.mjs';
import { landmarkSpots } from '../../src/render/landmarks.mjs';
// Reproducible run: a fixed seed instead of real randomness (a few seeds left the
// Antwerpen rivals without a finished job in 30 minutes, a flaky test).
let seed = Number(process.env.BUNKERGURU_SEED) || 20261109;
Math.random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
const out = {
  id: MAP.id,
  problems: [],
  rivalJobs: 0,
  rivalTows: 0,
  minRivalGap: Infinity,
  routeLegs: 0,
};
const bad = (m) => out.problems.push(m);
for (const p of landmarkSpots())
  if (!landAt(p.x, p.z, 15)) bad('landmark in the water at ' + p.x + ',' + p.z);
if (!waterAt(MAP.start.x, MAP.start.z, 4)) bad('start on land');
for (const t of [...terminals, ...waits]) {
  if (!waterAt(t.x, t.z, 4)) bad(t.name + ' centre on land');
  if (t.wall === 0) bad(t.name + ' not against a quay');
}
for (const b of customers) {
  if (!waterAt(b.x, b.z, 6)) bad(b.name + ' bunker spot on land');
  const r = waterRoute(MAP.start, b, 12);
  out.routeLegs += r.length - 1;
  for (let i = 0; i < r.length - 1; i++)
    for (let k = 0; k <= 20; k++) {
      const x = r[i].x + ((r[i + 1].x - r[i].x) * k) / 20,
        z = r[i].z + ((r[i + 1].z - r[i].z) * k) / 20;
      if (landAt(x, z)) {
        bad('route to ' + b.name + ' crosses land');
        k = 99;
        i = 99;
      }
    }
}
// moor.py: lie still alongside every terminal, waiting place and seagoing ship —
// the hull must fit without touching, and M (make fast) must be accepted.
for (const [i, b] of customers.entries()) {
  const p = {
    ...fresh(),
    x: b.x,
    z: b.z,
    h: b.h,
    moored: false,
    phase: 'sail',
    job: { berth: i, terminal: 0 },
  };
  const x0 = p.x,
    z0 = p.z;
  hullContacts(p, 0);
  if (Math.hypot(p.x - x0, p.z - z0) > 0.01) bad(b.name + ': bunker spot touches a quay or ship');
  if (!mooringCandidate(p).ok) bad(b.name + ': cannot make fast (' + mooringCandidate(p).why + ')');
}
for (const t of [...terminals, ...waits]) {
  const off = t.wall * ((t.alongZ ? t.x1 - t.x0 : t.z1 - t.z0) / 2 - 7);
  const p = {
    ...fresh(),
    x: t.alongZ ? t.x + off : t.x,
    z: t.alongZ ? t.z : t.z + off,
    h: t.h,
    moored: false,
    phase: 'free',
  };
  const x0 = p.x,
    z0 = p.z;
  hullContacts(p, 0);
  if (Math.hypot(p.x - x0, p.z - z0) > 0.01) bad(t.name + ': quay spot does not fit the hull');
  if (!mooringCandidate(p).ok) bad(t.name + ': cannot make fast');
}
void quickJob;
const s = fresh(),
  world = createWorldState(s);
const fx = { say() {}, sound() {}, radio() {}, board() {}, done() {} };
// BUNKERGURU_FLEET=1: also two boats of your own, always given the next job.
const withFleet = !!process.env.BUNKERGURU_FLEET && MAP.id !== 'training';
if (withFleet) {
  Object.assign(s, { xp: 8000, gold: 1e5 });
  buyBoat(s, world);
  buyBoat(s, world);
}
const before = world.rivals.map((r) => r.jobs);
for (let i = 0; i < 60 * 600; i++) {
  step(s, world, 1 / 60, {}, fx);
  if (i % 30) continue;
  if (withFleet)
    for (const b of idleBoats(world)) {
      planTick(s);
      const o = s.offers.find((x) => !x.taken && !customers[x.berth].gate);
      if (o) dispatch(s, world, b.name, o.id);
    }
  for (const r of world.rivals) {
    if (![r.x, r.z, r.h, r.cur].every(Number.isFinite)) bad(r.name + ' NaN');
    if (r.mode !== 'sunk' && !waterAt(r.x, r.z, 0))
      bad(r.name + ' on land at ' + Math.round(r.x) + ',' + Math.round(r.z));
    if (r.stuckT > 44 * 3) out.rivalTows++;
  }
  if (world.rivals.length === 2 && !withFleet) {
    const [a, b] = world.rivals;
    out.minRivalGap = Math.min(out.minRivalGap, Math.hypot(a.x - b.x, a.z - b.z));
  }
  for (const t of world.traffic) if (![t.x, t.z].every(Number.isFinite)) bad(t.name + ' NaN');
}
out.rivalJobs = world.rivals.reduce((n, r, i) => n + (r.own ? 0 : r.jobs - before[i]), 0);
out.fleetJobs = fleetOf(world).reduce((n, r) => n + r.jobs, 0);
out.problems = [...new Set(out.problems)].slice(0, 12);
console.log(JSON.stringify(out));
