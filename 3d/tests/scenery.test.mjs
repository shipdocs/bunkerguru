import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.js';
import { createHarborScenery, landContains } from '../src/render/scenery.mjs';
import { graphicsProfile } from '../src/render/graphics.mjs';
import { batchVessel } from '../src/render/scene-batch.mjs';
const scene = new T.Scene(),
  scenery = createHarborScenery(scene),
  camera = new T.PerspectiveCamera();
camera.position.set(-268, 74, 770);
test('dense harbour fits a bounded geometry and draw budget, with finite colours and normals', () => {
  assert(scenery.stats.parcels > 400);
  assert(scenery.stats.parts > 10000);
  assert(scenery.stats.triangles < 550000);
  assert(scenery.stats.draws < 500);
  scene.traverse((o) => {
    if (o.geometry) {
      for (const key of ['position', 'normal', 'color']) {
        const a = o.geometry.getAttribute(key);
        if (a) for (const n of a.array) assert(Number.isFinite(n));
      }
    }
  });
});
test('ground parcels stay on land, away from navigation', () => {
  assert(scenery.footprints.length > 50);
  for (const p of scenery.footprints) assert(landContains(p.x, p.z, p.width, p.depth));
});
test('mobile automatically limits resolution and shadows, with a manual override', () => {
  const mobile = graphicsProfile('auto', {
    width: 390,
    height: 844,
    dpr: 3,
    coarse: true,
    cores: 8,
  });
  assert(mobile.light);
  assert.equal(mobile.shadows, false);
  assert(mobile.pixelRatio <= 1.15);
  assert(graphicsProfile('auto', { width: 844, height: 390 }).light);
  assert(graphicsProfile('auto', { width: 1366, height: 768, coarse: true }).light);
  assert(!graphicsProfile('rich', { width: 390, height: 844, coarse: true }).light);
  assert(graphicsProfile('light', { width: 1920, height: 1080 }).light);
});
test('distant detail is culled, mobile has fewer visible tiles, and the world remains stable when paused', () => {
  scenery.update(30, camera, graphicsProfile('rich'), true);
  const rich = [...scenery.tiles.values()].filter((t) => t.mesh.visible).length;
  scenery.update(30, camera, graphicsProfile('light'), true);
  const light = [...scenery.tiles.values()].filter((t) => t.mesh.visible).length;
  assert(light < rich);
  assert(light < 100);
  const main = [...scenery.tiles.values()].filter((t) => !t.detail && t.mesh.visible);
  assert(main.length > 20, 'mobile keeps the harbour skyline');
});
test('batching preserves hull bounds and coloured fittings while reducing draw calls', () => {
  const root = new T.Group(),
    red = new T.MeshStandardMaterial({ color: '#d26e54' });
  for (let i = 0; i < 10; i++) {
    const m = new T.Mesh(new T.BoxGeometry(2, 3, 4), red);
    m.position.set(i, 2, i * 2);
    m.rotation.y = 0.3 * i;
    root.add(m);
  }
  root.updateMatrixWorld(true);
  const before = new T.Box3().setFromObject(root);
  batchVessel(root);
  root.updateMatrixWorld(true);
  const after = new T.Box3().setFromObject(root);
  assert.equal(root.children.length, 1);
  assert(before.min.distanceTo(after.min) < 1e-5);
  assert(before.max.distanceTo(after.max) < 1e-5);
  assert(root.children[0].geometry.getAttribute('color').count > 0);
});
