import { test } from 'node:test';
import assert from 'node:assert/strict';

test('fast-forward falls back to the normal pace when you steer or near the bank', async () => {
  const { warpBrake } = await import('../src/game/time-scale.mjs');
  const fast = (o = {}) => ({ timeScale: 12, moored: false, u: 4, v: 0, ...o });
  assert.equal(warpBrake(fast(), false, false), null, 'straight on, open water: keep going');
  assert.match(warpBrake(fast(), true, false), /je stuurt/);
  assert.match(warpBrake(fast(), false, true), /dicht bij de kant/);
  assert.equal(warpBrake(fast({ u: 0.5 }), false, true), null, 'drifting near the quay is fine');
  assert.equal(warpBrake(fast({ moored: true }), true, true), null, 'moored: loading goes on fast');
  assert.equal(warpBrake(fast({ timeScale: 3 }), true, true), null, 'already at the normal pace');
});
