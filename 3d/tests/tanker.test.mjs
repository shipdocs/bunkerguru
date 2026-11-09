import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.js';
import { createBunkerTanker } from '../src/render/bunker-tanker.mjs';
import { PROFILES, hullOutline } from '../src/game/ship-profile.mjs';
import { fresh, restore } from '../src/game/state.mjs';

test('tanker preserves metre beam, finite geometry and a mobile-sized rigid batch count', () => {
  const model = createBunkerTanker(PROFILES.legacy);
  let triangles = 0,
    meshes = 0;
  model.traverse((o) => {
    if (!o.isMesh) return;
    meshes++;
    const positions = o.geometry.attributes.position;
    assert([...positions.array].every(Number.isFinite));
    triangles += (o.geometry.index?.count || positions.count) / 3;
  });
  assert(meshes <= 20);
  assert(triangles < 20000);
  const editable = createBunkerTanker(PROFILES.legacy, { editable: true });
  const hull = editable.getObjectByName('Hull');
  hull.geometry.computeBoundingBox();
  const size = hull.geometry.boundingBox.getSize(new T.Vector3());
  assert(Math.abs(size.x - 11) < 0.001);
  // Preserve the existing shared collision/render outline, including curved ends.
  const outline = new T.Shape();
  for (const [method, ...args] of hullOutline(PROFILES.legacy)) outline[method](...args);
  const points = outline.getPoints(18);
  const expected = Math.max(...points.map((p) => p.y)) - Math.min(...points.map((p) => p.y));
  assert(Math.abs(size.z - expected) < 0.001);
});

test('radar stops, light circuits switch independently, and crane pivots survive batching', () => {
  const model = createBunkerTanker(PROFILES.legacy),
    rig = model.userData.tanker;
  rig.update(0.2);
  const angle = rig.radar.rotation.y;
  assert(angle > 0);
  rig.controls.radar = false;
  rig.controls.navigation = false;
  rig.controls.deck = true;
  rig.controls.cabin = true;
  rig.controls.boomSide = -1;
  for (let i = 0; i < 100; i++) rig.update(0.1);
  assert.equal(rig.radar.rotation.y, angle);
  assert.equal(rig.nav.visible, false);
  assert.equal(rig.deckLights.visible, true);
  assert.equal(rig.cabin.visible, true);
  assert.equal(rig.slew.rotation.y, -Math.PI / 2);
  assert(rig.lift.rotation.x < -0.5);
  assert(rig.hose.visible);
  assert(rig.slew.children.includes(rig.lift));
  const fixed = model.getObjectByName('Hull-and-deck');
  assert.equal(fixed.rotation.y, 0);
  // Pause cannot advance motion; returning to rest centres before lowering.
  rig.controls.boomSide = 0;
  rig.update(0);
  assert.equal(rig.slew.rotation.y, -Math.PI / 2);
  for (let i = 0; i < 100; i++) rig.update(0.1);
  assert.equal(rig.slew.rotation.y, 0);
  assert(Math.abs(rig.lift.rotation.x) < 1e-9);
  assert.equal(rig.hose.visible, false);
});

test('older saves get equipment defaults and valid user settings survive restore', () => {
  const old = fresh();
  delete old.equipment;
  assert.deepEqual(restore(old).equipment, fresh().equipment);
  const s = fresh();
  s.equipment = {
    radar: false,
    navigation: false,
    deck: true,
    cabin: true,
    boomSide: -1,
    boomRaised: true,
  };
  assert.deepEqual(restore(s).equipment, s.equipment);
  s.equipment = { radar: 'false', boomSide: Infinity, deck: 1 };
  assert.deepEqual(restore(s).equipment, fresh().equipment);
  s.equipment = null;
  assert.deepEqual(restore(s).equipment, fresh().equipment);
});

test('delivering raises the boom and swings the hose over the customer ship', async () => {
  const { boomSettings } = await import('../src/game/vessel-equipment.mjs');
  const { renderYaw } = await import('../src/game/vessel.mjs');
  for (const h of [0, 0.7, Math.PI / 2, 2.4, -1.9])
    for (const side of [-1, 1]) {
      const model = createBunkerTanker(PROFILES.legacy),
        rig = model.userData.tanker;
      const s = fresh();
      Object.assign(s, { x: 100, z: -50, h, phase: 'bunker', moored: false });
      // Customer 30 m abeam on the given side (starboard = (cos h, sin h)).
      const ship = { shipX: s.x + side * 30 * Math.cos(h), shipZ: s.z + side * 30 * Math.sin(h) };
      model.position.set(s.x, 0, s.z);
      model.rotation.y = renderYaw(s.h);
      // In place within 40 % of the pumping time, also with the turbo pump (2.5 s).
      for (let i = 0; i < 10; i++) rig.update(0.1, boomSettings(s, ship, 2.5));
      assert(rig.hose.visible, 'hose shows once the boom is up');
      model.updateMatrixWorld(true);
      const tip = rig.hose.getWorldPosition(new T.Vector3());
      // Hose tip reaches out abeam on the customer's side (starboard = (cos h, sin h)).
      const abeam = (tip.x - s.x) * Math.cos(h) + (tip.z - s.z) * Math.sin(h);
      assert(side * abeam > 15, `h=${h} side=${side}: hose ${abeam.toFixed(1)} m abeam`);
      // Afterwards the switches rule again: unmoored, the boom stows.
      s.phase = 'sail';
      s.equipment.boomSide = 0;
      s.equipment.boomRaised = false;
      for (let i = 0; i < 400; i++) rig.update(0.1, boomSettings(s, ship));
      assert(!rig.hose.visible, 'boom stowed after delivery');
    }
  const s = fresh();
  assert.equal(boomSettings(s, null), s.equipment, 'saved setting untouched outside delivery');
});
