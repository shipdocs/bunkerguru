import * as T from '../../vendor/three.js';
import { createPrimitives } from './primitives.mjs';
import { createWater } from './water.mjs';
import { createShipFactory } from './ship-model.mjs';
import { createHarborScenery } from './scenery.mjs';
import { batchVessel } from './scene-batch.mjs';
import { land, basins, waterAt } from '../maps/amsterdam.mjs';
import { terminals, berths, trafficAt } from '../game/harbor.mjs';
import { profileOf } from '../game/ship-profile.mjs';
import { renderYaw } from '../game/vessel.mjs';
import { cameraRange } from './camera.mjs';
export function createWorld({
  canvas,
  state: s,
  quality,
  createRenderer = (options) => new T.WebGLRenderer(options),
}) {
  const renderer = createRenderer({
    canvas,
    antialias: !quality.light,
    powerPreference: 'default',
  });
  renderer.setPixelRatio(quality.pixelRatio);
  renderer.shadowMap.enabled = quality.shadows;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  const scene = new T.Scene();
  scene.background = new T.Color('#b8dce3');
  scene.fog = new T.FogExp2('#c1d9d3', 0.00055);
  const camera = new T.PerspectiveCamera(44, 1, 0.5, 5000);
  scene.add(new T.HemisphereLight('#e2f2ff', '#78906e', 2));
  const sun = new T.DirectionalLight('#ffdfac', 2.8);
  sun.position.set(-220, 220, 160);
  sun.castShadow = true;
  sun.shadow.mapSize.set(quality.shadowSize, quality.shadowSize);
  Object.assign(sun.shadow.camera, {
    left: -420,
    right: 420,
    top: 400,
    bottom: -400,
    near: 1,
    far: 1000,
  });
  sun.shadow.bias = -0.0005;
  scene.add(sun);
  const primitives = createPrimitives(scene);
  const { mesh, box, cyl, textSprite } = primitives;
  const waterMat = createWater(mesh);
  const ship = createShipFactory(scene, primitives);
  const terrain = new T.Group();
  for (const l of land) {
    box(
      l.x1 - l.x0,
      7,
      l.z1 - l.z0,
      ['north', 'park'].includes(l.kind) ? '#8ba372' : l.kind === 'tanks' ? '#b6b8a0' : '#b9b8a3',
      (l.x0 + l.x1) / 2,
      0.5,
      (l.z0 + l.z1) / 2,
      terrain,
    );
  }
  batchVessel(terrain);
  terrain.children[0].name = 'terrain-surface';
  scene.add(terrain);
  const scenery = createHarborScenery(scene);
  for (const b of basins)
    textSprite(
      b.name,
      (b.x0 + b.x1) / 2,
      12,
      (b.z0 + b.z1) / 2,
      Math.min(110, b.x1 - b.x0) * 0.7,
      '#dce4d2',
    );
  for (const t of terminals) textSprite(t.name, t.anchorX, 14, t.z, 42);
  textSprite('NOORDZEEKANAAL', 0, 12, 0, 150, '#dce4d2');
  for (const [x, name] of [
    [-2470, 'IJMUIDEN · KAARTGRENS'],
    [2470, 'AMSTERDAM · KAARTGRENS'],
  ]) {
    textSprite(name, x, 14, 0, 80);
    for (const z of [-100, -50, 0, 50, 100]) {
      cyl(2, 1, '#d4b77a', x, 1, z);
      cyl(0.4, 4, '#d4b77a', x, 3, z);
    }
  }
  const vesselProfile = profileOf(s),
    zoomLimits = cameraRange(vesselProfile);
  const boat = ship(vesselProfile.length, vesselProfile.beam, '#ba6539', true, vesselProfile);
  for (const b of berths) {
    const m = ship(b.length, b.beam, b.color);
    m.position.set(b.shipX, 0, b.shipZ);
    m.rotation.y = renderYaw(b.h);
    textSprite(b.name, b.shipX, 20, b.shipZ, 34);
  }
  const trafficMeshes = trafficAt(s.clock).map((b, i) => {
    const m = ship(b.length, b.beam, b.color, i === 3);
    textSprite(b.name, 0, 13, 0, 20, '#e8e3bd', m);
    return m;
  });

  for (let x = -2200; x < 2400; x += 650)
    for (const side of [-1, 1]) {
      const z = side * 110;
      if (waterAt(x, z)) {
        cyl(1.5, 1, side < 0 ? '#c87554' : '#6eaf86', x, 1, z);
        cyl(0.3, 3, '#d8d7b8', x, 3, z);
      }
    }

  return {
    renderer,
    scene,
    camera,
    sun,
    waterMat,
    scenery,
    boat,
    trafficMeshes,
    vesselProfile,
    zoomLimits,
    primitives,
  };
}
