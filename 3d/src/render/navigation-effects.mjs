import * as T from '../../vendor/three.js';
import { target } from '../game/simulation.mjs';
import { routePoints, customers, terminalOf } from '../game/harbor.mjs';
import { currentAt, tideLevel, nearestQuay } from '../maps/index.mjs';
import { warpedRect, warpedOutline } from './warp-geometry.mjs';
import { driftLines, currentArrow } from '../game/drift.mjs';
import {
  wakePools,
  wakeStrength,
  bowStrength,
  sprayRate,
  propWash,
  thrusterWash,
  kelvinHalfWidth,
  kelvinLength,
  createTrail,
} from '../game/wake.mjs';
// Target zone on the water, route, mooring lines, bunker hose and wake foam.
// A flat strip of the given width along a polyline on the water; u runs with the
// distance (one dash per 22 m), so the dashes keep their size on any route.
export const ROUTE_WIDTH = 6;
export function routeRibbon(points, width = ROUTE_WIDTH, y = 0.95) {
  const pos = [],
    uv = [],
    index = [];
  let run = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[Math.max(0, i - 1)],
      b = points[Math.min(points.length - 1, i + 1)],
      p = points[i];
    let dx = b.x - a.x,
      dz = b.z - a.z;
    const len = Math.hypot(dx, dz) || 1;
    dx /= len;
    dz /= len;
    if (i) run += Math.hypot(p.x - points[i - 1].x, p.z - points[i - 1].z);
    pos.push(p.x - dz * width * 0.5, y, p.z + dx * width * 0.5);
    pos.push(p.x + dz * width * 0.5, y, p.z - dx * width * 0.5);
    uv.push(run / 22, 0, run / 22, 1);
    if (i) index.push(i * 2 - 2, i * 2 - 1, i * 2, i * 2 - 1, i * 2 + 1, i * 2);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(index);
  return g;
}
export function createNavigationEffects(scene, mesh, vesselProfile) {
  // A map rectangle (terminal strip, bunker zone) lying on the water of the warped
  // world: it follows the bend of its quay.
  function zone(color) {
    const m = mesh(
      new T.BufferGeometry(),
      new T.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        side: T.DoubleSide,
      }),
      0,
      0.6,
      0,
    );
    m.castShadow = false;
    const edge = new T.LineLoop(
      new T.BufferGeometry(),
      new T.LineBasicMaterial({ color, transparent: true, opacity: 0.7 }),
    );
    edge.position.y = 0.7;
    scene.add(edge);
    let placed = null;
    const place = (r) => {
      // Warped with the quay, and lifted with the tide.
      m.position.y = 0.6 + waterLevel;
      edge.position.y = 0.7 + waterLevel;
      if (placed === r) return;
      placed = r;
      m.geometry.dispose();
      m.geometry = warpedRect(r, 0);
      edge.geometry.dispose();
      edge.geometry = new T.BufferGeometry().setFromPoints(
        warpedOutline(r).map((p) => new T.Vector3(p.x, 0, p.z)),
      );
    };
    return { m, edge, place, show: (v) => (m.visible = edge.visible = v) };
  }
  const loadZone = zone('#ffe46b'),
    deliverZone = zone('#62e6b0');
  // Beacon over the destination: a light column, a flag and a pulsing ring, so the
  // place you are heading for is the clearest thing in the harbour.
  const beacon = new T.Group();
  const beamMat = new T.MeshBasicMaterial({
    color: '#7dffc4',
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });
  const beamMesh = new T.Mesh(new T.CylinderGeometry(1.6, 3.2, 70, 12, 1, true), beamMat);
  beamMesh.position.y = 35;
  beacon.add(beamMesh);
  const flagMat = new T.MeshBasicMaterial({ color: '#7dffc4', side: T.DoubleSide });
  const flag = new T.Mesh(new T.PlaneGeometry(14, 8), flagMat);
  flag.position.set(7, 66, 0);
  beacon.add(flag);
  const pole = new T.Mesh(
    new T.CylinderGeometry(0.35, 0.35, 70, 6),
    new T.MeshBasicMaterial({ color: '#f2efe2' }),
  );
  pole.position.y = 35;
  beacon.add(pole);
  const ringMat = new T.MeshBasicMaterial({
    color: '#7dffc4',
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    side: T.DoubleSide,
  });
  const ring = new T.Mesh(new T.RingGeometry(16, 19, 48), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.8;
  beacon.add(ring);
  beacon.visible = false;
  scene.add(beacon);
  let pulse = 0;
  // Smoke from a damaged ship: grey puffs from the funnel, heavier as damage grows.
  const smokeTex = (() => {
    if (typeof document === 'undefined' || !document.createElement) return null;
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext?.('2d');
    if (!g?.createRadialGradient) return null;
    const r = g.createRadialGradient(32, 32, 4, 32, 32, 30);
    if (!r) return null;
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 64, 64);
    return new T.CanvasTexture(c);
  })();
  const smoke = [];
  for (let i = 0; i < 28; i++) {
    const sp = new T.Sprite(
      new T.SpriteMaterial({
        map: smokeTex,
        color: '#55585a',
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    sp.visible = false;
    scene.add(sp);
    smoke.push({ sp, life: 0, vx: 0, vz: 0 });
  }
  let smokeIdx = 0,
    smokeTick = 0,
    lastRpm = 0;
  function updateSmoke(s, dt, paused) {
    smokeTick += dt;
    // Exhaust: a light haze whenever the engine works, a puff on every change of
    // load, thick and dark once she is damaged.
    const heavy = Math.max(0, (s.damage - 35) / 65),
      rpm = Math.abs(s.rpm || 0),
      load = Math.min(1, Math.abs(rpm - lastRpm) * 6);
    lastRpm += (rpm - lastRpm) * Math.min(1, dt * 0.8);
    const every = heavy > 0 ? 0.35 - heavy * 0.2 : 0.6 - rpm * 0.3 - load * 0.25;
    if ((heavy > 0 || rpm > 0.05) && !paused && smokeTick > every) {
      smokeTick = 0;
      const p = smoke[smokeIdx++ % smoke.length];
      const back = vesselProfile.length * 0.33;
      p.sp.position.set(s.x - Math.sin(s.h) * back, 16, s.z + Math.cos(s.h) * back);
      p.life = 1;
      p.vx = (Math.random() - 0.5) * 1.5;
      p.vz = (Math.random() - 0.5) * 1.5;
      p.sp.material.color.set(
        heavy > 0.6 ? '#2f3133' : heavy > 0 ? '#6b6e70' : load > 0.4 ? '#5d6062' : '#a9adb0',
      );
      p.k = heavy > 0 ? 1 : 0.35 + load * 0.5 + rpm * 0.15;
      p.sp.visible = true;
    }
    for (const p of smoke) {
      if (p.life <= 0) continue;
      p.life -= dt * 0.22;
      p.sp.position.x += p.vx * dt;
      p.sp.position.z += p.vz * dt;
      p.sp.position.y += dt * 6;
      const sz = (6 + (1 - p.life) * 22) * (0.45 + 0.55 * (p.k ?? 1));
      p.sp.scale.set(sz, sz, 1);
      p.sp.material.opacity = Math.max(0, p.life) * 0.55 * (p.k ?? 1);
      p.sp.visible = p.life > 0;
    }
  }
  const zones = {
    update(s) {
      const t = target(s);
      beacon.visible = !!t && !s.moored && s.phase !== 'bunker';
      if (t) {
        beacon.position.set(t.x, waterLevel, t.z);
        const col = t.kind === 'ship' ? '#7dffc4' : '#ffd84a';
        beamMat.color.set(col);
        flagMat.color.set(col);
        ringMat.color.set(col);
      }
      loadZone.show(s.phase === 'load');
      deliverZone.show(s.phase === 'sail' || s.phase === 'bunker');
      if (s.phase === 'load') loadZone.place(terminalOf(s));
      if (t && t.kind === 'ship') deliverZone.place(t.zone);
    },
  };
  // Route advice: a dashed cyan ribbon on the water, wide enough to read on a phone
  // (a 1-pixel line vanished there). Rebuilt when the route changes.
  const routeTex = (() => {
    const cv = document.createElement('canvas');
    cv.width = 32;
    cv.height = 4;
    const c = cv.getContext('2d');
    if (c) {
      c.fillStyle = '#fff';
      c.fillRect(0, 0, 20, 4);
    }
    const t = new T.CanvasTexture(cv);
    t.wrapS = T.RepeatWrapping;
    return t;
  })();
  const line = new T.Mesh(
    new T.BufferGeometry(),
    new T.MeshBasicMaterial({
      color: '#63f2ff',
      map: routeTex,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      fog: false,
      side: T.DoubleSide,
    }),
  );
  line.renderOrder = 1;
  line.frustumCulled = false;
  scene.add(line);
  const mooring = new T.LineSegments(
    new T.BufferGeometry(),
    new T.LineBasicMaterial({ color: '#dbc696' }),
  );
  scene.add(mooring);
  const hose = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: '#e5b85d' }));
  scene.add(hose);
  const foam = [];
  const foamGeo = new T.PlaneGeometry(1, 1);
  for (let i = 0; i < 64; i++) {
    const m = mesh(
      foamGeo,
      new T.MeshBasicMaterial({
        color: '#c8ded2',
        map: smokeTex, // soft round patches where a canvas is available
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
      0,
      0.7,
      0,
    );
    m.rotation.x = -Math.PI / 2;
    m.castShadow = false;
    m.visible = false;
    foam.push({ m, life: 0 });
  }
  let foamIdx = 0,
    foamTick = 0;
  // Drift lines and current arrow, flat on the water (as in the 2D game): white =
  // where the bow points, dashed yellow = where she really goes, cyan = the stream.
  const flat = (geo, color, map) => {
    const m = new T.Mesh(
      geo,
      new T.MeshBasicMaterial({ color, map, transparent: true, depthWrite: false, fog: false }),
    );
    m.visible = false;
    m.renderOrder = 2;
    scene.add(m);
    return m;
  };
  const ribbonGeo = new T.PlaneGeometry(1, 1);
  ribbonGeo.rotateX(-Math.PI / 2);
  ribbonGeo.translate(0.5, 0, 0);
  const dashTex = (() => {
    const cv = document.createElement('canvas');
    cv.width = 32;
    cv.height = 4;
    const c = cv.getContext('2d');
    if (c) {
      c.fillStyle = '#fff';
      c.fillRect(0, 0, 18, 4);
    }
    const t = new T.CanvasTexture(cv);
    t.wrapS = T.RepeatWrapping;
    return t;
  })();
  const headLine = flat(ribbonGeo, '#ffffff'),
    cogLine = flat(ribbonGeo, '#ffd54a', dashTex);
  const arrowShape = new T.Shape();
  for (const [i, [x, y]] of [
    [-0.5, 0.12],
    [0.18, 0.12],
    [0.18, 0.34],
    [0.5, 0],
    [0.18, -0.34],
    [0.18, -0.12],
    [-0.5, -0.12],
  ].entries())
    arrowShape[i ? 'lineTo' : 'moveTo'](x, y);
  const arrowGeo = new T.ShapeGeometry(arrowShape);
  arrowGeo.rotateX(-Math.PI / 2);
  const arrow = flat(arrowGeo, '#78ebff');
  arrow.material.opacity = 0.85;
  const arrowCv = document.createElement('canvas');
  arrowCv.width = 256;
  arrowCv.height = 64;
  const arrowTex = new T.CanvasTexture(arrowCv),
    arrowLabel = new T.Sprite(
      new T.SpriteMaterial({ map: arrowTex, transparent: true, depthTest: false, fog: false }),
    );
  arrowLabel.visible = false;
  scene.add(arrowLabel);
  let arrowText = '';
  const along = (m, x, z, dx, dz, len, width) => {
    m.position.set(x, 0.95 + waterLevel, z);
    m.rotation.y = Math.atan2(-dz, dx);
    m.scale.set(len, 1, width);
  };
  let streamX = 0,
    streamZ = 0,
    waterLevel = 0;
  function updateDrift(s) {
    const under = !s.moored && s.phase !== 'sunk';
    const dl = under && driftLines(s),
      half = vesselProfile.length / 2,
      sn = Math.sin(s.h),
      cs = Math.cos(s.h);
    headLine.visible = cogLine.visible = !!dl;
    if (dl) {
      along(headLine, s.x + sn * half, s.z - cs * half, sn, -cs, dl.length, 1.4);
      along(cogLine, s.x, s.z, Math.sin(dl.cog), -Math.cos(dl.cog), dl.length + half, 1.7);
      dashTex.repeat.x = (dl.length + half) / 9;
      headLine.material.opacity = cogLine.material.opacity = dl.alpha;
    }
    const cur = under && currentAt(s.x, s.z, s.tideSpeed || 0);
    streamX = cur ? cur.x : 0;
    streamZ = cur ? cur.z : 0;
    const ca = cur && currentArrow(cur);
    arrow.visible = arrowLabel.visible = !!ca;
    if (ca) {
      const ax = s.x + sn * (half + 34),
        az = s.z - cs * (half + 34);
      along(arrow, ax, az, ca.dx, ca.dz, ca.length, ca.length);
      if (ca.text !== arrowText) {
        arrowText = ca.text;
        const c = arrowCv.getContext('2d');
        if (c) {
          c.clearRect(0, 0, 256, 64);
          c.font = 'bold 40px sans-serif';
          c.textAlign = 'center';
          c.lineJoin = 'round';
          c.lineWidth = 8;
          c.strokeStyle = 'rgba(0,20,40,0.8)';
          c.strokeText(arrowText, 128, 46);
          c.fillStyle = '#9ff2ff';
          c.fillText(arrowText, 128, 46);
        }
        arrowTex.needsUpdate = true;
      }
      arrowLabel.position.set(ax, 7 + waterLevel, az);
      arrowLabel.scale.set(30, 7.5, 1);
    }
  }
  // --- Bow wave, spray, prop wash, thruster wash and Kelvin wake (engine.js
  // particlesTick, drawBowWave, drawKelvin, drawTrailWake). Numbers: game/wake.mjs.
  // Everything lives in three draw calls with fixed buffers: one ribbon mesh (wake
  // band, the two V arms, the bow collar), one quad mesh (wash) and instanced puffs.
  const POOL = wakePools(false),
    POOL_LIGHT = wakePools(true);
  const TRAIL_N = POOL.trail,
    COLLAR_N = 8,
    RIB_PTS = TRAIL_N * 3 + COLLAR_N * 2;
  const trail = createTrail(TRAIL_N, POOL.spacing);
  const ribPos = new Float32Array(RIB_PTS * 9),
    ribCol = new Float32Array(RIB_PTS * 12).fill(1),
    ribIdx = [];
  for (const [from, n] of [
    [0, TRAIL_N],
    [TRAIL_N, TRAIL_N],
    [TRAIL_N * 2, TRAIL_N],
    [TRAIL_N * 3, COLLAR_N],
    [TRAIL_N * 3 + COLLAR_N, COLLAR_N],
  ])
    for (let i = from; i < from + n - 1; i++) {
      const a = i * 3,
        b = a + 3;
      ribIdx.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2);
    }
  const dynamic = (arr, size) => {
    const at = new T.BufferAttribute(arr, size);
    at.setUsage(T.DynamicDrawUsage);
    return at;
  };
  const waterFx = (geo, map) => {
    const m = new T.Mesh(
      geo,
      new T.MeshBasicMaterial({
        color: '#f4fbf8',
        map,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        side: T.DoubleSide,
      }),
    );
    m.frustumCulled = false; // follows the ship; saves recomputing bounds every frame
    m.visible = false;
    m.renderOrder = 1;
    scene.add(m);
    return m;
  };
  const ribGeo = new T.BufferGeometry();
  ribGeo.setAttribute('position', dynamic(ribPos, 3));
  ribGeo.setAttribute('color', dynamic(ribCol, 4));
  ribGeo.setIndex(ribIdx);
  const ribbons = waterFx(ribGeo, null);
  // One cross-section of a ribbon: edge, centre, edge. Alpha fades to the edges.
  function rib(pi, x, z, nx, nz, hw, y, aC, aE) {
    let o = pi * 9;
    ribPos[o] = x - nx * hw;
    ribPos[o + 1] = y;
    ribPos[o + 2] = z - nz * hw;
    ribPos[o + 3] = x;
    ribPos[o + 4] = y;
    ribPos[o + 5] = z;
    ribPos[o + 6] = x + nx * hw;
    ribPos[o + 7] = y;
    ribPos[o + 8] = z + nz * hw;
    o = pi * 12 + 3;
    ribCol[o] = aE;
    ribCol[o + 4] = aC;
    ribCol[o + 8] = aE;
  }
  const trX = new Float32Array(TRAIL_N),
    trZ = new Float32Array(TRAIL_N),
    trD = new Float32Array(TRAIL_N);
  // Wash: flat round foam patches that spread and fade.
  const WASH_N = POOL.wash;
  const wash = {
    x: new Float32Array(WASH_N),
    z: new Float32Array(WASH_N),
    vx: new Float32Array(WASH_N),
    vz: new Float32Array(WASH_N),
    life: new Float32Array(WASH_N),
    max: new Float32Array(WASH_N),
    size: new Float32Array(WASH_N),
    alpha: new Float32Array(WASH_N),
  };
  const washPos = new Float32Array(WASH_N * 12),
    washCol = new Float32Array(WASH_N * 16).fill(1),
    washUv = new Float32Array(WASH_N * 8),
    washIdx = [];
  for (let i = 0; i < WASH_N; i++) {
    washUv.set([0, 0, 1, 0, 1, 1, 0, 1], i * 8);
    washIdx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
  }
  const washGeo = new T.BufferGeometry();
  washGeo.setAttribute('position', dynamic(washPos, 3));
  washGeo.setAttribute('color', dynamic(washCol, 4));
  washGeo.setAttribute('uv', new T.BufferAttribute(washUv, 2));
  washGeo.setIndex(washIdx);
  const washMesh = waterFx(washGeo, smokeTex);
  let washNext = 0,
    washAlive = 0;
  function spawnWash(limit, x, z, vx, vz, life, size, alpha) {
    const i = washNext++ % limit;
    wash.x[i] = x;
    wash.z[i] = z;
    wash.vx[i] = vx;
    wash.vz[i] = vz;
    wash.life[i] = wash.max[i] = life;
    wash.size[i] = size;
    wash.alpha[i] = alpha;
  }
  // Spray: small white puffs thrown out of the bow shoulders in a low arc.
  const SPRAY_N = POOL.spray;
  const spray = {
    x: new Float32Array(SPRAY_N),
    y: new Float32Array(SPRAY_N),
    z: new Float32Array(SPRAY_N),
    vx: new Float32Array(SPRAY_N),
    vy: new Float32Array(SPRAY_N),
    vz: new Float32Array(SPRAY_N),
    life: new Float32Array(SPRAY_N),
    max: new Float32Array(SPRAY_N),
    size: new Float32Array(SPRAY_N),
  };
  const sprayMesh = new T.InstancedMesh(
    new T.IcosahedronGeometry(1, 0),
    new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85 }),
    SPRAY_N,
  );
  sprayMesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
  sprayMesh.frustumCulled = false;
  sprayMesh.visible = false;
  scene.add(sprayMesh);
  const sprayM = new T.Matrix4();
  let sprayNext = 0,
    sprayAlive = 0,
    sprayAcc = 0,
    washAcc = 0,
    jetAcc = 0,
    waterT = 0,
    waterOn = false;
  function writeWash(dt) {
    let alive = 0;
    const drag = Math.exp(-2.6 * dt);
    for (let i = 0; i < WASH_N; i++) {
      const o = i * 12,
        c = i * 16 + 3;
      let a = 0,
        h = 0;
      if (wash.life[i] > 0) {
        wash.life[i] -= dt;
        wash.x[i] += wash.vx[i] * dt;
        wash.z[i] += wash.vz[i] * dt;
        wash.vx[i] *= drag;
        wash.vz[i] *= drag;
        const k = Math.max(0, wash.life[i] / wash.max[i]);
        // Quick fade in, slow fade out, spreading as it ages.
        a = wash.alpha[i] * Math.min(1, (1 - k) * 8) * k;
        h = wash.size[i] * (0.6 + (1 - k) * 1.3);
        alive++;
      }
      const x = wash.x[i],
        z = wash.z[i];
      washPos[o] = washPos[o + 9] = x - h;
      washPos[o + 3] = washPos[o + 6] = x + h;
      washPos[o + 2] = washPos[o + 5] = z - h;
      washPos[o + 8] = washPos[o + 11] = z + h;
      washPos[o + 1] = washPos[o + 4] = washPos[o + 7] = washPos[o + 10] = 0.82;
      washCol[c] = washCol[c + 4] = washCol[c + 8] = washCol[c + 12] = a;
    }
    if (alive || washAlive) {
      washGeo.attributes.position.needsUpdate = true;
      washGeo.attributes.color.needsUpdate = true;
    }
    washAlive = alive;
  }
  function writeSpray(dt) {
    let alive = 0;
    if (!sprayAlive) return;
    for (let i = 0; i < SPRAY_N; i++) {
      let r = 0;
      if (spray.life[i] > 0) {
        spray.life[i] -= dt;
        spray.vy[i] -= 9 * dt;
        spray.x[i] += spray.vx[i] * dt;
        spray.y[i] += spray.vy[i] * dt;
        spray.z[i] += spray.vz[i] * dt;
        if (spray.y[i] < 0.3) spray.life[i] = 0;
        r = spray.size[i] * Math.max(0, spray.life[i] / spray.max[i]) ** 0.6;
        alive++;
      }
      sprayM.makeScale(r, r, r).setPosition(spray.x[i], spray.y[i], spray.z[i]);
      sprayMesh.setMatrixAt(i, sprayM);
    }
    sprayMesh.instanceMatrix.needsUpdate = true;
    sprayAlive = alive;
  }
  function resetWater() {
    trail.clear();
    wash.life.fill(0);
    spray.life.fill(0);
    for (let i = 3; i < ribCol.length; i += 4) ribCol[i] = 0;
    ribGeo.attributes.color.needsUpdate = true;
    washAlive = sprayAlive = 1;
    sprayAcc = washAcc = jetAcc = 0;
    writeWash(0);
    writeSpray(0);
  }
  function updateWater(s, dt, quality, paused, bowInput) {
    const on = !s.moored && s.phase !== 'sunk';
    if (on !== waterOn) {
      waterOn = on;
      resetWater();
      ribbons.visible = washMesh.visible = sprayMesh.visible = on;
    }
    if (!on || paused) return;
    waterT += dt;
    const light = !!quality?.light,
      pool = light ? POOL_LIGHT : POOL,
      L = vesselProfile.length,
      B = vesselProfile.beam,
      sn = Math.sin(s.h),
      cs = Math.cos(s.h),
      // Speed through the water: the stream carries ship and wake alike.
      uw = s.u - (streamX * sn - streamZ * cs),
      // Velocity over the ground, for what is thrown off the hull.
      gx = sn * s.u + cs * s.v,
      gz = -cs * s.u + sn * s.v;
    ribbons.position.y = washMesh.position.y = sprayMesh.position.y = waterLevel;
    // Kelvin arms and trailing band along the track the stern has really sailed.
    const k = wakeStrength(uw),
      sx = s.x - sn * L * 0.5,
      sz = s.z + cs * L * 0.5;
    trail.spacing = pool.spacing;
    if (k > 0) trail.push(sx, sz);
    else trail.clear();
    const n = Math.min(trail.count, pool.trail - 1) + 1;
    trX[0] = sx;
    trZ[0] = sz;
    trD[0] = 0;
    for (let j = 1; j < n; j++) {
      trX[j] = trail.x(j - 1);
      trZ[j] = trail.z(j - 1);
      trD[j] = trD[j - 1] + Math.hypot(trX[j] - trX[j - 1], trZ[j] - trZ[j - 1]);
    }
    const reach = Math.min(kelvinLength(L, k), trD[n - 1]);
    let tx = sn,
      tz = -cs;
    for (let j = 0; j < TRAIL_N; j++) {
      const q = Math.min(j, n - 1),
        d = trD[q],
        f = j < n && reach > 1 ? Math.max(0, 1 - d / reach) : 0;
      if (j < n) {
        const a = Math.max(q - 1, 0),
          b = Math.min(q + 1, n - 1),
          dx = trX[a] - trX[b],
          dz = trZ[a] - trZ[b],
          dl = Math.hypot(dx, dz);
        if (dl > 0.5) {
          tx = dx / dl;
          tz = dz / dl;
        }
      }
      const nx = -tz,
        nz = tx,
        x = trX[q],
        z = trZ[q],
        off = kelvinHalfWidth(d, B),
        armA = 0.62 * k * f * (0.72 + 0.28 * Math.sin(d * 0.4 + waterT * 2.2)),
        armW = 0.7 + (1 - f) * 2.2;
      rib(j, x, z, nx, nz, B * (0.4 + (1 - f) * 1.1), 0.76, (0.1 + 0.26 * k) * f, 0);
      rib(TRAIL_N + j, x - nx * off, z - nz * off, nx, nz, armW, 0.8, armA, armA * 0.25);
      rib(TRAIL_N * 2 + j, x + nx * off, z + nz * off, nx, nz, armW, 0.8, armA, armA * 0.25);
    }
    // Bow collar: a foam ribbon from the stem back along each shoulder.
    const bk = bowStrength(uw),
      shown = Math.min(1, bk * 5);
    for (let side = -1, base = TRAIL_N * 3; side <= 1; side += 2, base += COLLAR_N) {
      const f0 = L * 0.5 + 1.2,
        f1 = L * 0.5 - 5,
        f2 = L * 0.5 - 13 - 15 * bk,
        d0 = side * 0.2,
        d1 = side * (B * 0.5 + 1.2),
        d2 = side * (B * 0.5 + 2.6 + 6 * bk);
      for (let i = 0; i < COLLAR_N; i++) {
        const t = i / (COLLAR_N - 1),
          m = 1 - t,
          f = m * m * f0 + 2 * m * t * f1 + t * t * f2,
          d = m * m * d0 + 2 * m * t * d1 + t * t * d2,
          df = m * (f1 - f0) + t * (f2 - f1),
          dd = m * (d1 - d0) + t * (d2 - d1),
          wx = sn * df + cs * dd,
          wz = -cs * df + sn * dd,
          wl = Math.hypot(wx, wz) || 1,
          a = (0.5 + 0.4 * bk) * shown * (1 - t) ** 0.7;
        rib(
          base + i,
          s.x + sn * f + cs * d,
          s.z - cs * f + sn * d,
          -wz / wl,
          wx / wl,
          (0.5 + 1.5 * bk) * (0.45 + 0.55 * Math.sin(Math.PI * Math.min(1, t * 1.4))),
          0.86,
          a,
          a * 0.45,
        );
      }
    }
    ribGeo.attributes.position.needsUpdate = true;
    ribGeo.attributes.color.needsUpdate = true;
    // Spray from both bow shoulders.
    sprayAcc = Math.min(4, sprayAcc + sprayRate(uw, light) * dt * 2);
    for (; sprayAcc >= 1; sprayAcc--) {
      const i = sprayNext++ % SPRAY_N,
        side = i & 1 ? 1 : -1,
        out = side * (3 + uw * 0.8 + Math.random() * 2.5),
        fo = L * (0.47 - Math.random() * 0.07),
        so = side * B * (0.25 + Math.random() * 0.2);
      spray.x[i] = s.x + sn * fo + cs * so;
      spray.y[i] = 0.9;
      spray.z[i] = s.z - cs * fo + sn * so;
      spray.vx[i] = gx * 0.55 + cs * out + (Math.random() - 0.5);
      spray.vy[i] = 3 + Math.random() * 2.5 + bk * 2;
      spray.vz[i] = gz * 0.55 + sn * out + (Math.random() - 0.5);
      spray.life[i] = spray.max[i] = 0.7 + Math.random() * 0.5;
      spray.size[i] = B * (0.055 + Math.random() * 0.05 + bk * 0.035);
      sprayAlive++;
    }
    // Prop wash behind the stern: follows engine power, also at a standstill.
    const pw = propWash(s.rpm, light);
    washAcc = Math.min(4, washAcc + pw.rate * dt);
    for (; washAcc >= 1; washAcc--) {
      const lat = (Math.random() - 0.5) * B * (pw.dir > 0 ? 1.5 : 0.6),
        back = L * 0.5 + (pw.dir > 0 ? -1 : 1.5),
        sp = pw.dir * pw.speed * (0.6 + Math.random() * 0.6),
        ls = (Math.random() - 0.5) * 3 + (pw.dir > 0 ? Math.sign(lat) * 2.5 : 0);
      spawnWash(
        pool.wash,
        s.x - sn * back + cs * lat,
        s.z + cs * back + sn * lat,
        gx * 0.3 + sn * sp + cs * ls,
        gz * 0.3 - cs * sp + sn * ls,
        1.3 + Math.random() * 0.9,
        2 + pw.strength * 2.6,
        0.45 + pw.strength * 0.4,
      );
    }
    // Bow thruster: a short jet of foam out of the side opposite to the push.
    const jet = thrusterWash(s.blackout > 0 ? 0 : bowInput, light);
    jetAcc = Math.min(4, jetAcc + jet.rate * dt);
    for (; jetAcc >= 1; jetAcc--) {
      const fo = L * 0.38 + (Math.random() - 0.5) * 2,
        so = jet.side * B * 0.5,
        sp = jet.side * jet.speed * (0.7 + Math.random() * 0.6),
        fs = (Math.random() - 0.5) * 2;
      spawnWash(
        pool.wash,
        s.x + sn * fo + cs * so,
        s.z - cs * fo + sn * so,
        gx * 0.3 + cs * sp + sn * fs,
        gz * 0.3 + sn * sp - cs * fs,
        0.8 + Math.random() * 0.4,
        1.9,
        0.85,
      );
    }
    writeWash(dt);
    writeSpray(dt);
  }
  function updateWake(s, dt, quality, paused, bow = 0) {
    pulse += dt;
    if (beacon.visible) {
      const k = (pulse % 1.6) / 1.6;
      ring.scale.setScalar(0.6 + k * 1.2);
      ringMat.opacity = 0.7 * (1 - k);
      flag.rotation.y = Math.sin(pulse * 3) * 0.25;
      // Keep the beacon readable from far away without dominating close up.
      beamMat.opacity = 0.18 + 0.12 * Math.sin(pulse * 2.5) ** 2;
    }
    updateSmoke(s, dt, paused);
    updateDrift(s);
    waterLevel = tideLevel(s.clock || 0, s.tidePhase || 0);
    updateWater(s, dt, quality, paused, bow);
    foamTick += dt;
    const power = Math.abs(s.rpm || 0);
    if ((Math.abs(s.u) > 0.25 || power > 0.12) && foamTick > 0.08 && !paused && !s.moored) {
      foamTick = 0;
      const f = foam[foamIdx++ % quality.foamCount];
      f.life = 1;
      f.m.visible = true;
      f.m.position.set(
        s.x - Math.sin(s.h) * (vesselProfile.length / 2 + 1) + (Math.random() - 0.5) * 3,
        waterLevel + 0.75,
        s.z + Math.cos(s.h) * (vesselProfile.length / 2 + 1) + (Math.random() - 0.5) * 3,
      );
      f.m.rotation.z = -s.h;
      f.m.scale.set(3 + power * 4, 2 + power * 2, 1);
    }
    for (const f of foam) {
      if (f.life > 0) {
        f.life -= dt * 0.13;
        f.m.material.opacity = Math.max(0, f.life) * 0.35;
        f.m.scale.x += dt * 1.2;
        f.m.scale.y += dt * 0.7;
        f.m.visible = f.life > 0;
      }
    }
  }
  // Nearest point on a quay or the seagoing ship for each mooring line.
  function anchor(p, s) {
    const b = s.mooredTo?.kind === 'ship' && customers.find((b) => b.id === s.mooredTo.id);
    if (!b) return nearestQuay(p.x, p.z) || p;
    // The ship's rail: the nearest point of its rigid hull (26 m wide) in the world.
    const tx = Math.sin(b.h),
      tz = -Math.cos(b.h),
      along = (p.x - b.shipX) * tx + (p.z - b.shipZ) * tz,
      across = -(p.x - b.shipX) * tz + (p.z - b.shipZ) * tx,
      a = Math.max(-b.length / 2, Math.min(b.length / 2, along)),
      c = Math.max(-13, Math.min(13, across));
    return { x: b.shipX + tx * a - tz * c, z: b.shipZ + tz * a + tx * c };
  }
  function updateRoute(s) {
    const t = target(s);
    mooring.visible = s.moored;
    hose.visible = !!s.pumping;
    const pts = [];
    let hoseEnd = null;
    if (s.moored || s.pumping) {
      for (const f of [-0.42, 0.42]) {
        const p = {
          x: s.x + Math.sin(s.h) * vesselProfile.length * f,
          z: s.z - Math.cos(s.h) * vesselProfile.length * f,
        };
        const a = anchor(p, s);
        pts.push(
          new T.Vector3(p.x, 3, p.z),
          new T.Vector3(a.x, s.mooredTo?.kind === 'ship' ? 7 : 4.5, a.z),
        );
      }
      hoseEnd = anchor(
        { x: s.x, z: s.z },
        s.mooredTo
          ? s
          : {
              ...s,
              mooredTo:
                s.phase === 'bunker'
                  ? { kind: 'ship', id: s.job && customers[s.job.berth].id }
                  : null,
            },
      );
    }
    if (s.moored) {
      mooring.geometry.dispose();
      mooring.geometry = new T.BufferGeometry().setFromPoints(pts);
    }
    if (s.pumping && hoseEnd) {
      hose.geometry.dispose();
      hose.geometry = new T.BufferGeometry().setFromPoints([
        new T.Vector3(s.x, 3, s.z),
        new T.Vector3((s.x + hoseEnd.x) / 2, 1.6, (s.z + hoseEnd.z) / 2),
        new T.Vector3(hoseEnd.x, 5, hoseEnd.z),
      ]);
    }
    line.visible = !!t && !s.moored;
    if (line.visible) {
      line.geometry.dispose();
      line.geometry = routeRibbon(routePoints(s, t), ROUTE_WIDTH);
      line.position.y = waterLevel; // the tide lifts the water up to 1,2 m: stay on top of it
    }
  }
  return { zones, updateWake, updateRoute };
}
