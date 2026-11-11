import * as T from '../../vendor/three.js';
import { createPrimitives } from './primitives.mjs';
import { createWater } from './water.mjs';
import { createShipFactory } from './ship-model.mjs';
import { createBunkerTanker } from './bunker-tanker.mjs';
import { createHarborScenery, landColor } from './scenery.mjs';
import { groundTexture, GROUND_TILE } from './ground.mjs';
import { batchVessel } from './scene-batch.mjs';
import { warpedRect, warpedSkirt, span } from './warp-geometry.mjs';
import { createRealTerrain, obbGeometry } from './real-terrain.mjs';
import {
  MAP,
  land,
  basins,
  waterAt,
  toWorld,
  labels,
  terminals,
  waits,
  customers,
  tideLevel,
  SHAPE,
  riverAt,
  riverSpan,
  riverHalfAt,
} from '../maps/index.mjs';
import { skyLook } from './daylight.mjs';
import { createLandmarks } from './landmarks.mjs';
import { tr } from '../i18n/index.mjs';
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
  scene.fog = new T.FogExp2('#cfe6ea', 0.00026);
  const camera = new T.PerspectiveCamera(44, 1, 0.5, 6000);
  // Sky dome: zenith colour fading to the haze on the horizon, a warm glow round the
  // sun. It travels with the camera, so the horizon never comes closer.
  const skyMat = new T.ShaderMaterial({
    uniforms: {
      top: { value: new T.Color('#63b4e8') },
      low: { value: new T.Color('#cfe6ea') },
      sunDir: { value: new T.Vector3(-0.6, 0.6, 0.45).normalize() },
      glow: { value: 1 },
    },
    vertexShader: `varying vec3 d;void main(){d=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec3 d;uniform vec3 top;uniform vec3 low;uniform vec3 sunDir;uniform float glow;
float hs(float x){return fract(sin(x*127.1)*43758.5453);}
float vn(float x){float i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(hs(i),hs(i+1.),f);}
void main(){vec3 n=normalize(d);float h=clamp(n.y,0.,1.);vec3 c=mix(low,top,pow(h,.36));
float s=max(dot(n,sunDir),0.);
c+=vec3(1.,.82,.55)*(pow(s,24.)*.35+pow(s,600.)*1.4)*glow;
// The far shore: a hazy line of trees, roofs and the odd tower all round the horizon.
float a=atan(n.z,n.x)*40.,y=n.y*100.;float trees=.35+vn(a*1.7)*.5+vn(a*9.)*.22;
float town=step(.62,vn(a*.23+7.))*step(.45,hs(floor(a*6.)))*(.5+hs(floor(a*6.)+.5)*1.3);
float tower=step(.965,hs(floor(a*3.)+9.))*step(.2,fract(a*3.))*step(fract(a*3.),.5)*2.6;
float land=max(trees,max(town,tower));
c=mix(c,mix(low,top,.35)*.8,(1.-smoothstep(land-.06,land+.06,y))*.55*step(-.3,y));gl_FragColor=vec4(c,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`,
    side: T.BackSide,
    depthWrite: false,
    fog: false,
  });
  const sky = new T.Mesh(new T.SphereGeometry(5200, 24, 12), skyMat);
  sky.name = 'sky';
  sky.frustumCulled = false;
  sky.renderOrder = -1;
  sky.onBeforeRender = (r, sc, cam) => sky.position.copy(cam.position);
  scene.add(sky);
  const hemi = new T.HemisphereLight('#d6e9ff', '#b7a78c', 2.2);
  scene.add(hemi);
  const sun = new T.DirectionalLight('#ffe2b0', 3.1);
  sun.position.set(-220, 220, 160);
  sun.castShadow = true;
  // A wide shadow box: the quays you sail past keep their shadows, not just the boat.
  sun.shadow.mapSize.set(quality.shadowSize * 2, quality.shadowSize * 2);
  Object.assign(sun.shadow.camera, {
    left: -640,
    right: 640,
    top: 620,
    bottom: -620,
    near: -600, // orthographic: also catch what stands between the boat and the sun
    far: 1400,
  });
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.4;
  scene.add(sun);
  const primitives = createPrimitives(scene);
  const { mesh, box, cyl, textSprite } = primitives;
  const waterMat = createWater(mesh, MAP, quality, renderer);
  const ship = createShipFactory(scene, primitives);
  // Land: a block per map rectangle, sides in the district colour, and a top with a
  // painted ground pattern (paving, concrete slabs, meadow) in world-size tiles.
  const terrain = new T.Group();
  const sides = new T.Group();
  const tops = new Map();
  const groundMat = (kind, col) => {
    const key = kind + col;
    if (!tops.has(key)) {
      const tex = groundTexture(kind, col, quality.light ? 512 : 1024);
      tex.wrapS = tex.wrapT = T.RepeatWrapping;
      tex.colorSpace = T.SRGBColorSpace;
      tex.anisotropy = 8;
      tops.set(key, new T.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 }));
    }
    return tops.get(key);
  };
  // Every map rectangle follows the warp: the river bank bends, the basin quays lean.
  const sideMats = new Map();
  for (const l of land) {
    if (l.kind === 'pillar') continue;
    const col = landColor(l);
    if (!sideMats.has(col))
      sideMats.set(col, new T.MeshStandardMaterial({ color: col, roughness: 0.76 }));
    sides.add(new T.Mesh(warpedSkirt(l, -3, 3.9), sideMats.get(col)));
    // Map-space UVs: the pattern runs on across neighbouring rectangles.
    const top = new T.Mesh(warpedRect(l, 4, GROUND_TILE), groundMat(l.kind, col));
    top.receiveShadow = true;
    top.name = 'terrain-top';
    terrain.add(top);
  }
  if (SHAPE) createRealTerrain(scene, quality);
  batchVessel(sides);
  if (sides.children[0]) sides.children[0].name = 'terrain-surface';
  terrain.add(sides);
  scene.add(terrain);
  const scenery = createHarborScenery(scene, quality);
  const landmarks = createLandmarks(scene, primitives);
  // Names stand where their place lies in the world.
  const nameAt = (text, x, y, z, ...rest) => {
    const p = toWorld(x, z);
    return textSprite(text, p.x, y, p.z, ...rest);
  };
  for (const b of basins)
    nameAt(
      b.name,
      b.label ? b.label.x : (b.x0 + b.x1) / 2,
      12,
      b.label ? b.label.z : (b.labelZ ?? (b.z0 + b.z1) / 2),
      Math.min(110, b.x1 - b.x0) * 0.7,
      '#dce4d2',
      scene,
      0.11,
    );
  for (const l of labels)
    nameAt(l.text, l.x, 16, l.z, Math.max(40, (l.size || 14) * 6), '#f4efd8', scene, 0.12);
  for (const l of land)
    if (l.label)
      nameAt(l.label, (l.x0 + l.x1) / 2, 18, (l.z0 + l.z1) / 2, 60, '#f4efd8', scene, 0.11);
  // Terminal strips (yellow quay edge) and waiting places (blue P, yellow W = yard).
  const stripMeshes = []; // lie on the water: lifted with the tide in updateAmbient
  for (const t of [...terminals, ...waits]) {
    const col = t.kind === 'terminal' ? '#e8c64a' : t.yard ? '#f0b429' : '#4d8fd6';
    const strip = mesh(
      t.obb ? obbGeometry(t.obb, 0.55) : warpedRect(t, 0.55),
      new T.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
      }),
    );
    strip.castShadow = false;
    stripMeshes.push(strip);
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
  // Buoys where the chart ends, across the river at both ends.
  if (MAP.river)
    for (const end of [-riverSpan + 30, riverSpan - 30])
      for (const f of [-0.7, -0.35, 0, 0.35, 0.7]) {
        const p = riverAt(end, f * riverHalfAt(end));
        cyl(2, 1, '#d4b77a', p.x, 1, p.z);
        cyl(0.4, 4, '#d4b77a', p.x, 3, p.z);
      }
  for (const side of MAP.river ? [] : [-1, 1])
    for (const x of [-MAP.halfWidth + 30, MAP.halfWidth - 30]) {
      for (const z of [-0.7, -0.35, 0, 0.35, 0.7].map((f) => f * MAP.riverHalf)) {
        const p = toWorld(x, z);
        cyl(2, 1, '#d4b77a', p.x, 1, p.z);
        cyl(0.4, 4, '#d4b77a', p.x, 3, p.z);
      }
      void side;
    }
  if (MAP.river) {
    const p = riverAt(-riverSpan + 30, 0);
    textSprite(MAP.name.toUpperCase() + tr(' · KAARTGRENS'), p.x, 14, p.z, 90);
  } else nameAt(MAP.name.toUpperCase() + tr(' · KAARTGRENS'), -MAP.halfWidth + 30, 14, 0, 90);
  const vesselProfile = profileOf(s),
    zoomLimits = cameraRange(vesselProfile);
  const boat = createBunkerTanker(vesselProfile);
  scene.add(boat);
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
    const m = ship(110, 11, r.color, true, vesselProfile, { name: r.name.toUpperCase() });
    // Rivals carry their company colour in the hull stripe and the name on the bow.
    textSprite(r.name.toUpperCase(), 0, 19, 0, 26, r.own ? '#ffe7b0' : '#ffd9cf', m, 0.1);
    return m;
  };
  const meshOf = new Map(sim.rivals.map((r) => [r, vesselMesh(r)]));
  const rivalMeshes = [...meshOf.values()];
  // Movable bridges and lock gates: a coloured barrier that slides away when open.
  const gateMeshes = sim.gates.map((g) => {
    // A rigid barrier between the two warped ends of the gate.
    const grp = new T.Group();
    const along = g.x1 - g.x0 > g.z1 - g.z0,
      xm = (g.x0 + g.x1) / 2,
      zm = (g.z0 + g.z1) / 2,
      sp = along ? span(g.x0, zm, g.x1, zm) : span(xm, g.z0, xm, g.z1);
    const len = sp.length;
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
    grp.position.set(sp.x, 0, sp.z);
    grp.rotation.y = along ? sp.yaw : sp.yaw + Math.PI / 2;
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
    const o = z.obb,
      n = Math.max(2, Math.round((o ? o.hl * 2 : z.x1 - z.x0) / 70));
    for (let i = 0; i < n; i++) {
      const sp = new T.Sprite(lampMat),
        u = ((i + 0.5) / n - 0.5) * 2,
        p = o
          ? { x: o.cx + o.tx * u * o.hl, z: o.cz + o.tz * u * o.hl }
          : toWorld(z.x0 + ((i + 0.5) / n) * (z.x1 - z.x0), (z.z0 + z.z1) / 2);
      sp.position.set(p.x, 11, p.z);
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
  for (const m of [...trafficMeshes, ...rivalMeshes, ...customerMeshes]) mastLight(m);
  // Rain: short streaks in a box that travels with the camera, slanted by the wind.
  const RAIN = quality.light ? 500 : 1400,
    rainPos = new Float32Array(RAIN * 6),
    rainGeo = new T.BufferGeometry();
  for (let i = 0; i < RAIN; i++) {
    rainPos[i * 6] = (Math.random() - 0.5) * 320;
    rainPos[i * 6 + 1] = Math.random() * 140;
    rainPos[i * 6 + 2] = (Math.random() - 0.5) * 320;
  }
  rainGeo.setAttribute('position', new T.BufferAttribute(rainPos, 3));
  const rain = new T.LineSegments(
    rainGeo,
    new T.LineBasicMaterial({ color: '#dfeaf2', transparent: true, opacity: 0.5, fog: false }),
  );
  rain.name = 'rain';
  rain.frustumCulled = false;
  rain.visible = false;
  scene.add(rain);
  let gloom = 0, // 0 clear … 1 squall: greys the sky and dims the sun
    wet = 0,
    lastTime = 0;
  const GLOOM = { helder: 0, bewolkt: 0.45, regen: 0.7, buien: 0.9 },
    grey = new T.Color('#8f9aa3');
  function updateRain(wx, dt) {
    const target = wx.kind === 'buien' ? 1 : wx.kind === 'regen' ? 0.55 : 0;
    wet += (target - wet) * Math.min(1, dt * 0.4);
    rain.visible = wet > 0.02;
    if (!rain.visible) return;
    rain.material.opacity = 0.2 + wet * 0.4;
    rain.geometry.setDrawRange(0, Math.ceil(RAIN * Math.min(1, wet * 1.2)) * 2);
    rain.position.set(camera.position.x, 0, camera.position.z);
    const vx = wx.wind.x * 22,
      vz = wx.wind.z * 22,
      fall = 70;
    for (let i = 0; i < RAIN; i++) {
      const k = i * 6;
      let x = rainPos[k] + vx * dt,
        y = rainPos[k + 1] - fall * dt,
        z = rainPos[k + 2] + vz * dt;
      if (y < 0) {
        y += 140;
        x = (Math.random() - 0.5) * 320;
        z = (Math.random() - 0.5) * 320;
      }
      rainPos[k] = x;
      rainPos[k + 1] = y;
      rainPos[k + 2] = z;
      rainPos[k + 3] = x - vx * 0.06;
      rainPos[k + 4] = y + fall * 0.06;
      rainPos[k + 5] = z - vz * 0.06;
    }
    rain.geometry.getAttribute('position').needsUpdate = true;
  }
  let level = 0;
  const skyCol = new T.Color(),
    tmp = new T.Color();
  // Sky, sun, fog and water follow the harbour clock; the water rises and falls with
  // the tide (±1,2 m against the quay walls). Returns the water level for the ships.
  function updateAmbient(st) {
    const look = skyLook(dayClock(st));
    // Weather greys the day: the same sky, pulled towards slate, the sun turned down.
    const g = gloom * (1 - look.night * 0.6);
    scene.background = skyCol.set(look.sky).lerp(grey, g * 0.85);
    scene.fog.color.set(look.fog).lerp(grey, g * 0.7);
    skyMat.uniforms.top.value.copy(skyCol);
    skyMat.uniforms.low.value.copy(scene.fog.color);
    skyMat.uniforms.glow.value = (1 - look.night) * (1 - gloom);
    sun.color.set(look.sunColor);
    sun.intensity = look.sun * (1 - gloom * 0.6);
    hemi.intensity = look.hemi * (1 - gloom * 0.15);
    renderer.toneMappingExposure = look.exposure;
    waterMat.uniforms.night.value = look.night;
    const lit = Math.max(0, (look.night - 0.2) / 0.8);
    scenery.setNight(lit);
    landmarks.setNight(lit);
    // Linear, like the rest of the shader: colorspace_fragment encodes the result.
    tmp.copy(scene.fog.color);
    waterMat.uniforms.fogCol.value.set(tmp.r, tmp.g, tmp.b);
    waterMat.uniforms.skyTop.value.set(skyCol.r, skyCol.g, skyCol.b);
    lampMat.opacity = mastMat.opacity = Math.max(0, (look.night - 0.25) / 0.75);
    lamps.visible = lampMat.opacity > 0.01;
    level = tideLevel(st.clock, st.tidePhase);
    if (waterMat.userData.mesh) waterMat.userData.mesh.position.y = level;
    for (const m of customerMeshes) m.position.y = level;
    for (const m of stripMeshes) m.position.y = level;
    return level;
  }
  function updateDynamic(world, time) {
    const dt = Math.min(0.1, Math.max(0, time - lastTime)),
      wx = world.events.wx;
    lastTime = time;
    gloom += ((GLOOM[wx.kind] || 0) - gloom) * Math.min(1, dt * 0.25);
    updateRain(wx, dt);
    // Smoke and steam lean with the wind, a light breeze when it is calm.
    landmarks.update(time, { x: 0.3 + wx.wind.x * 1.6, z: 0.1 + wx.wind.z * 1.6 });
    for (const [i, b] of world.traffic.entries()) {
      trafficMeshes[i].position.set(b.wx ?? b.x, level, b.wz ?? b.z);
      trafficMeshes[i].rotation.y = renderYaw(b.wh ?? b.h);
    }
    for (const m of meshOf.values()) m.visible = false;
    for (const [i, r] of world.rivals.entries()) {
      let m = meshOf.get(r);
      if (!m) {
        meshOf.set(r, (m = vesselMesh(r)));
        mastLight(m);
      }
      const sinking = r.mode === 'sunk' ? Math.min(1, r.sinkT / 12) : 0;
      m.position.set(
        r.wx ?? r.x,
        level + Math.sin(time * 1.1 + i) * 0.07 - sinking * 8,
        r.wz ?? r.z,
      );
      m.rotation.set(sinking * 0.3, renderYaw(r.wh ?? r.h), 0);
      m.visible = sinking < 1;
    }
    // A boat that left the list (new career) takes its mesh and name textures with it.
    // Colour materials are shared through primitives' cache; only textured ones are per boat.
    if (meshOf.size > world.rivals.length) {
      const live = new Set(world.rivals);
      for (const [r, m] of meshOf) {
        if (live.has(r)) continue;
        m.removeFromParent();
        m.traverse((o) => {
          o.geometry?.dispose();
          for (const mat of [o.material].flat()) if (mat?.map) (mat.map.dispose(), mat.dispose());
        });
        meshOf.delete(r);
        const i = rivalMeshes.indexOf(m);
        if (i >= 0) rivalMeshes.splice(i, 1);
      }
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
    const fog = world.events.fog > 0 ? 0.0045 : 0.00026 + wet * 0.0007;
    scene.fog.density += (fog - scene.fog.density) * 0.02;
    waterMat.uniforms.fogDensity.value = scene.fog.density;
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
