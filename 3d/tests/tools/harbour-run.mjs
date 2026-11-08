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
import { fresh, step, createWorldState } from '../../src/game/simulation.mjs';
const out = {
  id: MAP.id,
  problems: [],
  rivalJobs: 0,
  rivalTows: 0,
  minRivalGap: Infinity,
  routeLegs: 0,
};
const bad = (m) => out.problems.push(m);
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
const s = fresh(),
  world = createWorldState(s);
const fx = { say() {}, sound() {}, radio() {}, board() {}, done() {} };
const before = world.rivals.map((r) => r.jobs);
for (let i = 0; i < 60 * 600; i++) {
  step(s, world, 1 / 60, {}, fx);
  if (i % 30) continue;
  for (const r of world.rivals) {
    if (![r.x, r.z, r.h, r.cur].every(Number.isFinite)) bad(r.name + ' NaN');
    if (r.mode !== 'sunk' && !waterAt(r.x, r.z, 0))
      bad(r.name + ' on land at ' + Math.round(r.x) + ',' + Math.round(r.z));
    if (r.stuckT > 44 * 3) out.rivalTows++;
  }
  if (world.rivals.length === 2) {
    const [a, b] = world.rivals;
    out.minRivalGap = Math.min(out.minRivalGap, Math.hypot(a.x - b.x, a.z - b.z));
  }
  for (const t of world.traffic) if (![t.x, t.z].every(Number.isFinite)) bad(t.name + ' NaN');
}
out.rivalJobs = world.rivals.reduce((n, r, i) => n + r.jobs - before[i], 0);
out.problems = [...new Set(out.problems)].slice(0, 12);
console.log(JSON.stringify(out));
