import * as T from '../../vendor/three.js';
import { land, shoreSegments, basins, basinBoundsAt } from '../maps/amsterdam.mjs';
import { GeometryBatch } from './scene-batch.mjs';

const C = {
  grass: '#91aa70',
  grassDark: '#789565',
  concrete: '#d4cbb2',
  asphalt: '#6c7c7a',
  stripe: '#f5df9b',
  steel: '#476b71',
  dark: '#344c53',
  cream: '#f2e6c9',
  roof: '#bf7555',
  blue: '#649aab',
  gold: '#e6ae54',
  leaf: '#60996d',
  leafLight: '#82ad70',
  trunk: '#8a7151',
  glass: '#427785',
  red: '#ca7860',
};
const palette = [C.blue, C.red, C.gold, '#7d9a83', '#e1d5b3'];
const boxGeo = new T.BoxGeometry(1, 1, 1),
  roundGeo = new T.CylinderGeometry(1, 1, 1, 12),
  coneGeo = new T.ConeGeometry(1, 1, 12),
  leafGeo = new T.IcosahedronGeometry(1, 0);
// A unit pitched roof, ridge along Z. Solid geometry, no textures or downloads.
const roofShape = new T.Shape();
roofShape.moveTo(-0.5, 0);
roofShape.lineTo(0.5, 0);
roofShape.lineTo(0, 1);
roofShape.closePath();
const roofGeo = new T.ExtrudeGeometry(roofShape, { depth: 1, bevelEnabled: false, steps: 1 });
roofGeo.translate(0, 0, -0.5);
export function landContains(x, z, w = 0, d = 0) {
  return land.some(
    (l) => x - w / 2 >= l.x0 && x + w / 2 <= l.x1 && z - d / 2 >= l.z0 && z + d / 2 <= l.z1,
  );
}
export function truckPose(route, time) {
  // A continuous stadium-shaped service road. The bends really turn the truck;
  // no teleport or reversing at the end of a straight.
  const r = route.radius,
    straight = route.length,
    total = 2 * straight + 2 * Math.PI * r;
  let p = (((time * route.speed + route.offset) % total) + total) % total,
    x,
    z,
    dx,
    dz;
  if (p < straight) {
    x = r;
    z = -straight / 2 + p;
    dx = 0;
    dz = 1;
  } else if ((p -= straight) < Math.PI * r) {
    const a = p / r;
    x = r * Math.cos(a);
    z = straight / 2 + r * Math.sin(a);
    dx = -Math.sin(a);
    dz = Math.cos(a);
  } else if ((p -= Math.PI * r) < straight) {
    x = -r;
    z = straight / 2 - p;
    dx = 0;
    dz = -1;
  } else {
    p -= straight;
    const a = p / r;
    x = -r * Math.cos(a);
    z = -straight / 2 - r * Math.sin(a);
    dx = Math.sin(a);
    dz = -Math.cos(a);
  }
  return { x: route.x + x, z: route.z + z, h: Math.atan2(-dx, -dz) };
}

export function createHarborScenery(scene) {
  const root = new T.Group();
  root.name = 'Westpoort scenery';
  scene.add(root);
  const material = new T.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
  const tiles = new Map(),
    dummy = new T.Object3D(),
    stats = { parcels: 0, parts: 0, triangles: 0, draws: 0 },
    footprints = [],
    routes = [];
  let seed = 8511;
  const rnd = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const tileFor = (x, z, detail) => {
    const tx = Math.floor(x / 320),
      tz = Math.floor(z / 320),
      key = tx + ':' + tz + ':' + detail;
    if (!tiles.has(key))
      tiles.set(key, {
        batch: new GeometryBatch(),
        x: (tx + 0.5) * 320,
        z: (tz + 0.5) * 320,
        detail,
      });
    return tiles.get(key).batch;
  };
  function shape(g, c, x, y, z, sx, sy, sz, rot = 0, detail = false) {
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, rot, 0);
    dummy.scale.set(sx, sy, sz);
    dummy.updateMatrix();
    tileFor(x, z, detail).add(g, dummy.matrix, c);
    stats.parts++;
  }
  const box = (w, h, d, c, x, y, z, rot = 0, detail = false) =>
    shape(boxGeo, c, x, y, z, w, h, d, rot, detail);
  const cylinder = (r, h, c, x, y, z, detail = false) =>
    shape(roundGeo, c, x, y, z, r, h, r, 0, detail);
  function beam(a, b, r, c, detail = false) {
    const start = new T.Vector3(...a),
      end = new T.Vector3(...b),
      delta = end.clone().sub(start);
    dummy.position.copy(start).add(end).multiplyScalar(0.5);
    dummy.scale.set(r, delta.length(), r);
    dummy.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
    dummy.updateMatrix();
    tileFor(dummy.position.x, dummy.position.z, detail).add(roundGeo, dummy.matrix, c);
    stats.parts++;
  }
  function tree(x, z, size = 1) {
    cylinder(0.65 * size, 5 * size, C.trunk, x, 4 + 2.5 * size, z);
    shape(
      leafGeo,
      rnd() > 0.5 ? C.leaf : C.leafLight,
      x,
      4 + 7.2 * size,
      z,
      4.7 * size,
      6 * size,
      4.5 * size,
    );
    shape(
      leafGeo,
      C.leafLight,
      x + 2 * size,
      4 + 8 * size,
      z - 1,
      3 * size,
      3.4 * size,
      3 * size,
      0,
      true,
    );
  }
  function house(x, z, color, wide = 12) {
    box(wide, 9, 15, color, x, 8.5, z);
    shape(roofGeo, C.roof, x, 13, z, wide + 1.6, 5, 17);
    box(wide + 1, 0.5, 16, C.cream, x, 12.7, z, 0, true);
    box(1.4, 4, 1.8, C.cream, x + wide * 0.28, 16, z + 3, 0, true);
    for (const side of [-1, 1])
      for (const dx of [-wide * 0.27, wide * 0.27]) {
        box(2.6, 3, 0.25, C.cream, x + dx, 10, z + side * 7.6, 0, true);
        box(1.9, 2.4, 0.3, C.glass, x + dx, 10, z + side * 7.75, 0, true);
      }
    box(2.2, 4, 0.3, C.cream, x, 6, z + 7.6, 0, true);
  }
  function warehouse(x, z, color) {
    box(65, 0.25, 66, C.concrete, x, 4.15, z);
    box(55, 16, 37, color, x, 12, z);
    shape(roofGeo, C.steel, x, 20, z, 57, 7, 40);
    for (const side of [-1, 1]) {
      for (const dx of [-17, 0, 17]) {
        box(12, 9, 0.3, C.dark, x + dx, 8.5, z + side * 18.6, 0, true);
        box(11, 0.8, 0.5, C.gold, x + dx, 13.5, z + side * 18.8, 0, true);
      }
      box(53, 2, 0.3, C.glass, x, 17.5, z + side * 18.6, 0, true);
    }
    for (const dx of [-18, 0, 18]) box(9, 0.3, 5, C.glass, x + dx, 24.3, z + 9, -0.0, true);
    for (const dx of [-28, 28]) cylinder(0.55, 2, C.gold, x + dx, 5.2, z + 23, true);
    box(14, 6, 8, C.cream, x + 18, 7, z + 26);
    box(12, 2, 0.2, C.glass, x + 18, 8, z + 30.1, 0, true);
  }
  function tankFarm(x, z) {
    box(72, 0.4, 74, C.concrete, x, 4.2, z);
    for (const dx of [-35, 35]) box(1.4, 1.7, 74, C.cream, x + dx, 5, z, 0, true);
    for (const dz of [-36, 36]) box(72, 1.7, 1.4, C.cream, x, 5, z + dz, 0, true);
    for (const dx of [-17, 17])
      for (const dz of [-18, 18]) {
        const h = 16 + (dx > 0 ? 6 : 0);
        cylinder(12, h, '#dedbc3', x + dx, 4 + h / 2, z + dz);
        cylinder(12.5, 1, C.cream, x + dx, 4 + h, z + dz);
        cylinder(12.06, 1.4, C.blue, x + dx, 4 + h * 0.65, z + dz, true);
        shape(coneGeo, C.cream, x + dx, 5 + h, z + dz, 12, 2, 12);
        box(0.8, h, 0.8, C.steel, x + dx + 12.2, 4 + h / 2, z + dz, 0, true);
      }
    beam([x - 33, 6, z + 31], [x + 33, 6, z + 31], 0.6, C.gold, true);
    beam([x, 6, z - 32], [x, 6, z + 31], 0.5, C.gold, true);
  }
  function containerYard(x, z) {
    box(80, 0.2, 79, C.concrete, x, 4.12, z);
    for (let row = 0; row < 4; row++)
      for (let col = 0; col < 5; col++) {
        const cx = x - 29 + col * 14,
          cz = z - 28 + row * 17,
          levels = 1 + Math.floor(rnd() * 3),
          color = palette[Math.floor(rnd() * palette.length)];
        for (let k = 0; k < levels; k++) {
          const y = 5.55 + k * 3.05;
          box(12.2, 3, 6, color, cx, y, cz);
          box(12.3, 0.15, 6.1, C.cream, cx, y + 1.4, cz, 0, true);
          for (const dx of [-4, -2, 0, 2, 4])
            box(0.12, 2.7, 0.12, C.steel, cx + dx, y, cz - 3.03, 0, true);
        }
      }
  }
  // Smaller, deliberate neighbourhoods leave clear roads and green courtyards.
  const occupied = new Set();
  for (const l of land) {
    const north = l.kind === 'north' || l.kind === 'park',
      spacing = north ? 100 : 110;
    const x0 = Math.max(-2480, l.x0),
      x1 = Math.min(2480, l.x1),
      z0 = Math.max(-1200, l.z0),
      z1 = Math.min(1200, l.z1);
    for (let x = x0 + 65; x < x1 - 45; x += spacing)
      for (let z = z0 + 65; z < z1 - 45; z += spacing) {
        const key = Math.round(x / 80) + ':' + Math.round(z / 80);
        if (occupied.has(key) || !landContains(x, z, 90, 90)) continue;
        occupied.add(key);
        stats.parcels++;
        footprints.push({ x, z, width: 90, depth: 90, kind: l.kind });
        if (north) {
          box(88, 0.15, 85, rnd() > 0.5 ? C.grass : C.grassDark, x, 4.1, z);
          box(84, 0.18, 5, C.concrete, x, 4.21, z + 27);
          if (rnd() > 0.25) {
            house(x - 19, z - 7, ['#75a292', '#e1c393', '#b9bba4'][Math.floor(rnd() * 3)]);
            house(x + 17, z + 2, C.cream, 14);
          }
          for (const [dx, dz] of [
            [-31, 30],
            [30, -25],
            [0, -32],
          ])
            tree(x + dx, z + dz, 0.85 + rnd() * 0.35);
        } else if (l.kind === 'tanks') {
          tankFarm(x, z);
        } else if (l.kind === 'containers') {
          if (rnd() < 0.55) containerYard(x, z);
          else warehouse(x, z, rnd() > 0.5 ? C.blue : '#c3bda4');
        } else {
          house(x - 20, z - 12, C.cream, 18);
          house(x + 18, z - 12, C.red, 16);
          house(x, z + 22, C.blue, 18);
          tree(x + 32, z + 28, 1.2);
        }
      }
  }
  // Quays have real edge treatment, fenders, bollards, service roads and lamps.
  for (const [i, p] of shoreSegments.entries()) {
    const landX = p.x - p.nx * 3,
      landZ = p.z - p.nz * 3,
      industrial = p.z > 0;
    box(p.width, 6, p.depth, '#557579', p.x, 1, p.z);
    box(p.width, 0.45, p.depth, C.concrete, p.x, 4.15, p.z);
    if (i % 2 === 0) {
      cylinder(0.65, 1.1, C.gold, landX, 4.8, landZ, true);
      box(2.1, 0.4, 1.1, C.dark, landX, 5.35, landZ, 0, true);
    }
    if (i % 2 === 1) {
      box(
        p.nx ? 1.2 : 3,
        2.5,
        p.nx ? 3 : 1.2,
        C.dark,
        p.x + p.nx * 0.9,
        1.4,
        p.z + p.nz * 0.9,
        0,
        true,
      );
    }
    if (industrial) {
      const rx = p.x - p.nx * 22,
        rz = p.z - p.nz * 22,
        w = p.nx ? 13 : p.width,
        d = p.nz ? 13 : p.depth;
      if (landContains(rx, rz, w, d)) {
        box(w, 0.15, d, C.asphalt, rx, 4.18, rz);
        box(p.nx ? 0.25 : 5, 0.06, p.nz ? 0.25 : 5, C.stripe, rx, 4.3, rz, 0, true);
      }
      if (i % 4 === 0 && landContains(landX - p.nx * 5, landZ - p.nz * 5, 4, 4)) {
        cylinder(0.3, 12, C.steel, landX - p.nx * 5, 10, landZ - p.nz * 5, true);
        box(
          p.nx ? 4 : 1.2,
          0.4,
          p.nz ? 4 : 1.2,
          C.cream,
          landX - p.nx * 3,
          16,
          landZ - p.nz * 3,
          0,
          true,
        );
      }
    } else if (i % 3 === 0 && landContains(p.x - p.nx * 12, p.z - p.nz * 12, 10, 10))
      tree(p.x - p.nx * 12, p.z - p.nz * 12, 1.2);
  }
  // Portal cranes: heavy feet on the quay; overhead booms leave navigation free.
  const cranes = [];
  for (const b of basins.filter((b) => b.z0 > 0).slice(0, 5))
    for (const side of [-1, 1]) {
      const z = b.z0 + 190,
        edges = basinBoundsAt(b, z),
        x = side < 0 ? edges.x0 - 9 : edges.x1 + 9;
      if (!landContains(x, z, 12, 24)) continue;
      for (const dz of [-9, 9]) {
        box(8, 2, 4, C.steel, x, 5, z + dz);
        beam([x, 6, z + dz], [x, 31, z + dz * 0.55], 0.85, C.gold);
      }
      box(10, 3, 17, C.gold, x, 31, z);
      const tip = x - side * 30;
      beam([x, 33, z], [tip, 44, z], 1.1, C.gold);
      beam([x, 40, z], [tip, 44, z], 0.3, C.steel, true);
      beam([x, 33, z], [x, 43, z], 0.8, C.gold);
      box(5, 5, 5, C.cream, x - side * 3, 35, z + 6);
      box(5.1, 2, 5.1, C.glass, x - side * 3, 36, z + 6, 0, true);
      cranes.push({ x: tip, z, phase: rnd() * 6 });
    }
  // Hemweg's distinctive twin stacks and low turbine hall.
  warehouse(710, 850, C.cream);
  for (const [x, h] of [
    [680, 120],
    [740, 100],
  ]) {
    cylinder(5, h, '#d9d7bd', x, 4 + h / 2, 760);
    for (let y = h - 28; y < h; y += 14) cylinder(5.05, 7, C.red, x, 4 + y, 760);
  }
  // Service traffic only on land. The entire swept road corridor is checked.
  for (const l of land.filter((l) => l.z0 === 140 && l.x1 - l.x0 > 190))
    for (const x of [l.x0 + 23, l.x1 - 23]) {
      const route = {
        x,
        z: 480,
        length: 340,
        radius: 5,
        speed: 5 + rnd() * 2,
        offset: rnd() * 700,
      };
      if (landContains(route.x, route.z, 28, route.length + 30)) {
        routes.push(route);
        box(24, 0.16, route.length + 28, C.asphalt, route.x, 4.2, route.z);
      }
    }
  // Flush and release construction arrays; retain only the GPU geometry.
  for (const tile of tiles.values()) {
    const geometry = tile.batch.geometry(),
      m = new T.Mesh(geometry, material);
    m.name = tile.detail ? 'quay-detail' : 'harbour-block';
    m.castShadow = !tile.detail;
    m.receiveShadow = true;
    root.add(m);
    tile.mesh = m;
    delete tile.batch;
    stats.triangles += geometry.getAttribute('position').count / 3;
    stats.draws++;
  }
  // Each animated truck is also a single draw, with shared geometry.
  function actorGeometry(parts) {
    const b = new GeometryBatch();
    for (const [g, c, x, y, z, sx, sy, sz] of parts) {
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(sx, sy, sz);
      dummy.updateMatrix();
      b.add(g, dummy.matrix, c);
    }
    return b.geometry();
  }
  const truckGeometry = actorGeometry([
    [boxGeo, C.dark, 0, 1.05, 0, 2.8, 1.2, 13],
    [boxGeo, C.cream, 0, 2.4, -4.8, 2.9, 2.8, 3.6],
    [boxGeo, C.glass, 0, 3, -6.65, 2.5, 1.2, 0.1],
    [boxGeo, C.red, 0, 2.8, 1.8, 3, 3.3, 9],
    [boxGeo, C.dark, 0, 0.7, -4.4, 3.2, 1.4, 1.3],
    [boxGeo, C.dark, 0, 0.7, 4.6, 3.2, 1.4, 1.3],
  ]);
  const trucks = routes.map((route) => {
    const m = new T.Mesh(truckGeometry, material);
    m.name = 'quay-truck';
    m.castShadow = true;
    root.add(m);
    return { m, route };
  });
  const hookGeometry = actorGeometry([
    [roundGeo, C.dark, 0, 8, 0, 0.07, 16, 0.07],
    [boxGeo, C.gold, 0, 0, 0, 5, 1, 2],
  ]);
  const hooks = cranes.map((c) => {
    const m = new T.Mesh(hookGeometry, material);
    m.name = 'crane-sling';
    root.add(m);
    return { ...c, m };
  });
  const wingGeo = new T.BufferGeometry();
  wingGeo.setAttribute(
    'position',
    new T.Float32BufferAttribute([0, 0, 0, 3, 0.1, 0.6, 1.5, 0, -0.45], 3),
  );
  wingGeo.computeVertexNormals();
  const wingMaterial = new T.MeshBasicMaterial({ color: '#fff4da', side: T.DoubleSide });
  const birds = new T.InstancedMesh(wingGeo, wingMaterial, 24);
  birds.name = 'gulls';
  birds.instanceMatrix.setUsage(T.DynamicDrawUsage);
  birds.frustumCulled = false;
  root.add(birds);
  const flockCenters = [
    { x: -270, z: 580 },
    { x: -1790, z: 450 },
    { x: -850, z: 190 },
    { x: 450, z: 200 },
    { x: 1200, z: -180 },
    { x: 1850, z: 80 },
  ];
  const cloudGeometry = actorGeometry([
    [leafGeo, '#fff5d9', 0, 0, 0, 34, 11, 15],
    [leafGeo, '#fff5d9', 25, -2, 0, 30, 10, 14],
    [leafGeo, '#fff5d9', -25, -3, 0, 25, 8, 12],
  ]);
  const clouds = [];
  for (let i = 0; i < 14; i++) {
    const m = new T.Mesh(cloudGeometry, material);
    m.position.set(-2300 + i * 350, 210 + (i % 3) * 30, (i % 2 ? 1 : -1) * (360 + (i % 4) * 100));
    m.scale.setScalar(1 + (i % 3) * 0.3);
    m.name = 'cloud';
    root.add(m);
    clouds.push({ m, x: m.position.x });
  }
  let lastVisibility = -Infinity,
    lastTick = -Infinity;
  function update(clock, camera, quality, force = false) {
    if (force || Math.abs(clock - lastVisibility) > 0.3) {
      lastVisibility = clock;
      for (const tile of tiles.values()) {
        const limit = tile.detail ? quality.detailDistance : quality.viewDistance;
        tile.mesh.visible =
          Math.hypot(tile.x - camera.position.x, tile.z - camera.position.z) < limit + 230;
      }
      for (const t of trucks)
        t.m.visible =
          Math.hypot(t.route.x - camera.position.x, t.route.z - camera.position.z) <
          quality.detailDistance + 350;
      for (const c of hooks)
        c.m.visible =
          Math.hypot(c.x - camera.position.x, c.z - camera.position.z) <
          quality.detailDistance + 150;
    }
    if (!force && Math.abs(clock - lastTick) < 1 / 30) return;
    lastTick = clock;
    for (const t of trucks) {
      if (!t.m.visible) continue;
      const p = truckPose(t.route, clock);
      t.m.position.set(p.x, 4.35, p.z);
      t.m.rotation.y = p.h;
    }
    for (const c of hooks) {
      if (c.m.visible)
        c.m.position.set(
          c.x,
          25 + Math.sin(clock * 0.18 + c.phase) * 2,
          c.z + Math.sin(clock * 0.3 + c.phase) * 0.6,
        );
    }
    for (let i = 0; i < 12; i++) {
      const c = flockCenters[i % flockCenters.length],
        a = clock * 0.07 + i * 2.4,
        r = 40 + i * 4,
        x = c.x + Math.cos(a) * r,
        z = c.z + Math.sin(a) * r;
      const visible =
        Math.hypot(x - camera.position.x, z - camera.position.z) < quality.viewDistance * 0.65;
      for (let wing = 0; wing < 2; wing++) {
        dummy.position.set(x, 35 + (i % 3) * 5 + Math.sin(a * 2) * 3, z);
        dummy.rotation.set(
          0,
          -a + (wing ? Math.PI : 0),
          Math.sin(clock * 4 + i) * 0.38 * (wing ? -1 : 1),
        );
        dummy.scale.setScalar(visible ? 1 : 0);
        dummy.updateMatrix();
        birds.setMatrixAt(i * 2 + wing, dummy.matrix);
      }
    }
    birds.instanceMatrix.needsUpdate = true;
    for (const c of clouds) c.m.position.x = c.x + Math.sin(clock * 0.003) * 70;
  }
  return { root, stats, footprints, routes, tiles, update };
}
