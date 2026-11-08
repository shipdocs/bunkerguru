import { waterAt, basins, land } from '../src/maps/amsterdam.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, restore, step, pump, act, target, recover } from '../src/game/simulation.mjs';
import {
  offers,
  acceptContract,
  contractOf,
  berths,
  HARBOR,
  terminal,
  service,
  trafficAt,
} from '../src/game/harbor.mjs';
import { hullContacts, trafficContacts } from '../src/game/collisions.mjs';
const run = (s, seconds) => {
  for (let i = 0; i < seconds * 20; i++) step(s, 0.05);
};
function finish(s) {
  s.x = terminal.x;
  s.z = terminal.z;
  s.moored = true;
  pump(s);
  run(s, 22);
  assert.equal(s.phase, 'deliver');
  const t = target(s);
  s.x = t.x;
  s.z = t.z;
  pump(s);
  run(s, 22);
  assert.equal(s.phase, 'done');
}
test('five complete jobs unlock bonus once; every receiver used; contracts can continue', () => {
  const s = fresh(),
    seen = new Set();
  for (let i = 0; i < 6; i++) {
    seen.add(target({ ...s, phase: 'deliver' }).id);
    finish(s);
    if (i === 4) {
      assert.equal(s.gold, 5050);
      assert(s.goalClaimed);
    }
    if (i < 5) assert(acceptContract(s, 'regular'));
  }
  assert.equal(s.gold, 5800);
  assert.equal(seen.size, 6);
  assert.equal(s.jobs, 6);
  run(s, 10);
  assert.equal(s.gold, 5800);
});
test('job acceptance is transactional and cargo matches each contract', () => {
  const s = fresh();
  assert.equal(acceptContract(s, 'express'), false);
  finish(s);
  const old = { ...s };
  assert.equal(acceptContract(s, 'invalid'), false);
  assert.deepEqual(s, old);
  assert(acceptContract(s, 'small'));
  assert.equal(s.target, 200);
  finish(s);
  assert.equal(s.lastPayout, 400);
});
test('express pays on time, late discount once; recovery keeps contract but resets clock and load', () => {
  const s = { ...fresh(), phase: 'done' };
  acceptContract(s, 'express');
  finish(s);
  assert.equal(s.lastPayout, 700);
  acceptContract(s, 'express');
  s.elapsed = 2500;
  finish(s);
  assert.equal(s.lastPayout, 525);
  s.gold = 20;
  recover(s);
  assert.equal(s.gold, 0);
  assert.equal(s.target, 300);
  assert.equal(s.elapsed, 0);
  assert.equal(s.cargo, 0);
  assert.equal(s.phase, 'load');
});
test('service requires terminal; upgrades have increasing prices and cap; repairs bounded', () => {
  const s = { ...fresh(), gold: 5000, damage: 40 };
  s.x = 139;
  const gold = s.gold;
  service(s, 'repair');
  assert.equal(s.gold, gold);
  s.x = terminal.x;
  service(s, 'repair');
  assert.equal(s.damage, 0);
  assert.equal(s.gold, 4880);
  for (let i = 0; i < 4; i++) service(s, 'pump');
  assert.equal(s.level, 3);
  assert.equal(s.gold, 1880);
  s.pumping = true;
  service(s, 'repair');
  assert.equal(s.gold, 1880);
});
test('each delivery berth accommodates the 110 m hull without collision; no berth intersects traffic', () => {
  for (const b of berths) {
    const s = { ...fresh(), x: b.x, z: b.z, h: b.h, moored: false };
    hullContacts(s, 0.05);
    assert.equal(s.x, b.x);
    assert.equal(s.z, b.z);
    for (let t = 0; t < 530; t += 5) {
      trafficContacts(s, trafficAt(t));
      assert.equal(s.x, b.x);
    }
  }
});
test('traffic collisions resolve overlap and damage moving player', () => {
  const s = { ...fresh(), x: 0, z: 0, h: Math.PI / 2, u: 4, moored: false };
  trafficContacts(s, [{ x: 55, z: 0, h: 0, length: 23, beam: 8, speed: 0 }]);
  assert(s.damage > 0);
  assert(s.u < 4);
});
test('restore migrates old saves, rejects invalid values and resumes with engine stopped', () => {
  const s = restore({
    gold: 1050,
    jobs: 1,
    phase: 'deliver',
    cargo: 500,
    x: NaN,
    teleIdx: 8,
    rpm: 1,
  });
  assert.equal(s.x, terminal.x);
  assert.equal(s.gold, 1050);
  assert.equal(s.target, 500);
  assert.equal(s.teleIdx, 3);
  assert.equal(s.rpm, 0);
  assert.equal(s.cargo, 500);
  const b = restore({
    contractId: 'oops',
    level: 999,
    damage: -100,
    berthIndex: 99,
    shipId: 'large135',
  });
  assert.equal(b.level, 3);
  assert.equal(b.damage, 0);
  assert.equal(b.berthIndex, 5);
  assert.equal(b.shipId, 'legacy');
});
test('terminal can be visited for repairs while delivery remains active', () => {
  const s = { ...fresh(), phase: 'deliver', moored: false };
  act(s);
  assert(s.moored);
  pump(s);
  assert(!s.pumping);
  assert.equal(s.phase, 'deliver');
});
test('3x applies equally to traffic clock, deadline and pumping', () => {
  const s = { ...fresh(), timeScale: 3 };
  pump(s);
  run(s, 2);
  assert(Math.abs(s.clock - 6) < 1e-8);
  assert(Math.abs(s.elapsed - 6) < 1e-8);
  assert(Math.abs(s.cargo - 150) < 1e-8);
});

test('expanded map gives real metre distances and relocates old saves without losing progress', () => {
  assert(HARBOR.halfWidth * 2 * HARBOR.halfLength * 2 > 2000000);
  assert(Math.hypot(terminal.x - berths[0].x, terminal.z - berths[0].z) > 1300);
  const a = restore({
    ...fresh(),
    mapVersion: 1,
    x: -174,
    z: 100,
    cargo: 300,
    gold: 2200,
    level: 2,
    phase: 'deliver',
  });
  assert.equal(a.x, terminal.x);
  assert.equal(a.z, terminal.z);
  assert.equal(a.cargo, 300);
  assert.equal(a.gold, 2200);
  assert.equal(a.level, 2);
  const b = restore({ ...fresh(), mapVersion: 1, x: 139, z: -100, phase: 'done' });
  assert.equal(b.x, terminal.x);
  assert.equal(b.z, terminal.z);
  const c = restore({ ...fresh(), x: 400, z: 0, moored: false });
  assert.equal(c.x, 400);
  assert.equal(c.z, 0);
});
test('canal map edges contain the player and traffic remains on navigable water', () => {
  for (const x of [-2499, 2499]) {
    const s = { ...fresh(), x, z: 0, moored: false };
    hullContacts(s, 0.01);
    assert(Math.abs(s.x) < 2497);
  }
  for (let t = 0; t < 4000; t += 5)
    for (const b of trafficAt(t)) {
      assert(waterAt(b.x, b.z, 12));
      assert(b.speed <= 4.5);
    }
});
