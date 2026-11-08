import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh } from '../src/game/simulation.mjs';
import { vesselStep } from '../src/game/vessel.mjs';
import { HarborAudio } from '../src/audio/harbor-audio.mjs';
test('pneumatic clutch fires once on engaging and once on reversing, not on every throttle change', () => {
  const s = { ...fresh(), handling: 'arcade', timeScale: 2, moored: false, x: 0, z: 0 },
    events = [];
  const run = (n) => {
    for (let i = 0; i < n * 20; i++) vesselStep(s, 0.05, {}, undefined, (r) => events.push(r));
  };
  s.teleIdx = 4;
  run(4);
  assert.deepEqual(events, [false]);
  s.teleIdx = 5;
  run(3);
  assert.deepEqual(events, [false]);
  s.teleIdx = 2;
  run(6);
  assert.deepEqual(events, [false, true]);
});
test('adapter preserves old rpm, speed and opposing thruster semantics; pause gates clutch', () => {
  const a = new HarborAudio(),
    calls = [];
  a.sound = {
    setActive: (v) => calls.push(['active', v]),
    update: (v) => calls.push(['update', v]),
    clutch: (v) => calls.push(['clutch', v]),
  };
  a.update({ ...fresh(), moored: false, rpm: 0.9, u: 3, v: 4 }, true, { bowL: true, bowR: true });
  assert.equal(calls[1][1].rpm, 0.9);
  assert.equal(calls[1][1].speed, 5);
  assert.equal(calls[1][1].bow, 0);
  a.clutch(true);
  assert.deepEqual(calls.at(-1), ['clutch', true]);
  a.update(fresh(), false);
  const n = calls.length;
  a.clutch(false);
  assert.equal(calls.length, n);
});
