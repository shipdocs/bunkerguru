import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.js';
import { createShipSmoke, smokeRate, SMOKE_MAX } from '../src/render/ship-smoke.mjs';

test('working ships smoke more, small boats not at all', () => {
  assert.equal(smokeRate(7, 14), 0);
  assert.ok(smokeRate(5, 110) > smokeRate(0, 110) * 3);
});

test('the puffs rise with time and the pool never overflows', () => {
  const smoke = createShipSmoke(new T.Scene());
  const ship = { key: 1, x: 0, z: 0, fx: 1, fz: 0, speed: 5, length: 200, beam: 30 };
  for (let k = 0; k < 600; k++) smoke.update([ship], 0.1, 0, { x: 0.5, z: 0 });
  const arr = smoke.mesh.instanceMatrix.array;
  assert.ok(arr.every(Number.isFinite));
  assert.equal(smoke.mesh.count, SMOKE_MAX);
  // some puffs high above the funnel, drifted downwind
  const m = new T.Matrix4(),
    p = new T.Vector3();
  let high = 0;
  for (let i = 0; i < SMOKE_MAX; i++) {
    smoke.mesh.getMatrixAt(i, m);
    p.setFromMatrixPosition(m);
    if (p.y > 34 && p.x > -72) high++; // above the funnel (x −72), drifted downwind
  }
  assert.ok(high >= 4, `${high} puffs aloft`);
});
