import * as T from '../../vendor/three.js';
import { createPrimitives } from './primitives.mjs';
import { createWater } from './water.mjs';
import { createShipFactory } from './ship-model.mjs';
import { createHarborScenery } from './scenery.mjs';
import { batchVessel } from './scene-batch.mjs';
import {
  MAP,
  land,
  basins,
  waterAt,
  labels,
  terminals,
  waits,
  customers,
  tideLevel,
} from '../maps/index.mjs';
import { skyLook } from './daylight.mjs';
import { createLandmarks } from './landmarks.mjs';
import { dayClock } from '../game/harbor.mjs';
import { profileOf } from '../game/ship-profile.mjs';
import { renderYaw } from '../game/vessel.mjs';
import { cameraRange } from './camera.mjs';
export function createWorld({
  canvas,
  state: s,
  world: sim,
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
  renderer.toneMappingExposure = 1.2; // a bright, saturated, toy-like harbour
  const scene = new T.Scene();
  scene.background = new T.Color('#9fd4ea');
  scene.fog = new T.FogExp2('#c1d9d3', 0.00045);
  const camera = new T.PerspectiveCamera(44, 1, 0.5, 6000);
  const hemi = new T.HemisphereLight('#eef8ff', '#6f9a5a', 2.2);
  scene.add(hemi);
  const sun = new T.DirectionalLight('#ffe2b0', 3.1);
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
  const waterMat = createWater(mesh, MAP);
  const ship = createShipFactory(scene, primitives);
  const terrain = new T.Group();
  const landColor = (k) =>
    ['north', 'park', 'island', 'base'].includes(k)
      ? '#7fae5a'
      : ['town', 'town2', 'city'].includes(k)
        ? '#d4c29c'
        : k === 'tanks'
          ? '#c6c2a2'
          : k === 'pillar'
            ? '#c9c9c4'
            : '#c9bf9e';
  for (const l of land) {
    if (l.kind === 'pillar') continue;
    box(
      l.x1 - l.x0,
      7,
      l.z1 - l.z0,
      landColor(l.kind),
      (l.x0 + l.x1) / 2,
      0.5,
      (l.z0 + l.z1) / 2,
      terrain,
    );
  }
  batchVessel(terrain);
  if (terrain.children[0]) terrain.children[0].name = 'terrain-surface';
  scene.add(terrain);
  const scenery = createHarborScenery(scene, quality);
  const landmarks = createLandmarks(scene, primitives);
  for (const b of basins)
    textSprite(
      b.name,
      (b.x0 + b.x1) / 2,
      12,
      b.labelZ ?? (b.z0 + b.z1) / 2,
      Math.min(110, b.x1 - b.x0) * 0.7,
      '#dce4d2',
      scene,
      0.11,
    );
  for (const l of labels)
    textSprite(l.text, l.x, 16, l.z, Math.max(40, (l.size || 14) * 6), '#f4efd8', scene, 0.12);
  for (const l of land)
    if (l.label)
      textSprite(l.label, (l.x0 + l.x1) / 2, 18, (l.z0 + l.z1) / 2, 60, '#f4efd8', scene, 0.11);
  // Terminal strips (yellow quay edge) and waiting places (blue P, yellow W = yard).
  for (const t of [...terminals, ...waits]) {
    const col = t.kind === 'terminal' ? '#e8c64a' : t.yard ? '#f0b429' : '#4d8fd6';
    const w = t.x1 - t.x0,
      d = t.z1 - t.z0;
    const strip = box(w, 0.3, d, col, t.x, 0.4, t.z);
    strip.material = new T.MeshBasicMaterial({
      color: col,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    });
    strip.castShadow = false;
    textSprite(
      (t.kind === 'terminal' ? '⛽ ' : t.yard ? 'W 🔧 ' : 'P ') + t.name,
      t.x,
      14,
      t.z,
      48,
      t.kind === 'terminal' ? '#ffe9a0' : '#d8ecff',
      scene,
      0.12,
    );
  }
  for (const side of [-1, 1])
    for (const x of [-MAP.halfWidth + 30, MAP.halfWidth - 30]) {
      for (const z of [-0.7, -0.35, 0, 0.35, 0.7].map((f) => f * MAP.riverHalf)) {
        cyl(2, 1, '#d4b77a', x, 1, z);
        cyl(0.4, 4, '#d4b77a', x, 3, z);
      }
      void side;
    }
  textSprite(MAP.name.toUpperCase() + ' · KAARTGRENS', -MAP.halfWidth + 30, 14, 0, 90);
  const vesselProfile = profileOf(s),
    zoomLimits = cameraRange(vesselProfile);
  const boat = ship(vesselProfile.length, vesselProfile.beam, '#ba6539', true, vesselProfile);
  const customerMeshes = [];
  for (const b of customers) {
    const m = ship(b.length, b.beam, b.color);
    customerMeshes.push(m);
    m.position.set(b.shipX, 0, b.shipZ);
    m.rotation.y = renderYaw(b.h);
    textSprite(b.name, b.shipX, 22, b.shipZ, 40, '#e9edda', scene, 0.11);
  }
  const trafficMeshes = sim.traffic.map((b) => {
    const m = ship(b.length, b.beam, b.color, b.length < 80);
    textSprite(b.name, 0, 14, 0, 22, '#e8e3bd', m);
    return m;
  });
  // Rivals and your own fleet: meshes per boat, made on first sight (a boat bought
  // later gets one too) and hidden when a boat leaves the list (new career).
  const vesselMesh = (r) => {
    const m = ship(110, 11, r.color, true, vesselProfile);
    // Rivals carry their colour loud and clear: a hull band and a painted funnel.
    box(11.6, 1.4, 100, r.color, 0, 2.2, 0, m);
    box(4, 9, 4, r.color, 0, 13, 40, m);
    textSprite(r.name.toUpperCase(), 0, 19, 0, 26, r.own ? '#ffe7b0' : '#ffd9cf', m, 0.1);
    return m;
  };
  const meshOf = new Map(sim.rivals.map((r) => [r, vesselMesh(r)]));
  const rivalMeshes = [...meshOf.values()];
  // Movable bridges and lock gates: a coloured barrier that slides away when open.
  const gateMeshes = sim.gates.map((g) => {
    const grp = new T.Group();
    const along = g.x1 - g.x0 > g.z1 - g.z0;
    const len = along ? g.x1 - g.x0 : g.z1 - g.z0;
    const deck = box(
      along ? len : 6,
      4,
      along ? 6 : len,
      g.kind === 'brug' ? '#c9453a' : '#2b2f3a',
      0,
      4,
      0,
      grp,
    );
    const lamp = mesh(
      new T.SphereGeometry(2.2, 10, 8),
      new T.MeshBasicMaterial({ color: '#e74c3c' }),
      0,
      12,
      0,
      grp,
    );
    grp.position.set((g.x0 + g.x1) / 2, 0, (g.z0 + g.z1) / 2);
    textSprite(g.name, 0, 20, 0, 40, '#ffe9a0', grp, 0.11);
    scene.add(grp);
    return { g, grp, deck, lamp, along, len };
  });
  // Drifting containers (incident).
  const flotsamGeo = new T.BoxGeometry(12, 3, 2.5),
    flotsamMat = new T.MeshStandardMaterial({ color: '#d35400' });
  const flotsamMeshes = [];
  // Quay lamps: glowing dots along terminals, berths and waiting places, lit at night.
  const glowTex = (() => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    const c = cv.getContext('2d'),
      g = c?.createRadialGradient?.(32, 32, 2, 32, 32, 30);
    if (g) {
      g.addColorStop(0, 'rgba(255,240,200,1)');
      g.addColorStop(0.35, 'rgba(255,200,120,0.55)');
      g.addColorStop(1, 'rgba(255,180,90,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, 64, 64);
    }
    return new T.CanvasTexture(cv);
  })();
  const lampMat = new T.SpriteMaterial({
    map: glowTex,
    transparent: true,
    depthWrite: false,
    blending: T.AdditiveBlending,
    opacity: 0,
  });
  const lamps = new T.Group();
  lamps.name = 'quay lamps';
  for (const z of [...terminals, ...customers.map((c) => c.zone), ...waits]) {
    const n = Math.max(2, Math.round((z.x1 - z.x0) / 70));
    for (let i = 0; i < n; i++) {
      const sp = new T.Sprite(lampMat);
      sp.position.set(z.x0 + ((i + 0.5) / n) * (z.x1 - z.x0), 11, (z.z0 + z.z1) / 2);
      sp.scale.set(26, 26, 1);
      lamps.add(sp);
    }
  }
  lamps.visible = false;
  scene.add(lamps);
  // Masthead light on every vessel at night (own boat, traffic, rivals).
  const mastMat = lampMat.clone();
  const mastLight = (parent, h = 22) => {
    const sp = new T.Sprite(mastMat);
    sp.position.set(0, h, 0);
    sp.scale.set(18, 18, 1);
    parent.add(sp);
  };
  for (const m of [boat, ...trafficMeshes, ...rivalMeshes, ...customerMeshes]) mastLight(m);
  let level = 0;
  const skyCol = new T.Color(),
    tmp = new T.Color();
  // Sky, sun, fog and water follow the harbour clock; the water rises and falls with
  // the tide (±1,2 m against the quay walls). Returns the water level for the ships.
  function updateAmbient(st) {
    const look = skyLook(dayClock(st));
    scene.background = skyCol.set(look.sky);
    scene.fog.color.set(look.fog);
    sun.color.set(look.sunColor);
    sun.intensity = look.sun;
    hemi.intensity = look.hemi;
    renderer.toneMappingExposure = look.exposure;
    waterMat.uniforms.night.value = look.night;
    // Linear, like the rest of the shader: colorspace_fragment encodes the result.
    tmp.set(look.fog);
    waterMat.uniforms.fogCol.value.set(tmp.r, tmp.g, tmp.b);
    lampMat.opacity = mastMat.opacity = Math.max(0, (look.night - 0.25) / 0.75);
    lamps.visible = lampMat.opacity > 0.01;
    level = tideLevel(st.clock, st.tidePhase);
    if (waterMat.userData.mesh) waterMat.userData.mesh.position.y = level;
    for (const m of customerMeshes) m.position.y = level;
    return level;
  }
  function updateDynamic(world, time) {
    landmarks.update(time);
    for (const [i, b] of world.traffic.entries()) {
      trafficMeshes[i].position.set(b.x, level, b.z);
      trafficMeshes[i].rotation.y = renderYaw(b.h);
    }
    for (const m of meshOf.values()) m.visible = false;
    for (const [i, r] of world.rivals.entries()) {
      let m = meshOf.get(r);
      if (!m) {
        meshOf.set(r, (m = vesselMesh(r)));
        mastLight(m);
      }
      const sinking = r.mode === 'sunk' ? Math.min(1, r.sinkT / 12) : 0;
      m.position.set(r.x, level + Math.sin(time * 1.1 + i) * 0.07 - sinking * 8, r.z);
      m.rotation.set(sinking * 0.3, renderYaw(r.h), 0);
      m.visible = sinking < 1;
    }
    for (const gm of gateMeshes) {
      const open = gm.g.state === 'open' ? 1 : 0;
      const k = (gm.k = (gm.k ?? 0) + (open - (gm.k ?? 0)) * 0.05);
      if (gm.g.kind === 'brug') {
        gm.deck.rotation[gm.along ? 'z' : 'x'] = k * 1.2;
        gm.deck.position.y = 4 + k * 12;
      } else gm.deck.scale.set(gm.along ? 1 - k * 0.8 : 1, 1, gm.along ? 1 : 1 - k * 0.8);
      gm.lamp.material.color.set(
        gm.g.state === 'open' ? '#2ecc71' : gm.g.state === 'prep' ? '#f1c40f' : '#e74c3c',
      );
    }
    const fl = world.events.flotsam;
    while (flotsamMeshes.length < fl.length)
      flotsamMeshes.push(mesh(flotsamGeo, flotsamMat, 0, 0.8, 0));
    flotsamMeshes.forEach((m, i) => {
      m.visible = i < fl.length;
      if (m.visible) {
        m.position.set(fl[i].x, level + 0.6 + Math.sin(time * 2 + i) * 0.3, fl[i].z);
        m.rotation.y = fl[i].rot;
      }
    });
    // Fog incident: thick fog, otherwise light haze.
    const fog = world.events.fog > 0 ? 0.0045 : 0.00045;
    scene.fog.density += (fog - scene.fog.density) * 0.02;
  }
  void waterAt;
  return {
    renderer,
    scene,
    camera,
    sun,
    waterMat,
    scenery,
    boat,
    trafficMeshes,
    rivalMeshes,
    vesselProfile,
    zoomLimits,
    primitives,
    updateDynamic,
    updateAmbient,
    mastLight,
    lamps,
    landmarks,
  };
}
