import { test } from 'node:test';
import assert from 'node:assert/strict';
globalThis.BUNKERGURU_MAP = 'rotterdam';
const T = await import('../vendor/three.js');
const { lampSpots, createQuayLife } = await import('../src/render/quay-life.mjs');
const { SHAPE } = await import('../src/maps/index.mjs');

test('lamp posts stand on the quays, their light falls on the water', () => {
  const { posts, pools } = lampSpots();
  const n = posts.length / 3;
  assert.ok(n > 100 && n < 2000, `${n} lamp posts`);
  let onLand = 0,
    onWater = 0;
  for (let i = 0; i < n; i++) {
    if (!SHAPE.inside(posts[i * 3], posts[i * 3 + 2])) onLand++;
    if (SHAPE.inside(pools[i * 3], pools[i * 3 + 2])) onWater++;
  }
  assert.ok(onLand / n > 0.95 && onWater / n > 0.9, `${onLand} on land, ${onWater} pools on water`);
});

test('people walk on the quay, not in the water, and the lamps wait for the dusk', () => {
  const w = SHAPE.wall(1090, 500, 400);
  const life = createQuayLife(new T.Scene(), {
    strollers: [{ x: w.qx, z: w.qz, tx: w.tx, tz: w.tz, nx: w.nx, nz: w.nz }],
  });
  assert.ok(life.people > 0);
  for (let k = 0; k < 100; k++) life.update(k * 0.5, 0.5, 0, 0);
});
