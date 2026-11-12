import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sunDirection } from '../src/render/daylight.mjs';
test('the sun moves without jumps, also when the moon takes over', () => {
  let p = sunDirection(0),
    worst = 0;
  for (let t = 60; t <= 86400; t += 60) {
    const q = sunDirection(t);
    worst = Math.max(worst, Math.hypot(q.x - p.x, q.y - p.y, q.z - p.z));
    p = q;
  }
  assert.ok(worst < 0.1, `largest step per minute ${worst}`);
  assert.ok(sunDirection(13 * 3600).y > 0.7, 'high at noon');
});
