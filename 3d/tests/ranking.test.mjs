// Leaderboard per harbour: job score, the running shift, top five per map.
globalThis.BUNKERGURU_MAP = 'rotterdam';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
};
const { jobScore, shiftOf, addJob, ranked } = await import('../src/game/ranking.mjs');
const { loadRanking, saveShift } = await import('../src/app/storage.mjs');
const { fresh, restore } = await import('../src/game/state.mjs');
const { settle, MAP } = await import('../src/game/harbor.mjs');

test('job score: 1000, plus 3 per second ahead of the ETA up to 900, minus 10 per damage, plus VTS', () => {
  assert.equal(jobScore({ onTime: true, late: 0 }), 1000);
  assert.equal(jobScore({ onTime: true, late: -100 }), 1300);
  assert.equal(jobScore({ onTime: true, late: -5000 }), 1900);
  assert.equal(jobScore({ onTime: false, late: 60, damage: 12.4 }), 880);
  assert.equal(jobScore({ onTime: false, late: 60, damage: 400 }), 0);
  assert.equal(jobScore({ onTime: true, late: 0, vts: 150 }), 1150);
});

test('a shift collects jobs per harbour; another harbour starts a new one', () => {
  const s = {};
  addJob(s, 'rotterdam', 1200, 111);
  addJob(s, 'rotterdam', 900, 222);
  assert.deepEqual(s.shift, { id: 111, mapId: 'rotterdam', score: 2100, jobs: 2 });
  assert.equal(shiftOf(s, 'antwerpen', 333).id, 333);
  assert.equal(s.shift.score, 0);
});

test('ranking keeps the best five, one entry per shift, and survives broken data', () => {
  let list = [];
  for (const [id, score] of [
    [1, 500],
    [2, 3000],
    [3, 1500],
    [4, 100],
    [5, 2500],
    [6, 2000],
  ])
    list = ranked(list, { id, score, jobs: 1 }, '2026-11-09');
  assert.deepEqual(
    list.map((e) => e.score),
    [3000, 2500, 2000, 1500, 500],
  );
  // The same shift again replaces its own line.
  list = ranked(list, { id: 3, score: 4000, jobs: 3 }, '2026-11-10');
  assert.deepEqual(
    list.map((e) => e.id),
    [3, 2, 5, 6, 1],
  );
  assert.equal(list[0].jobs, 3);
  assert.equal(ranked('rubbish', { id: 9, score: 7, jobs: 1 }, 'd').length, 1);
  assert.equal(ranked([null, { id: 1 }], { id: 9, score: 7, jobs: 1 }, 'd').length, 1);
});

test('finishing a job scores the shift and the list is stored per harbour', () => {
  const s = fresh();
  Object.assign(s, { target: 600, deliver: 600, damage: 3, vtsBonus: 0, job: null });
  const r = settle(s);
  assert.equal(r.score, 973); // no ETA: counted as one second ahead
  assert.equal(s.shift.mapId, MAP.id);
  assert.equal(s.shift.jobs, 1);
  saveShift(MAP.id, r.shift, '2026-11-09');
  const r2 = settle(Object.assign(s, { phase: 'bunker', damage: 0 }));
  saveShift(MAP.id, r2.shift, '2026-11-09');
  const list = loadRanking(MAP.id);
  assert.equal(list.length, 1, 'one line for this shift');
  assert.equal(list[0].score, 1976);
  assert.equal(list[0].jobs, 2);
  assert.deepEqual(loadRanking('antwerpen'), []);
  // The shift survives a reload in the same harbour, not a move to another.
  assert.deepEqual(restore(JSON.parse(JSON.stringify(s))).shift, s.shift);
  const moved = JSON.parse(JSON.stringify(s));
  moved.shift.mapId = 'antwerpen'; // a career that arrives from another harbour
  assert.equal(restore(moved).shift, null);
});
