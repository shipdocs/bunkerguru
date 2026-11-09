import * as T from '../../vendor/three.js';
import { MAP, land, shoreSegments, basins, decor, roads, bridges } from '../maps/index.mjs';
import { GeometryBatch } from './scene-batch.mjs';
import { LANDMARKS, landmarkClear } from './landmarks.mjs';

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
// Ground colour per district of the 2D map; world.mjs paints the land with it.
export const LAND_COLORS = {
  north: '#86b862',
  park: '#7cb45c',
  island: '#8cbb66',
  base: '#86b862',
  town: '#a9c486',
  town2: '#a9c486',
  city: '#d3cdbf',
  port: '#c3c2b6',
  tanks: '#c9c5ad',
  containers: '#b9bcb8',
};
export const landColor = (l) => l.col || LAND_COLORS[l.kind] || '#c9bf9e';
const HARD = ['city', 'port', 'tanks', 'containers'];
export const kindAt = (x, z) =>
  land.find((l) => l.kind !== 'pillar' && x > l.x0 && x < l.x1 && z > l.z0 && z < l.z1)?.kind;
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

export function createHarborScenery(scene, quality = { light: false }) {
  const root = new T.Group();
  root.name = MAP.name + ' scenery';
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
  // Buildings sit in 320 m tiles that are culled by distance. The quay walls are
  // one mesh for the whole harbour: thin and long, cheap to draw, never popping in.
  const quays = new GeometryBatch();
  let shore = false;
  const tileFor = (x, z, detail) => {
    if (shore) return quays;
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
  const green = (k) => ['north', 'park', 'island', 'base', 'town', 'town2'].includes(k);
  // Decoration from the 2D map, thinned so phones stay smooth. Same seed → same harbour.
  const keep = { house: 0.34, tree: 0.35, container: 0.45, block: 0.7, tank: 0.55 };
  const density = quality.light ? 0.5 : 1;
  const cranes = [],
    stsColors = ['#2f6fb0', '#c8452f', '#2f6fb0', '#e9e4d8'];
  // Container stacks mark a terminal, whatever the district colour of the 2D map.
  const stackCells = new Set(),
    cell = (x, z) => Math.round(x / 90) + ':' + Math.round(z / 90);
  for (const d of decor) if (d.type === 'container') stackCells.add(cell(d.x, d.z));
  const nearStacks = (x, z) =>
    [-90, 0, 90].some((dx) => [-90, 0, 90].some((dz) => stackCells.has(cell(x + dx, z + dz))));
  const tankShell = ['#f1eee4', '#f1eee4', '#e6e2d2', '#cfd8d6', '#9db39a'];
  for (const d of decor) {
    const k = keep[d.type];
    if (k !== undefined && rnd() > k * density) continue;
    const x = d.x,
      z = d.z;
    // Real landmarks stand on cleared ground and replace the 2D placeholder towers.
    if (d.type !== 'crane' && landmarkClear(x, z, 10)) continue;
    if ((d.type === 'tower' || d.type === 'stadium') && LANDMARKS[MAP.id]) continue;
    if (d.type === 'tank') {
      const r = Math.max(6, Math.min(14, d.r || 9)),
        h = 9 + r * 0.6;
      cylinder(r, h, tankShell[Math.floor(rnd() * tankShell.length)], x, 4 + h / 2, z);
      shape(coneGeo, '#fbf9f1', x, 4.5 + h, z, r, 1.6, r);
      cylinder(r * 1.005, 1.2, rnd() > 0.5 ? C.blue : C.red, x, 4 + h * 0.65, z, true);
    } else if (d.type === 'container') {
      const levels = 1 + Math.floor(rnd() * 3),
        color = d.col || palette[Math.floor(rnd() * palette.length)];
      for (let i = 0; i < levels; i++) box(12.2, 2.9, 5.8, color, x, 5.55 + i * 3, z);
      if (!HARD.includes(kindAt(x, z))) box(20, 0.14, 13, C.concrete, x, 4.09, z);
    } else if (d.type === 'house') {
      const wide = 8 + rnd() * 3;
      box(
        wide,
        7,
        10,
        ['#e1c393', '#c98c6a', '#b9bba4', '#f2e6c9', '#75a292'][Math.floor(rnd() * 5)],
        x,
        7.5,
        z,
      );
      shape(roofGeo, C.roof, x, 11, z, wide + 1.2, 4, 11);
    } else if (d.type === 'block') {
      const w = Math.max(10, Math.min(30, d.w || 16)),
        dd = Math.max(10, Math.min(30, d.d || 16)),
        h = 8 + rnd() * 26;
      box(w, h, dd, d.col || C.cream, x, 4 + h / 2, z);
      box(w * 0.92, 0.6, dd * 0.92, C.dark, x, 4 + h + 0.3, z, 0, true);
      // Window bands per storey pair, and a shop front at street level.
      for (let y = 7.5; y < h - 2; y += 6.5)
        box(w + 0.3, 1.7, dd + 0.3, '#7fa3b4', x, 4 + y, z, 0, true);
      if (h > 20 && rnd() > 0.5) box(w * 0.4, 3, dd * 0.4, C.steel, x, 4 + h + 2, z, 0, true);
    } else if (d.type === 'tree') tree(x, z, 0.75 + rnd() * 0.45);
    else if (d.type === 'tower') {
      const h = (d.h || 100) * 0.9;
      cylinder(5, h, d.col || '#d9d7bd', x, 4 + h / 2, z);
      for (let y = h - 28; y < h; y += 14) cylinder(5.05, 7, C.red, x, 4 + y, z);
    } else if (d.type === 'stadium') {
      cylinder(60, 18, '#c7c7c7', x, 13, z);
      cylinder(45, 18.5, C.grass, x, 13.2, z);
    } else if (d.type === 'crane' && (kindAt(x, z) === 'containers' || nearStacks(x, z))) {
      // Ship-to-shore gantry crane of a container terminal: the boom reaches out
      // over the ship, the back reach over the stack.
      const yaw = d.yaw ?? 0,
        fx = Math.sin(yaw),
        fz = -Math.cos(yaw),
        px = -fz,
        pz = fx,
        col = stsColors[cranes.length % stsColors.length];
      for (const back of [2, -22])
        for (const side of [-1, 1]) {
          box(
            2.2,
            46,
            2.2,
            col,
            x + fx * back + px * side * 13,
            27,
            z + fz * back + pz * side * 13,
          );
          box(4, 2, 4, C.dark, x + fx * back + px * side * 13, 5, z + fz * back + pz * side * 13);
        }
      for (const back of [2, -22])
        box(
          Math.abs(px) * 26 + 2,
          2.4,
          Math.abs(pz) * 26 + 2,
          col,
          x + fx * back,
          30,
          z + fz * back,
        );
      box(Math.abs(fx) * 96 + 4, 3.2, Math.abs(fz) * 96 + 4, col, x + fx * 16, 51, z + fz * 16);
      box(6, 5, 6, C.cream, x + fx * 20, 47, z + fz * 20);
      beam([x - fx * 10, 52, z - fz * 10], [x - fx * 4, 74, z - fz * 4], 1.1, col);
      beam([x + fx * 2, 52, z + fz * 2], [x - fx * 4, 74, z - fz * 4], 1.1, col);
      beam([x - fx * 4, 74, z - fz * 4], [x + fx * 62, 53, z + fz * 62], 0.35, C.dark, true);
      beam([x - fx * 4, 74, z - fz * 4], [x - fx * 30, 53, z - fz * 30], 0.35, C.dark, true);
      cranes.push({ x: x + fx * 34, z: z + fz * 34, phase: rnd() * 6, y: 38 });
    } else if (d.type === 'crane') {
      // Portal crane on the quay edge, boom over the water (yaw points at the water).
      const yaw = d.yaw ?? 0,
        fx = Math.sin(yaw),
        fz = -Math.cos(yaw),
        px = -fz,
        pz = fx;
      for (const side of [-1, 1]) {
        box(4, 2, 4, C.steel, x + px * side * 8, 5, z + pz * side * 8);
        beam(
          [x + px * side * 8, 6, z + pz * side * 8],
          [x + px * side * 5, 31, z + pz * side * 5],
          0.85,
          C.gold,
        );
      }
      box(10, 3, 10, C.gold, x, 31, z);
      const tip = [x + fx * 30, 44, z + fz * 30];
      beam([x - fx * 6, 33, z - fz * 6], tip, 1.1, C.gold);
      beam([x, 43, z], tip, 0.3, C.steel, true);
      beam([x, 33, z], [x, 43, z], 0.8, C.gold);
      box(5, 5, 5, C.cream, x + fx * 3, 35, z + fz * 3);
      cranes.push({ x: tip[0], z: tip[2], phase: rnd() * 6 });
    }
    stats.parcels++;
  }
  // Ground cover: polder parcels with ditches on open land, lawns in towns and parks.
  const fields = ['#8fbf68', '#7fb25c', '#9ac672', '#86b862'];
  for (const l of land) {
    if (l.kind === 'pillar') continue;
    const x0 = Math.max(-MAP.halfWidth, l.x0),
      x1 = Math.min(MAP.halfWidth, l.x1),
      z0 = Math.max(MAP.zMin, l.z0),
      z1 = Math.min(MAP.zMax, l.z1);
    if (x1 - x0 < 30 || z1 - z0 < 30) continue;
    for (let x = x0 + 60; x < x1 - 40; x += 160)
      for (let z = z0 + 60; z < z1 - 40; z += 160) {
        if (!landContains(x, z, 90, 90)) continue;
        footprints.push({ x, z, width: 90, depth: 90, kind: l.kind });
        if (l.kind === 'north' || l.kind === 'base') {
          box(152, 0.12, 74, fields[Math.floor(rnd() * 4)], x, 4.08, z - 20);
          box(152, 0.12, 74, fields[Math.floor(rnd() * 4)], x, 4.08, z + 60);
          box(152, 0.14, 2.2, '#6fa9bd', x, 4.09, z + 20, 0, true);
        } else if (green(l.kind) && rnd() > 0.45)
          box(64, 0.12, 64, rnd() > 0.5 ? C.grass : C.grassDark, x, 4.08, z);
      }
  }
  // Water's edge. Port and city: a dark quay wall with a pale coping, bollards and
  // fenders. Polder, park and village: stone at the waterline under a grass bank.
  // Drawn 0.3 m proud of the land, so the collision edge stays where it is.
  shore = true;
  for (const sg of shoreSegments) {
    const alongX = sg.nz !== 0,
      len = alongX ? sg.width : sg.depth,
      kind = kindAt(sg.x - sg.nx * 3, sg.z - sg.nz * 3),
      w = (t) => (alongX ? len + 0.2 : t),
      d = (t) => (alongX ? t : len + 0.2),
      at = (o) => [sg.x + sg.nx * o, sg.z + sg.nz * o];
    if (HARD.includes(kind)) {
      let [x, z] = at(0.05);
      box(w(0.6), 7.4, d(0.6), '#56616a', x, 0.3, z);
      [x, z] = at(-0.9);
      box(w(2.6), 0.5, d(2.6), '#ece6d4', x, 4.2, z);
      if (quality.light) continue;
      [x, z] = at(-1.6);
      box(0.8, 1, 0.8, C.dark, x, 4.9, z);
      [x, z] = at(0.45);
      box(alongX ? 0.7 : 0.3, 3.4, alongX ? 0.3 : 0.7, '#22292e', x, 1.6, z);
    } else {
      let [x, z] = at(0.1);
      box(w(0.8), 4.6, d(0.8), '#8b8e84', x, -0.9, z);
      [x, z] = at(-1.6);
      box(w(3.2), 0.16, d(3.2), C.grassDark, x, 4.1, z);
    }
  }
  shore = false;
  // Roads of the 2D map, on land only.
  for (const r of roads)
    for (let i = 0; i < r.pts.length - 1; i++) {
      const a = r.pts[i],
        b = r.pts[i + 1],
        len = Math.hypot(b.x - a.x, b.z - a.z),
        n = Math.ceil(len / 40),
        alongX = Math.abs(b.x - a.x) > Math.abs(b.z - a.z);
      for (let k = 0; k < n; k++) {
        const x = a.x + ((b.x - a.x) * (k + 0.5)) / n,
          z = a.z + ((b.z - a.z) * (k + 0.5)) / n;
        if (landContains(x, z, alongX ? 40 : 12, alongX ? 12 : 40))
          box(
            alongX ? len / n + 0.5 : Math.max(8, r.width),
            0.18,
            alongX ? Math.max(8, r.width) : len / n + 0.5,
            C.asphalt,
            x,
            4.22,
            z,
          );
      }
    }
  // Fixed bridges: high deck across the water; the pillars collide. Each named
  // bridge gets the silhouette you know it by.
  for (const br of bridges) {
    const span = br.z1 - br.z0,
      zc = (br.z0 + br.z1) / 2,
      x = br.x,
      name = br.name || '',
      lift = /Hef/.test(name);
    // Road deck in asphalt, the girders in the bridge's own colour.
    const dl = lift ? span - 14 : span + 60,
      dy = lift ? 58 : 34;
    box(24, 2.4, dl, C.asphalt, x, dy + 0.4, zc);
    for (const side of [-1, 1]) box(1.6, 4, dl, br.color, x + side * 12.6, dy, zc);
    box(0.5, 0.1, dl, C.stripe, x, dy + 1.65, zc, 0, true);
    // Approach ramps down to the street, where there is land to stand on.
    if (!lift)
      for (const dir of [-1, 1]) {
        const za = zc + dir * (dl / 2),
          zb = za + dir * 150;
        if (!landContains(x, (za + zb) / 2, 20, 120)) continue;
        dummy.position.set(x, 4 + (dy - 4) / 2 + 0.4, (za + zb) / 2);
        dummy.rotation.set(-dir * Math.atan2(dy - 4, 150), 0, 0);
        dummy.scale.set(24, 2.4, Math.hypot(150, dy - 4));
        dummy.updateMatrix();
        tileFor(x, (za + zb) / 2, false).add(boxGeo, dummy.matrix, C.asphalt);
        stats.parts++;
        for (const t of [0.3, 0.62])
          box(
            6,
            (dy - 4) * (1 - t),
            6,
            '#c9c9c4',
            x,
            4 + ((dy - 4) * (1 - t)) / 2,
            za + dir * 150 * t,
          );
      }
    for (const side of [-1, 1])
      box(
        0.5,
        1.6,
        lift ? span - 14 : span + 60,
        C.dark,
        x + side * 13,
        lift ? 61 : 37.2,
        zc,
        0,
        true,
      );
    for (const p of br.pillars) {
      box(9, 34, 9, '#c9c9c4', x, 17, p);
      box(13, 3, 13, '#aeb0aa', x, 1, p, 0, true);
    }
    for (const tz of br.towers) {
      // De Hef: two lattice towers, the span parked at the top.
      for (const dx of [-11, 11])
        for (const dz of [-5, 5]) box(2, 70, 2, br.color, x + dx, 35, tz + dz);
      for (let y = 12; y <= 68; y += 14) box(24, 1.6, 12, br.color, x, y, tz, 0, true);
      box(26, 5, 14, br.color, x, 71, tz);
      for (const dx of [-11, 11]) box(2.4, 8, 2.4, C.dark, x + dx, 77, tz);
    }
    if (/Erasmus/.test(name) && br.pylon !== null) {
      // The Swan: a bent white pylon leaning back, stays fanning to the deck.
      const pz = br.pylon,
        top = [x, 142, pz + 34];
      for (const side of [-1, 1]) {
        beam([x + side * 15, 2, pz], [x + side * 5, 86, pz + 10], 2.6, br.color);
        beam([x + side * 5, 86, pz + 10], top, 2.2, br.color);
      }
      box(30, 4, 6, br.color, x, 36, pz);
      for (let i = 1; i <= 8; i++) {
        const t = i / 8;
        beam([x, 86 + 54 * t, pz + 10 + 23 * t], [x, 36, pz - 30 - i * 26], 0.28, br.color, true);
      }
      for (let i = 0; i < 3; i++)
        beam([x, 136 - i * 8, pz + 32 - i * 3], [x, 36, pz + 90 + i * 14], 0.4, br.color, true);
    } else if (br.pylon !== null && br.pylon !== undefined) {
      beam([x, 34, br.pylon], [x, 140, br.pylon - 30], 2.4, br.color);
      for (let i = 1; i <= 6; i++)
        beam(
          [x, 135 - i * 4, br.pylon - 28 + i * 2],
          [x, 35, br.pylon - 40 - i * 24],
          0.25,
          br.color,
          true,
        );
    }
    if (/Willems/.test(name))
      // Two red A-pylons on the river pier, stays to both sides.
      for (const p of br.pillars) {
        for (const side of [-1, 1]) beam([x + side * 15, 34, p], [x, 96, p], 1.8, br.color);
        for (let i = 1; i <= 5; i++)
          for (const dir of [-1, 1])
            beam([x, 92 - i * 3, p], [x, 36, p + dir * i * 22], 0.25, br.color, true);
      }
    if (/Brienenoord/.test(name) && br.pillars.length >= 2) {
      // The twin steel arches over the main span.
      const [p0, p1] = br.pillars,
        R = (p1 - p0) / 2,
        mid = (p0 + p1) / 2;
      for (const side of [-1, 1]) {
        for (let i = 0; i < 12; i++) {
          const a0 = (i / 12) * Math.PI,
            a1 = ((i + 1) / 12) * Math.PI,
            pt = (a) => [x + side * 12, 37 + Math.sin(a) * R * 0.34, mid - Math.cos(a) * R];
          beam(pt(a0), pt(a1), 1.5, br.color);
          if (i) beam(pt(a0), [x + side * 12, 37, mid - Math.cos(a0) * R], 0.22, br.color, true);
        }
      }
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
  if (quays.positions.length) {
    const m = new T.Mesh(quays.geometry(), material);
    m.name = 'quay-walls';
    m.receiveShadow = true;
    root.add(m);
    stats.triangles += quays.positions.length / 9;
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
  const flockCenters = basins
    .slice(0, 6)
    .map((b) => ({ x: (b.x0 + b.x1) / 2, z: (b.z0 + b.z1) / 2 }));
  if (!flockCenters.length) flockCenters.push({ x: 0, z: 0 });

  const cloudGeometry = actorGeometry([
    [leafGeo, '#fff5d9', 0, 0, 0, 34, 11, 15],
    [leafGeo, '#fff5d9', 25, -2, 0, 30, 10, 14],
    [leafGeo, '#fff5d9', -25, -3, 0, 25, 8, 12],
  ]);
  const clouds = [];
  for (let i = 0; i < 14; i++) {
    const m = new T.Mesh(cloudGeometry, material);
    m.position.set(
      -MAP.halfWidth + ((i + 0.5) * MAP.halfWidth * 2) / 14,
      210 + (i % 3) * 30,
      (i % 2 ? 1 : -1) * (360 + (i % 4) * 100),
    );
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
          (c.y || 25) + Math.sin(clock * 0.18 + c.phase) * 2,
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
