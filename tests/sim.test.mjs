import { HARBOR, terminal } from '../src/game/harbor.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, step, act, pump, next, recover, receiver } from '../src/game/simulation.mjs';
const run = (s, n) => {
  for (let i = 0; i < n * 60; i++) step(s, 1 / 60);
};
test('full bunker cycle pays once and permits return job', () => {
  const s = fresh();
  pump(s);
  run(s, 22);
  assert.equal(s.cargo, 500);
  assert.equal(s.phase, 'deliver');
  act(s);
  assert.equal(s.moored, false);
  s.x = receiver.x;
  s.z = receiver.z;
  act(s);
  assert.equal(s.moored, true);
  pump(s);
  run(s, 22);
  assert.equal(s.phase, 'done');
  assert.equal(s.gold, 1050);
  assert.equal(s.jobs, 1);
  run(s, 22);
  assert.equal(s.gold, 1050);
  next(s);
  assert.equal(s.phase, 'load');
});
test('cannot moor fast, crosswise or far away', () => {
  for (const overrides of [{ u: 2 }, { h: Math.PI / 2 }, { x: 0 }]) {
    let s = { ...fresh(), moored: false, ...overrides };
    act(s);
    assert.equal(s.moored, false);
  }
});
test('cannot pump underway; loaded tanker accelerates slower', () => {
  const a = { ...fresh(), moored: false, teleIdx: 8 },
    b = { ...fresh(), moored: false, teleIdx: 8, cargo: 500 };
  pump(a);
  assert.equal(a.pumping, false);
  run(a, 5);
  run(b, 5);
  assert(a.u > b.u);
  assert(a.z < terminal.z);
});
test('quays and receiver prevent passage and recovery is bounded', () => {
  const s = { ...fresh(), x: HARBOR.halfWidth - 9, z: 0, h: Math.PI / 2, moored: false, u: 5 };
  run(s, 2);
  assert(s.x < HARBOR.halfWidth);
  assert(s.damage > 0);
  s.gold = 20;
  recover(s);
  assert.equal(s.gold, 0);
  assert.equal(s.damage, 0);
  assert(s.moored);
});
test('overslag is restricted to the correct berth', () => {
  let s = fresh();
  pump(s);
  run(s, 22);
  assert.equal(s.phase, 'deliver');
  pump(s);
  assert.equal(s.pumping, false);
  s.x = receiver.x;
  s.z = receiver.z;
  s.phase = 'load';
  pump(s);
  assert.equal(s.pumping, false);
});
