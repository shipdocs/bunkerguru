import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createSimulationClock,
  MAX_FRAME_SECONDS,
  SIMULATION_STEP,
} from '../src/app/simulation-clock.mjs';
import { fresh, step } from '../src/game/simulation.mjs';

function cruise(fps, timeScale = 1) {
  const s = {
    ...fresh(),
    moored: false,
    x: -2300,
    z: 0,
    h: Math.PI / 2,
    u: 7.2,
    rpm: 1,
    engDir: 1,
    teleIdx: 8,
    timeScale,
  };
  const clock = createSimulationClock(),
    start = { x: s.x, z: s.z };
  for (let i = 0; i < fps * 10; i++) clock.advance(1 / fps, true, (dt) => step(s, dt));
  return { distance: Math.hypot(s.x - start.x, s.z - start.z), clock: s.clock, s };
}
test('25.92 km/h covers 72 metres in ten real seconds at 5, 10, 15, 30, 60 and 120 FPS', () => {
  for (const fps of [5, 10, 15, 30, 60, 120]) {
    const result = cruise(fps);
    assert(Math.abs(result.distance - 72) < 1e-6, `${fps} FPS: ${result.distance} metres`);
    assert(Math.abs(result.clock - 10) < 1e-8);
    assert.equal(result.s.damage, 0);
  }
});
test('3x deliberately advances both world time and travelled distance by three, independent of FPS', () => {
  for (const fps of [10, 60]) {
    const result = cruise(fps, 3);
    assert(Math.abs(result.distance - 216) < 1e-6);
    assert(Math.abs(result.clock - 30) < 1e-8);
  }
});
test('irregular frame lengths retain fractional time while physics steps stay small', () => {
  const clock = createSimulationClock();
  let simulated = 0;
  const frames = [0.007, 0.035, 0.12, 0.009, 0.2, 0.018, 0.004, 0.11];
  for (const dt of frames)
    clock.advance(dt, true, (dt) => {
      assert.equal(dt, SIMULATION_STEP);
      simulated += dt;
    });
  const expected = frames.reduce((a, b) => a + b, 0);
  assert(simulated <= expected + 1e-9);
  assert(expected - simulated < SIMULATION_STEP);
});
test('pause, hidden-tab return and explicit reset discard suspended time without catch-up', () => {
  const clock = createSimulationClock();
  let moved = 0;
  const tick = (dt) => (moved += dt);
  clock.advance(0.1, true, tick);
  const before = moved;
  clock.advance(60, false, tick);
  clock.advance(60, true, tick);
  assert.equal(moved, before);
  clock.advance(0.1, true, tick);
  assert(Math.abs(moved - before - 0.1) < 1e-9);
  clock.reset();
  const stopped = moved;
  clock.advance(60, true, tick);
  assert.equal(moved, stopped);
});
test('a long active browser stall has bounded catch-up; invalid deltas cannot corrupt the clock', () => {
  const clock = createSimulationClock();
  let moved = 0;
  const tick = (dt) => (moved += dt);
  clock.advance(60, true, tick);
  assert(Math.abs(moved - MAX_FRAME_SECONDS) < 1e-9);
  for (const invalid of [-1, NaN, Infinity]) clock.advance(invalid, true, tick);
  assert(Math.abs(moved - MAX_FRAME_SECONDS) < 1e-9);
});

test('playable 2x covers twice the distance without falsifying ship speed, at every tested FPS', () => {
  for (const fps of [5, 10, 15, 30, 60, 120]) {
    const result = cruise(fps, 2);
    assert(Math.abs(result.distance - 144) < 1e-6);
    assert(Math.abs(result.clock - 20) < 1e-8);
    assert.equal(result.s.u, 7.2);
  }
});
