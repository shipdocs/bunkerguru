import { test } from 'node:test';
import assert from 'node:assert/strict';
globalThis.BUNKERGURU_MAP = 'rotterdam';
const { fresh, createWorldState, takeJob, step } = await import('../src/game/simulation.mjs');
const { planTick, settle, TWISTS, repOf } = await import('../src/game/harbor.mjs');
const { daylight, skyLook } = await import('../src/render/daylight.mjs');
const { tideLevel, nextHighWater, tideState } = await import('../src/maps/index.mjs');
const { createEvents, eventTick } = await import('../src/game/events.mjs');

const noFx = { say() {}, sound() {}, radio() {}, board() {}, done() {}, card() {} };
const seq = (vals) => {
  let i = 0;
  return () => vals[i++ % vals.length];
};

test('dilemma jobs: some offers carry a twist that pays more and says its risk', () => {
  const s = fresh();
  planTick(s, Math.random);
  for (let k = 0; k < 40; k++) {
    s.offers = [];
    planTick(s, Math.random);
    if (s.offers.some((o) => o.twist)) break;
  }
  const o = s.offers.find((x) => x.twist);
  assert(o, 'a twist shows up');
  assert(TWISTS[o.twist].mult > 1);
  assert(TWISTS[o.twist].risk && TWISTS[o.twist].reward);
});

test('hazmat: new damage during the job costs extra reputation and makes the news', () => {
  const s = fresh();
  s.job = {
    berth: 0,
    terminal: 0,
    target: 600,
    kind: 'kort',
    client: 'Delta Lines',
    deadline: 0,
    est: 100,
    pay: 500,
    twist: 'hazmat',
  };
  s.target = 600;
  s.deliver = 600;
  s.jobDamage = 0;
  s.damage = 8;
  const before = repOf(s, 'Delta Lines');
  const r = settle(s);
  assert(r.hazmat);
  assert.equal(repOf(s, 'Delta Lines'), before + 3 - 10); // on time +3, hazmat −10
  assert(s.news.some((n) => n.kind === 'hazmat'));
});

test('race twist: a free rival always races you for the ship', () => {
  const s = fresh();
  const world = createWorldState(s);
  planTick(s, Math.random);
  const o = s.offers.find((x) => !x.taken);
  o.twist = 'race';
  // rnd always high: without the twist no rival would race (needs rnd < 0.55).
  assert(takeJob(s, world, o.id, noFx, seq([0.99])));
  assert(
    world.rivals.some((r) => r.racing),
    'a rival races',
  );
});

test('storm twist: a hard wind blows while the job runs and stops after', () => {
  const s = fresh();
  const ev = createEvents();
  const world = { traffic: [], rivals: [], gates: [] };
  s.job = { twist: 'storm', berth: 0, terminal: 0 };
  s.phase = 'sail';
  eventTick(ev, s, 0.1, world, noFx);
  assert(ev.wind && Math.hypot(ev.wind.x, ev.wind.z) > 0.8);
  assert(Math.abs(ev.wind.z) > Math.abs(ev.wind.x) * 4, 'across the river');
  s.job = null;
  s.phase = 'free';
  eventTick(ev, s, 0.1, world, noFx);
  assert.equal(ev.wind, null);
});

test('day and night follow the harbour clock; night stays readable', () => {
  assert(daylight(12 * 3600).night < 0.01);
  assert(daylight(0).night > 0.99);
  assert(daylight(6.2 * 3600).dusk > 0.9);
  const n = skyLook(1 * 3600);
  assert(n.sun > 0.2 && n.hemi > 0.5, 'not pitch black');
  assert.notEqual(skyLook(12 * 3600).sky, n.sky);
});

test('tide: water is highest at high water and the label shows the height', () => {
  const hw = nextHighWater(1000, 1.3);
  assert(Math.abs(tideLevel(hw, 1.3) - 1.2) < 1e-6);
  assert(tideLevel(hw + 1, 1.3) < 1.2);
  assert.match(tideState(hw, 1.3).label, /\+1,2 m/);
});

void step;

test('race twist: with one idle rival, it races instead of taking another job', () => {
  const s = fresh();
  const world = createWorldState(s);
  world.rivals.slice(1).forEach((r) => (r.mode = 'toShip'));
  planTick(s, Math.random);
  const o = s.offers.find((x) => !x.taken && !x.twist);
  o.twist = 'race';
  assert(takeJob(s, world, o.id, noFx, seq([0.99, 0.0])));
  assert(world.rivals[0].racing, 'the only idle rival races');
  assert(!s.offers.some((x) => x.taken), 'no other job was taken');
});
