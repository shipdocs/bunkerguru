import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh } from '../src/game/simulation.mjs';
import { vesselStep, stopShip } from '../src/game/vessel.mjs';

const boat = (patch) => ({
  ...fresh(),
  handling: 'arcade',
  timeScale: 2,
  timeScale: 1,
  moored: false,
  x: 0,
  z: 0,
  cargo: 1200,
  ...patch,
});
function run(s, seconds, keys = {}, dt = 1 / 60) {
  for (let t = 0; t < seconds - 1e-9; t += dt) vesselStep(s, dt, keys);
  return s;
}
function stop(patch = {}, dt = 1 / 60) {
  const s = boat({ u: 20 / 3.6, rpm: 1, teleIdx: 8, ...patch });
  stopShip(s);
  let time = 0;
  while (s.braking && time < 20) {
    vesselStep(s, dt);
    time += dt;
  }
  return { s, time, distance: Math.hypot(s.x, s.z) };
}

test('one slow-ahead setting gets even a full tanker moving in four seconds', () => {
  const slow = run(boat({ teleIdx: 5 }), 4);
  assert(slow.u * 3.6 > 6 && slow.u * 3.6 < 9);
  const full = run(boat({ teleIdx: 8 }), 9);
  assert(full.u * 3.6 > 20 && full.u * 3.6 < 27);
  run(full, 60);
  assert(full.u * 3.6 < 27, 'top speed must remain bounded');
});
test('full helm can turn 90 degrees at manoeuvring speed in fourteen seconds', () => {
  const starboard = run(boat({ teleIdx: 5, rpm: 0.3, u: 2 }), 14, { right: true });
  const port = run(boat({ teleIdx: 5, rpm: 0.3, u: 2 }), 14, { left: true });
  assert(starboard.h > Math.PI / 2 && starboard.h < Math.PI * 0.6);
  assert(Math.abs(port.h + starboard.h) < 1e-9);
  assert(starboard.x > 10 && port.x < -10);
  const heading = starboard.h;
  starboard.rudderCmd = 0;
  run(starboard, 2);
  assert(starboard.h - heading < (7 * Math.PI) / 180, 'explicit amidships should arrest the turn');
  assert(Math.abs(starboard.r) < 0.001);
  assert(Math.abs(starboard.rudder) < 0.001);
});
test('fine helm remains proportional, including reverse, without a dead zone', () => {
  for (const u of [1, 5, -2]) {
    const make = () => boat({ u, teleIdx: u < 0 ? 0 : 5, rpm: u < 0 ? -0.6 : 0.3 });
    const a = run(make(), 3, { helm: 0.03 }),
      b = run(make(), 3, { helm: 0.2 }),
      c = run(make(), 3, { helm: 1 });
    assert(a.h * u > 0 && Math.abs(b.h) > Math.abs(a.h));
    assert(Math.abs(b.h) < Math.abs(c.h) * 0.2);
  }
});
test('dedicated brake stops 20 km/h within six seconds and twenty metres, then stays stopped', () => {
  const { s, time, distance } = stop();
  assert(time > 3 && time < 6);
  assert(distance < 20);
  assert(!s.braking);
  assert.equal(s.teleIdx, 3);
  assert.equal(s.u, 0);
  const { x, z } = s;
  run(s, 10);
  assert.equal(s.x, x);
  assert.equal(s.z, z);
  const turning = stop({ r: 0.12, v: 0.2, rudder: 1, rudderCmd: 1 });
  assert(turning.time < 6);
  assert(Math.abs(turning.s.r) < 0.002);
  assert.equal(turning.s.rudderCmd, 1);
  assert.equal(turning.s.rudder, 1);
});
test('throttle STOP slows progressively; reverse actually backs away', () => {
  const s = boat({ u: 5, rpm: 1, teleIdx: 3 });
  run(s, 1);
  assert(s.u > 3 && s.u < 5);
  run(s, 10);
  assert.equal(s.u, 0);
  s.teleIdx = 0;
  run(s, 5);
  assert(s.u < -2 && s.u >= -2.5);
});
test('size and cargo have a mild effect; mission size never changes handling', () => {
  const empty = stop({ cargo: 0 }),
    loaded = stop(),
    compact = stop({ shipId: 'compact', cargo: 500 });
  assert(loaded.time > empty.time && loaded.time < empty.time * 1.25);
  assert(loaded.time > compact.time && loaded.time < compact.time * 1.3);
  const a = run(boat({ cargo: 200, target: 200, teleIdx: 5 }), 10, { helm: 0.2 });
  const b = run(boat({ cargo: 200, target: 500, teleIdx: 5 }), 10, { helm: 0.2 });
  for (const k of ['x', 'z', 'h', 'u', 'v', 'r', 'rpm']) assert.equal(a[k], b[k]);
});
test('stationary rudder cannot spin ship; bow works independently of telegraph', () => {
  const s = run(boat(), 5, { right: true });
  assert.equal(s.h, 0);
  assert.equal(s.u, 0);
  run(s, 5, { bowR: true });
  assert(s.h > 0.3);
  assert.equal(s.teleIdx, 3);
});
test('handling is stable at 30 and 120 frames per second', () => {
  const states = [1 / 30, 1 / 120].map((dt) => {
    const s = boat({ teleIdx: 8 });
    run(s, 8, {}, dt);
    run(s, 6, { right: true }, dt);
    run(s, 2, {}, dt);
    stopShip(s);
    run(s, 8, {}, dt);
    return s;
  });
  assert(Math.hypot(states[0].x - states[1].x, states[0].z - states[1].z) < 1);
  assert(Math.abs(states[0].h - states[1].h) < Math.PI / 180);
});
