import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, step, createWorldState, act, target } from '../src/game/simulation.mjs';
import { quickJob, berthOf, terminalOf, waits, MAP } from '../src/game/harbor.mjs';
import { dockRating } from '../src/game/docking.mjs';
import { planFastTravel, fastTravel, APPROACH } from '../src/game/fast-travel.mjs';
import { waterAt } from '../src/maps/index.mjs';
const fx = { say() {}, sound() {}, radio() {}, board() {}, done() {} };
const rnd = (
  (k) => () =>
    (k = (k * 16807) % 2147483647) / 2147483647
)(11);

test('docking rating: soft, parallel and close earns three anchors and a tip', () => {
  const s = fresh();
  quickJob(s, rnd);
  s.phase = 'sail';
  const b = berthOf(s);
  Object.assign(s, { x: b.x, z: b.z, h: b.h, u: 0.2, v: 0, moored: false });
  const good = dockRating(s, { kind: 'ship', id: b.id });
  assert.equal(good.anchors, 3);
  assert(good.tip > 0);
  Object.assign(s, { u: 1, h: b.h + 0.3 });
  assert(dockRating(s, { kind: 'ship', id: b.id }).anchors < 3);
  // act() records the rating once and the tip is paid with the job.
  Object.assign(s, { u: 0.2, h: b.h });
  act(s);
  assert.equal(s.mooredTo.kind, 'ship');
  assert.equal(s.dockEvent.anchors, 3);
  assert.equal(s.dockTip, good.tip);
});

test('varen naar: carried along the route to an approach point on open water; time moves on', () => {
  const s = fresh(),
    world = createWorldState(s);
  quickJob(s, rnd);
  s.moored = false;
  s.mooredTo = null;
  const t = target(s);
  const far = Math.hypot(t.x - s.x, t.z - s.z);
  const plan = planFastTravel(s, world);
  if (!plan.ok) return assert(far < 2000, 'only near destinations may refuse: ' + plan.why);
  const clock = s.clock;
  const msg = fastTravel(s, world, fx);
  assert.match(msg, /min later/);
  assert(s.clock > clock);
  assert(waterAt(s.x, s.z, 15));
  const d = Math.hypot(t.x - s.x, t.z - s.z);
  assert(d >= APPROACH * 0.5 && d < far, 'stops short of the destination: ' + d);
  for (let i = 0; i < 300; i++) step(s, world, 1 / 60, {}, fx);
  assert.equal(s.damage, 0, 'arrives with room to manoeuvre');
  // Moored or without a job: refused.
  s.moored = true;
  assert(!planFastTravel(s, world).ok);
  assert.equal(terminalOf(s).kind, 'terminal');
});

test('sinking is a story: towed to the yard, quarter of the gold, reputation hit, repairs start', () => {
  const s = fresh(),
    world = createWorldState(s);
  quickJob(s, rnd);
  s.gold = 1000;
  s.moored = false;
  s.damage = 100;
  for (let i = 0; i < 60 * 6; i++) step(s, world, 1 / 60, {}, fx); // 5 logic s at 3×
  assert.equal(s.phase, 'load');
  assert(s.gold <= 750);
  assert(s.gold > 700, 'only a quarter lost (some already spent on repairs)');
  const yard = waits.find((w) => w.yard);
  assert(yard, MAP.id + ' has a yard');
  assert(s.moored && s.mooredTo.id === yard.id);
  assert(s.damage < 46, 'repair at the yard has begun');
  assert(s.rep[s.job.client] < 50);
});
