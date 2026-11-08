import { test } from 'node:test';
import assert from 'node:assert/strict';
import { basins, land, waterAt, originalMap } from '../src/maps/amsterdam.mjs';
import { terminals, berths, routePoints, loadingTerminal } from '../src/game/harbor.mjs';
import { fresh, act, readiness, pump, step, restore } from '../src/game/simulation.mjs';
import { hullContacts } from '../src/game/collisions.mjs';
test('old Amsterdam topology: ten connected basins, two terminals and six clients', () => {
  assert.equal(basins.length, 10);
  assert.equal(terminals.length, 2);
  assert.equal(berths.length, 6);
  for (const b of basins) {
    const x = (b.x0 + b.x1) / 2,
      z = (b.z0 + b.z1) / 2;
    for (let t = 0; t <= 1; t += 0.01) assert(waterAt(x, z * t), b.name + ' entrance blocked');
  }
  assert(waterAt(-100, 0));
  assert(!waterAt(-1400, 500), 'peninsula between Africa and America is land');
});
test('all routes pass through water, including return routes and customer-to-customer legs', () => {
  const locations = [...terminals, ...berths];
  for (const a of locations)
    for (const b of locations) {
      const route = routePoints(a, b);
      for (let j = 1; j < route.length; j++) {
        const p = route[j - 1],
          q = route[j],
          length = Math.hypot(q.x - p.x, q.z - p.z);
        for (let k = 0; k <= length; k += 5) {
          const t = length ? k / length : 0;
          assert(
            waterAt(p.x + (q.x - p.x) * t, p.z + (q.z - p.z) * t, 5),
            a.name + ' to ' + b.name,
          );
        }
      }
    }
});
test('both terminals accept loading and fit the actual ship hull', () => {
  for (const t of terminals) {
    const s = { ...fresh(), x: t.x, z: t.z, moored: false };
    hullContacts(s, 0.01);
    assert.equal(s.x, t.x);
    assert.equal(s.z, t.z);
    act(s);
    assert(s.moored);
    assert.equal(loadingTerminal(s), t);
    pump(s);
    assert(s.pumping);
  }
});
test('east-west Zaandam berth requires parallel east-west heading', () => {
  const i = berths.findIndex((b) => b.h),
    b = berths[i],
    s = { ...fresh(), x: b.x, z: b.z, phase: 'deliver', berthIndex: i, moored: false };
  act(s);
  assert(!s.moored);
  s.h = b.h;
  assert(readiness(s).angle < 1);
  act(s);
  assert(s.moored);
});
test('Botlek saves relocate safely to Westhaven while preserving cargo, money and upgrades', () => {
  const s = restore({
    ...fresh(),
    mapVersion: 2,
    x: 539,
    z: -450,
    cargo: 300,
    gold: 2500,
    level: 2,
    phase: 'deliver',
    moored: false,
    elapsed: 200,
  });
  assert.equal(s.x, terminals[0].x);
  assert.equal(s.z, terminals[0].z);
  assert.equal(s.cargo, 300);
  assert.equal(s.gold, 2500);
  assert.equal(s.level, 2);
  assert.equal(s.elapsed, 0);
  assert(s.moored);
});
