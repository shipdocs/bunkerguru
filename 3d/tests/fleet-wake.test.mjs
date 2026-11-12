import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.js';
import { createFleetWake, vesselWake, FLEET_MAX } from '../src/render/fleet-wake.mjs';

test('the wake follows the way she moves, also going astern', () => {
  const ahead = vesselWake(0, 0, Math.PI / 2, 4, 110, 11),
    astern = vesselWake(0, 0, Math.PI / 2, -2, 110, 11);
  assert.ok(ahead.fx > 0.99 && ahead.speed === 4, 'heading east, making 4 m/s');
  assert.ok(astern.fx < -0.99 && astern.speed === 2, 'going astern: the wake is ahead');
});

test('only boats making way throw a wake; the buffers never overflow', () => {
  const scene = new T.Scene(),
    w = createFleetWake(scene);
  const boat = (speed) => ({ x: 0, z: 0, fx: 1, fz: 0, speed, length: 110, beam: 11 });
  assert.equal(w.update([boat(0), boat(0.2)], 0), 0);
  assert.equal(w.update([boat(4), boat(0)], 0), 1);
  assert.equal(
    w.update(
      Array.from({ length: 40 }, () => boat(6)),
      0,
    ),
    FLEET_MAX,
  );
  const p = w.mesh.geometry.attributes.position.array;
  assert.ok(p.every(Number.isFinite));
  // the wake lies behind the stern (west of a boat heading east), the collar at the bow
  let minX = Infinity,
    maxX = -Infinity;
  for (let i = 0; i < p.length; i += 3)
    ((minX = Math.min(minX, p[i])), (maxX = Math.max(maxX, p[i])));
  assert.ok(minX < -100 && minX > -300 && maxX > 50 && maxX < 70, `${minX} … ${maxX}`);
});
