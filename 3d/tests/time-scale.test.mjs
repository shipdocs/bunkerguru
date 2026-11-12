import { test } from 'node:test';
import assert from 'node:assert/strict';

test('fast-forward falls back to the normal pace only near the bank', async () => {
  const { warpBrake } = await import('../src/game/time-scale.mjs');
  const fast = (o = {}) => ({ timeScale: 12, moored: false, u: 4, v: 0, ...o });
  assert.equal(warpBrake(fast(), false), null, 'open water: keep going, steering or not');
  assert.match(warpBrake(fast(), true), /dicht bij de kant/);
  assert.equal(warpBrake(fast({ u: 0.5 }), true), null, 'drifting near the quay is fine');
  assert.equal(warpBrake(fast({ moored: true }), true), null, 'moored: loading goes on fast');
  assert.equal(warpBrake(fast({ timeScale: 3 }), true), null, 'already at the normal pace');
});

test('in fast-forward the helm swings her no faster per real second than at 3x', async () => {
  const { simStep } = await import('../src/game/sim-vessel.mjs');
  const { playStep } = await import('../src/game/play-vessel.mjs');
  const { fresh } = await import('../src/game/state.mjs');
  for (const step of [simStep, playStep]) {
    const turned = (timeScale) => {
      const s = fresh();
      Object.assign(s, { x: 0, z: 0, h: 0, u: 4, v: 0, r: 0, rpm: 0.6, engDir: 1, moored: false });
      Object.assign(s, { timeScale, rudderCmd: 1, rudder: 1, teleIdx: 5 });
      for (let i = 0; i < 300; i++) step(s, 1 / 60, {}, null, () => {}, 0.6); // 5 real seconds
      return Math.abs(s.h);
    };
    const normal = turned(3),
      fast = turned(12);
    assert.ok(normal > 0.05, `${step.name}: she turns at 3x (${normal})`);
    assert.ok(
      fast > normal * 0.7 && fast < normal * 1.5,
      `${step.name}: 12x turns ${fast} rad vs ${normal} at 3x (she still steers, no faster)`,
    );
  }
});

test('in fast-forward the rudder swings over and brakes at the 3x pace per real second', async () => {
  const { simStep } = await import('../src/game/sim-vessel.mjs');
  const { playStep } = await import('../src/game/play-vessel.mjs');
  const { fresh } = await import('../src/game/state.mjs');
  for (const step of [simStep, playStep]) {
    const after = (timeScale, seconds) => {
      const s = fresh();
      Object.assign(s, { x: 0, z: 0, h: 0, u: 4, v: 0, r: 0, rpm: 0, engDir: 0, moored: false });
      Object.assign(s, { timeScale, rudderCmd: 0, rudder: 0 });
      for (let i = 0; i < seconds * 60; i++) step(s, 1 / 60, { helm: 1 }, null, () => {}, 0);
      return s;
    };
    // the wheel thrown hard over: the rudder gets there no sooner in real time
    const r3 = after(3, 0.05).rudder,
      r12 = after(12, 0.05).rudder;
    assert.ok(
      r12 > r3 * 0.7 && r12 < r3 * 1.5,
      `${step.name}: rudder after 0.05 s ${r12} at 12x vs ${r3} at 3x`,
    );
  }
  // schipper: speed lost to a hard-over rudder per real second stays near the 3x loss
  const lost = (timeScale) => {
    const s = fresh();
    Object.assign(s, { x: 0, z: 0, h: 0, u: 4, v: 0, r: 0, rpm: 0, engDir: 0, moored: false });
    Object.assign(s, { timeScale, rudderCmd: 1, rudder: 1 });
    const free = { ...s, rudderCmd: 0, rudder: 0 };
    for (let i = 0; i < 120; i++) {
      simStep(s, 1 / 60, {}, null, () => {}, 0);
      simStep(free, 1 / 60, {}, null, () => {}, 0);
    }
    return Math.hypot(free.u, free.v) - Math.hypot(s.u, s.v);
  };
  assert.ok(lost(12) < lost(3) * 2, `rudder drag at 12x ${lost(12)} vs ${lost(3)} at 3x`);
});
