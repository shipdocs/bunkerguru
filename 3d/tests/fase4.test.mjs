import { test } from 'node:test';
import assert from 'node:assert/strict';
globalThis.BUNKERGURU_MAP = 'rotterdam';
// Reproducible: the rival AI and offers use Math.random.
let seed = 4242;
Math.random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
const { fresh, restore, createWorldState, step, takeJob } = await import(
  '../src/game/simulation.mjs'
);
const { planTick } = await import('../src/game/harbor.mjs');
const { customers } = await import('../src/maps/index.mjs');
const fleet = await import('../src/game/fleet.mjs');
const { newspaper } = await import('../src/game/career.mjs');

const noFx = { say() {}, sound() {}, radio() {}, board() {}, done() {}, card() {} };
const rich = () => Object.assign(fresh(), { xp: 4600, gold: 10000, moored: true });

test('a boat is for sale from Havenbaas on, the third from Bunkerkoning', () => {
  const s = fresh();
  s.gold = 10000;
  const world = createWorldState(s);
  assert.match(fleet.buyBoat(s, world), /Havenbaas/);
  s.xp = 4600;
  assert.match(fleet.buyBoat(s, world), /gekocht/);
  assert.equal(s.gold, 7000);
  assert.equal(fleet.fleetOf(world).length, 1);
  assert.match(fleet.buyBoat(s, world), /Bunkerkoning/);
  s.xp = 8000;
  assert.match(fleet.buyBoat(s, world), /gekocht/);
  assert.match(fleet.buyBoat(s, world), /compleet/);
});

test('your own boat sails a job you hand it and pays into your cash box', () => {
  const s = rich();
  const world = createWorldState(s);
  fleet.buyBoat(s, world);
  planTick(s);
  const o = s.offers.find((x) => !customers[x.berth].gate);
  assert(fleet.dispatch(s, world, 'Bunkerguru II', o.id));
  assert(!s.offers.includes(o), 'the job left the planning');
  const b = fleet.fleetOf(world)[0];
  const gold0 = s.gold;
  for (let t = 0; t < 3600 * 2 && b.jobs === 0; t += 0.25) step(s, world, 0.25, {}, noFx);
  assert.equal(b.jobs, 1, 'job done within two simulated hours');
  assert(s.gold > gold0, 'paid');
  assert(s.gold - gold0 <= Math.round(o.pay * 0.7) + 1, 'crew keeps 30%');
  assert(s.news.some((n) => n.kind === 'fleet'));
});

test('rivals never use your boats, and the paper lists only real competitors', () => {
  const s = rich();
  const world = createWorldState(s);
  fleet.buyBoat(s, world);
  planTick(s);
  const o = s.offers.find((x) => !customers[x.berth].gate);
  takeJob(s, world, o.id, noFx, () => 0); // rnd 0: rivals take and race
  const own = fleet.fleetOf(world)[0];
  assert.equal(own.mode, 'idle');
  assert(!own.racing);
  const p = newspaper(
    s,
    world.rivals.filter((r) => !r.own),
  );
  assert(!p.standing.some((x) => x.name === 'Bunkerguru II'));
});

test('an idle boat picks a job itself after a while', () => {
  const s = rich();
  const world = createWorldState(s);
  fleet.buyBoat(s, world);
  planTick(s);
  const b = fleet.fleetOf(world)[0];
  fleet.fleetTick(s, world, fleet.AUTO_AFTER + 1, noFx);
  assert.notEqual(b.mode, 'idle');
  assert(b.job);
});

test('the fleet is saved with the career and restored on another map without position', () => {
  const s = rich();
  const world = createWorldState(s);
  fleet.buyBoat(s, world);
  step(s, world, 0.1, {}, noFx);
  assert.equal(s.fleet.length, 1);
  const raw = JSON.parse(JSON.stringify({ ...s, fleetMap: 'antwerpen' }));
  const s2 = restore(raw);
  const w2 = createWorldState(s2);
  assert.equal(fleet.fleetOf(w2).length, 1);
  assert(s2.rivals.length === 2 && raw.rivals.length === 2, 'rivals saved without own boats');
});

// Every harbour: two own boats get jobs for 30 simulated minutes, finish at least one,
// stay on the water (the same long run as tests/maps.test.mjs, with the fleet on).
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const tool = fileURLToPath(new URL('./tools/harbour-run.mjs', import.meta.url));
for (const id of ['amsterdam', 'rotterdam', 'europoort', 'antwerpen'])
  test(`${id}: your own fleet finishes jobs and stays on the water`, () => {
    const r = spawnSync(process.execPath, [tool], {
      env: { ...process.env, BUNKERGURU_MAP: id, BUNKERGURU_FLEET: '1' },
      encoding: 'utf8',
    });
    assert.equal(r.status, 0, r.stderr);
    const out = JSON.parse(r.stdout.trim().split('\n').pop());
    assert.deepEqual(out.problems, []);
    assert(out.fleetJobs >= 1, 'fleet completes jobs');
  });
