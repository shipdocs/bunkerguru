import * as T from '../../vendor/three.js';
import {
  MAP,
  SHAPE,
  WARP,
  land,
  quayAxis,
  shoreSegments,
  basins,
  decor,
  roads,
  bridges,
} from '../maps/index.mjs';
import { GeometryBatch } from './scene-batch.mjs';
import { LANDMARKS, landmarkClear } from './landmarks.mjs';
import { model, modelMaterial } from './models.mjs';

const C = {
  grass: '#7fb85a',
  grassDark: '#5f9a4c',
  concrete: '#cfc6ad',
  asphalt: '#59666b',
  stripe: '#f6e3a0',
  steel: '#4a6e78',
  dark: '#2f444c',
  cream: '#f4e8cc',
  roof: '#c7653f',
  slate: '#55606b',
  blue: '#4f8fb0',
  gold: '#e9aa3e',
  leaf: '#4f9a5c',
  leafLight: '#7fb85c',
  leafDark: '#3f7f52',
  trunk: '#7d6447',
  glass: '#3c7184',
  red: '#cf6a4c',
};
const palette = ['#c8452f', '#2f6fb0', '#e0a030', '#3d8f6a', '#d9d4c5', '#8a4630', '#4f8fb0'];
// Dutch street colours: brick, plaster and painted fronts; tile and slate roofs.
const BRICK = ['#b5553b', '#a8492f', '#c46e4a', '#8f4a36', '#d49a6a', '#c9b08a', '#7d5a48'],
  PLASTER = ['#f1e6cf', '#e6d3ad', '#f6efe0', '#d9c7a8', '#c9d6cf', '#e9c9a8', '#dfe3e0'],
  GLASSY = ['#6f9fb4', '#4f7f98', '#8fb4bf', '#5f8f8a', '#3f5f78', '#9fb9c9'],
  SHED = ['#5f8fa8', '#b9bdb6', '#c8563c', '#8fa58a', '#e2d9c0', '#6f7f88'],
  ROOFS = ['#c7653f', '#b9583a', '#d2774a', '#55606b', '#6b5a52', '#8a4a3a'];
const fullBox = new T.BoxGeometry(1, 1, 1);
// A copy of a geometry without the faces nobody sees (the underside of a building).
function dropFaces(source, hidden) {
  const g = source.toNonIndexed(),
    out = {},
    n = g.getAttribute('normal');
  for (const key of ['position', 'normal', 'uv']) out[key] = [];
  for (let i = 0; i < n.count; i += 3) {
    if (hidden(n.getX(i), n.getY(i), n.getZ(i))) continue;
    for (const key of ['position', 'normal', 'uv']) {
      const a = g.getAttribute(key);
      for (let k = i; k < i + 3; k++)
        for (let c = 0; c < a.itemSize; c++) out[key].push(a.array[k * a.itemSize + c]);
    }
  }
  const r = new T.BufferGeometry();
  r.setAttribute('position', new T.Float32BufferAttribute(out.position, 3));
  r.setAttribute('normal', new T.Float32BufferAttribute(out.normal, 3));
  r.setAttribute('uv', new T.Float32BufferAttribute(out.uv, 2));
  r.computeBoundingBox();
  return r;
}
function flatGeometry(points) {
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(points, 3));
  g.computeVertexNormals();
  g.computeBoundingBox();
  return g;
}
const boxGeo = dropFaces(fullBox, (x, y) => y < -0.5),
  wallGeo = dropFaces(fullBox, (x, y) => Math.abs(y) > 0.5),
  flatGeo = dropFaces(fullBox, (x, y) => y < 0.5).translate(0, -0.5, 0),
  roundGeo = new T.CylinderGeometry(1, 1, 1, 12),
  tankGeo = new T.CylinderGeometry(1, 1, 1, 12, 1, true),
  tubeGeo = new T.CylinderGeometry(1, 1, 1, 6, 1, true),
  trunkGeo = new T.CylinderGeometry(0.7, 1, 1, 5, 1, true),
  coneGeo = new T.ConeGeometry(1, 1, 12, 1, true),
  spireGeo = new T.ConeGeometry(1, 1, 4, 1, true),
  leafGeo = new T.IcosahedronGeometry(1, 0);
// Unit pitched roof, ridge along Z: the two slopes, and the two gable triangles that
// take the colour of the wall below.
const roofGeo = flatGeometry(
    [
      [0.5, 0, -0.5, 0, 1, -0.5, 0, 1, 0.5],
      [0.5, 0, -0.5, 0, 1, 0.5, 0.5, 0, 0.5],
      [-0.5, 0, -0.5, 0, 1, 0.5, 0, 1, -0.5],
      [-0.5, 0, -0.5, -0.5, 0, 0.5, 0, 1, 0.5],
    ].flat(),
  ),
  gableGeo = flatGeometry(
    [
      [-0.5, 0, 0.5, 0.5, 0, 0.5, 0, 1, 0.5],
      [0.5, 0, -0.5, -0.5, 0, -0.5, 0, 1, -0.5],
    ].flat(),
  );
for (const g of [
  fullBox,
  flatGeo,
  roundGeo,
  tankGeo,
  tubeGeo,
  trunkGeo,
  coneGeo,
  spireGeo,
  leafGeo,
])
  g.computeBoundingBox();
// Batch with two extras baked per vertex: a brightness ramp up the wall (dark at the
// foot: cheap ambient occlusion) and, for facades, window coordinates for the shader:
// x in bays, y in storeys, z = style + a random fraction per building.
class SceneBatch extends GeometryBatch {
  add(geometry, matrix, color, shade = 1, win = null) {
    const start = this.positions.length / 3;
    super.add(geometry, matrix, color);
    const end = this.positions.length / 3;
    if (this.win) while (this.win.length < start * 3) this.win.push(0);
    if (shade === 1 && !win) return;
    const p = geometry.getAttribute('position'),
      n = geometry.getAttribute('normal'),
      uv = geometry.getAttribute('uv'),
      index = geometry.index,
      y0 = geometry.boundingBox.min.y,
      dy = geometry.boundingBox.max.y - y0 || 1;
    if (win && !this.win) this.win = new Array(start * 3).fill(0);
    for (let i = start; i < end; i++) {
      const k = index ? index.getX(i - start) : i - start,
        f = shade + (1 - shade) * ((p.getY(k) - y0) / dy);
      for (let c = 0; c < 3; c++) this.colors[i * 3 + c] *= f;
      if (!win) continue;
      if (Math.abs(n.getY(k)) > 0.5) this.win.push(0, 0, 0);
      else {
        const wide = Math.abs(n.getX(k)) > 0.5 ? win.d : win.w;
        this.win.push(
          uv.getX(k) * Math.max(1, Math.round(wide / win.bay)),
          uv.getY(k) * Math.max(1, Math.round(win.h / win.floor)),
          win.s,
        );
      }
    }
  }
  // Loose triangles (already in the world): ground that follows the warp.
  addTriangles(points, normal, color) {
    const c = new T.Color(color);
    for (let i = 0; i < points.length; i += 3) {
      this.positions.push(points[i], points[i + 1], points[i + 2]);
      this.normals.push(...normal);
      this.colors.push(c.r, c.g, c.b);
    }
  }
  geometry() {
    const g = super.geometry();
    if (this.win) {
      while (this.win.length < this.positions.length) this.win.push(0);
      g.setAttribute('win', new T.Float32BufferAttribute(this.win, 3));
    }
    return g;
  }
}
// One material for the whole harbour. Facades get their windows in the shader: a
// fitted grid per wall, dark glass by day, a share of them lit when night falls.
function harbourMaterial(night) {
  const m = new T.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.winNight = night;
    sh.vertexShader =
      'attribute vec3 win;\nvarying vec3 vWin;\n' +
      sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWin = win;');
    sh.fragmentShader =
      'varying vec3 vWin;\nuniform float winNight;\n' +
      sh.fragmentShader
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
float winLit = 0.;
if (vWin.z > .5) {
  float style = floor(vWin.z + .001), seed = floor(fract(vWin.z) * 64. + .5);
  vec2 cell = floor(vWin.xy), f = fract(vWin.xy);
  float r1 = fract(sin(dot(cell + seed, vec2(12.9898, 78.233))) * 43758.5453);
  float r2 = fract(sin(dot(cell + seed, vec2(39.346, 11.135))) * 24634.6345);
  vec2 lo = vec2(.2, .3), hi = vec2(.8, .78);
  if (style > 1.5) { lo = vec2(.05, .12); hi = vec2(.95, .9); }
  if (style > 2.5) { lo = vec2(.27, .24); hi = vec2(.73, .82); }
  if (style > 3.5) { lo = vec2(.12, .58); hi = vec2(.88, .8); }
  float street = step(cell.y, .5) * step(style, 3.5);
  lo = mix(lo, vec2(.1, .12), street); hi = mix(hi, vec2(.9, .74), street);
  float e = .04;
  vec2 a = smoothstep(lo - e, lo + e, f) * (1. - smoothstep(hi - e, hi + e, f));
  vec2 b = smoothstep(lo - .11, lo - .05, f) * (1. - smoothstep(hi + .05, hi + .11, f));
  float far = smoothstep(700., 2200., length(vViewPosition));
  float m = mix(a.x * a.y, (hi.x - lo.x) * (hi.y - lo.y), far);
  float frame = (b.x * b.y - a.x * a.y) * step(2.5, style) * step(style, 3.5) * (1. - far);
  diffuseColor.rgb *= 1. - .25 * (1. - smoothstep(.08, .2, vWin.y));
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.86, .8, .66), frame * .85);
  vec3 glass = mix(vec3(.07, .15, .22), vec3(.3, .5, .62), r1 * .5 + f.y * .5);
  glass = mix(glass, vec3(.62, .6, .5), step(.86, r2) * .7);
  diffuseColor.rgb = mix(diffuseColor.rgb, glass, m);
  winLit = m * step(mix(style > 1.5 && style < 2.5 ? .72 : .56, .3, street), r1) * (.5 + .5 * r2);
}`,
        )
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
totalEmissiveRadiance += vec3(1., .66, .3) * winLit * winNight;`,
        );
  };
  return m;
}
const hash2 = (x, z) => {
  let h = Math.imul(Math.floor(x) * 73856093, 1) ^ Math.imul(Math.floor(z) * 19349663, 1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
// Smooth value noise: districts and tree belts come in patches, not as confetti.
const noise = (x, z) => {
  const ix = Math.floor(x),
    iz = Math.floor(z),
    fx = x - ix,
    fz = z - iz,
    sx = fx * fx * (3 - 2 * fx),
    sz = fz * fz * (3 - 2 * fz),
    a = hash2(ix, iz),
    b = hash2(ix + 1, iz),
    c = hash2(ix, iz + 1),
    d = hash2(ix + 1, iz + 1);
  return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz;
};
// Ground colour per district of the 2D map; world.mjs paints the land with it.
export const LAND_COLORS = {
  north: '#7fb957',
  park: '#6fae55',
  island: '#84b95c',
  base: '#7fb957',
  town: '#9cc07a',
  town2: '#9cc07a',
  city: '#cdc2ab',
  port: '#b9b6aa',
  tanks: '#c4bda2',
  containers: '#abafac',
};
export const landColor = (l) => l.col || LAND_COLORS[l.kind] || '#c9bf9e';
const HARD = ['city', 'port', 'tanks', 'containers'];
// On a real outline the district comes from the land use (maps/real-map.mjs).
const USE = { p: 'port', c: 'city', g: 'park' };
export const kindAt = (x, z) =>
  SHAPE
    ? SHAPE.inside(x, z)
      ? undefined
      : USE[MAP.landUseAt(x, z)]
    : land.find((l) => l.kind !== 'pillar' && x > l.x0 && x < l.x1 && z > l.z0 && z < l.z1)?.kind;
export function landContains(x, z, w = 0, d = 0) {
  if (SHAPE) {
    const r = Math.hypot(w, d) / 2;
    return !SHAPE.inside(x, z) && !(SHAPE.closest(x, z, r)?.d < r);
  }
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
  // A bridge pylon from Blender (render/models.mjs), when it loaded: standing on `foot`
  // (its own water level), its +x along the deck towards `dir`. False without it.
  const pylon = (name, foot, dir) => {
    const made = model(name);
    if (!made) return false;
    const m = new T.Mesh(made.body, modelMaterial),
      ex = new T.Vector3(...dir).normalize(),
      up = new T.Vector3(0, 1, 0);
    m.matrixAutoUpdate = false;
    m.matrix.makeBasis(ex, up, ex.clone().cross(up)).setPosition(...foot);
    m.castShadow = m.receiveShadow = true;
    m.name = name + '-pylon';
    root.add(m);
    return true;
  };
  const swan = (foot, dir) => pylon('erasmusbrug', foot, dir);
  root.name = MAP.name + ' scenery';
  scene.add(root);
  const night = { value: 0 },
    material = harbourMaterial(night);
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
  const pick = (list) => list[Math.floor(rnd() * list.length)];
  // Window style plus a random number per building, in steps the shader can read back
  // exactly (an interpolated fraction would make the panes sparkle).
  const facade = (style) => style + (1 + Math.floor(rnd() * 60)) / 64;
  // Buildings sit in 480 m tiles (small detail in 320 m tiles) that are culled by distance. The quay walls are
  // one mesh for the whole harbour: thin and long, cheap to draw, never popping in.
  // The land beyond the map edge is one more.
  const quays = new SceneBatch(),
    beyond = new SceneBatch();
  let single = null;
  const tileFor = (x, z, detail) => {
    if (single) return single;
    const size = detail ? 320 : 480,
      tx = Math.floor(x / size),
      tz = Math.floor(z / size),
      key = tx + ':' + tz + ':' + detail;
    if (!tiles.has(key))
      tiles.set(key, {
        batch: new SceneBatch(),
        x: (tx + 0.5) * size,
        z: (tz + 0.5) * size,
        reach: size * 0.72,
        detail,
      });
    return tiles.get(key).batch;
  };
  // The harbour is laid out on the straight map and built in the warped world
  // (maps/warp.mjs). Everything below places things at map coordinates; a frame turns
  // them into the world. What stands up (houses, tanks, cranes) keeps its shape and
  // turns with the quay it belongs to: axis 'x' along the river, 'z' along a basin
  // quay. What lies flat or runs along the water's edge (fields, roads, quay walls)
  // follows the warp itself: axis 'affine'.
  const placed = new T.Matrix4();
  let frame = null, // set by inFrame: several parts that must stay one rigid object
    axis = null; // default for the section being built; null = by the nearest quay
  const makeFrame = (x, z, ax) => {
    const f = WARP.frame(x, z, ax),
      w = WARP.forward(x, z);
    return { ...f, tx: w.x - f.a * x - f.b * z, tz: w.z - f.c * x - f.d * z };
  };
  const toW = (f, x, z) => ({ x: f.a * x + f.b * z + f.tx, z: f.c * x + f.d * z + f.tz });
  const axisAt = quayAxis;
  const frameAt = (x, z, ax) => frame || makeFrame(x, z, ax || axis || axisAt(x, z));
  function inFrame(x, z, ax, build) {
    if (WARP.identity || frame) return build();
    frame = makeFrame(x, z, ax || axis || axisAt(x, z));
    try {
      return build();
    } finally {
      frame = null;
    }
  }
  function withAxis(ax, build) {
    const before = axis;
    axis = ax;
    try {
      return build();
    } finally {
      axis = before;
    }
  }
  // dummy.matrix holds a part at map coordinates; add it to its tile in the world.
  function emit(g, c, x, z, detail, shade, win, ax) {
    let m = dummy.matrix,
      wx = x,
      wz = z;
    if (!WARP.identity) {
      const f = frameAt(x, z, ax);
      m = placed
        .set(f.a, 0, f.b, f.tx, 0, 1, 0, 0, f.c, 0, f.d, f.tz, 0, 0, 0, 1)
        .multiply(dummy.matrix);
      wx = m.elements[12];
      wz = m.elements[14];
    }
    tileFor(wx, wz, detail).add(g, m, c, shade, win);
    stats.parts++;
  }
  function shape(g, c, x, y, z, sx, sy, sz, rot = 0, detail = false, shade = 1, win = null, ax) {
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, rot, 0);
    dummy.scale.set(sx, sy, sz);
    dummy.updateMatrix();
    if (win) win = { ...win, w: sx, d: sz, h: sy };
    emit(g, c, x, z, detail, shade, win, ax);
  }
  // Boxes that stand on the ground have no underside; raised ones (bridge decks,
  // crane girders) keep it, because you sail underneath.
  const box = (w, h, d, c, x, y, z, rot = 0, detail = false, shade = 1, win = null) =>
    shape(y - h / 2 > 6 ? fullBox : boxGeo, c, x, y, z, w, h, d, rot, detail, shade, win);
  const flat = (w, d, c, x, y, z, rot = 0, detail = false) =>
    shape(flatGeo, c, x, y, z, w, 1, d, rot, detail, 1, null, 'affine');
  const cylinder = (r, h, c, x, y, z, detail = false, shade = 1) =>
    shape(roundGeo, c, x, y, z, r, h, r, 0, detail, shade);
  function beam(a, b, r, c, detail = false) {
    const start = new T.Vector3(...a),
      end = new T.Vector3(...b),
      delta = end.clone().sub(start);
    dummy.position.copy(start).add(end).multiplyScalar(0.5);
    dummy.scale.set(r, delta.length(), r);
    dummy.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
    dummy.updateMatrix();
    emit(tubeGeo, c, dummy.position.x, dummy.position.z, detail, 1, null);
  }
  // A bridge of a real outline: straight deck from bank to bank at any angle, its
  // pillars, ramps down to the street, and the Erasmusbrug's swan.
  function realBridge(br) {
    const dx = br.bx - br.ax,
      dz = br.bz - br.az,
      L = Math.hypot(dx, dz),
      tx = dx / L,
      tz = dz / L,
      nx = -tz,
      nz = tx,
      rot = Math.atan2(-tz, tx),
      cx = (br.ax + br.bx) / 2,
      cz = (br.az + br.bz) / 2,
      dy = (br.height || 30) + 4,
      at = (u, v) => [cx + tx * u + nx * v, cz + tz * u + nz * v];
    box(L, 2.4, 24, C.asphalt, cx, dy + 0.4, cz, rot);
    for (const side of [-1, 1]) {
      const [x, z] = at(0, side * 12.6);
      box(L, 4, 1.6, br.color, x, dy, z, rot);
      const [rx, rz] = at(0, side * 13);
      box(L, 1.6, 0.5, C.dark, rx, dy + 2.8, rz, rot, true);
    }
    box(L, 0.1, 0.5, C.stripe, cx, dy + 1.65, cz, rot, true);
    for (const dir of [-1, 1]) {
      const [x, z] = at(dir * (L / 2 + 75), 0),
        tilt = Math.atan2(dy - 4, 150) * dir;
      if (!landContains(x, z, 30, 30)) continue;
      dummy.position.set(x, 4 + (dy - 4) / 2 + 0.4, z);
      dummy.rotation.set(0, rot, -tilt, 'YXZ');
      dummy.scale.set(Math.hypot(150, dy - 4), 2.4, 24);
      dummy.updateMatrix();
      emit(boxGeo, C.asphalt, x, z, false, 1, null);
      dummy.rotation.order = 'XYZ';
    }
    for (const p of br.pillars) {
      box(9, dy, 9, '#c9c9c4', p.x, dy / 2, p.z, rot);
      box(13, 3, 13, '#aeb0aa', p.x, 1, p.z, rot, true);
      // the red pylons of the Willemsbrug stand on its river pier (deck 30 m in the model)
      if (/Willems/.test(br.name)) pylon('willemsbrug', [p.x, dy - 30, p.z], [tx, 0, tz]);
    }
    if (br.pylon !== null && /Erasmus/.test(br.name)) {
      const u0 = (br.pylon - 0.5) * L,
        P = (u, v, y) => {
          const [x, z] = at(u0 + u, v);
          return [x, y, z];
        };
      if (swan(P(0, 0, dy - 36), [tx, 0, tz])) return;
      for (const side of [-1, 1]) {
        beam(P(0, side * 15, 2), P(10, side * 5, 86), 2.6, br.color);
        beam(P(10, side * 5, 86), P(34, 0, 142), 2.2, br.color);
      }
      for (let i = 1; i <= 8; i++) {
        const t = i / 8;
        beam(P(10 + 23 * t, 0, 86 + 54 * t), P(-30 - i * 26, 0, dy), 0.28, br.color, true);
        beam(P(10 + 23 * t, 0, 86 + 54 * t), P(60 + i * 18, 0, dy), 0.28, br.color, true);
      }
    }
  }
  // Soft dark rim on the ground round everything that stands on it: one transparent
  // mesh for the whole harbour. It is what makes a building sit instead of float.
  const shadeP = [],
    shadeC = [],
    SHADE_Y = 4.62;
  // A fan from the middle (hidden under the building) fading out to the rim.
  function shadeFan(x, z, pts, a) {
    const n = pts.length,
      f = WARP.identity ? null : frameAt(x, z),
      at = (px, pz) => (f ? toW(f, px, pz) : { x: px, z: pz }),
      o = at(x, z);
    for (let i = 0; i < n; i++) {
      const p = at(x + pts[i][0], z + pts[i][1]),
        q = at(x + pts[(i + 1) % n][0], z + pts[(i + 1) % n][1]);
      shadeP.push(o.x, SHADE_Y, o.z, p.x, SHADE_Y, p.z, q.x, SHADE_Y, q.z);
      shadeC.push(0, 0, 0, a, 0, 0, 0, 0, 0, 0, 0, 0);
    }
  }
  function skirt(x, z, w, d, rot = 0, spread = 5, a = 0.34) {
    if (quality.light) return;
    const c = Math.cos(rot),
      s = Math.sin(rot),
      hw = w / 2 + spread,
      hd = d / 2 + spread,
      p = (px, pz) => [px * c + pz * s, -px * s + pz * c];
    shadeFan(
      x,
      z,
      [p(-hw, -hd), p(-hw, hd), p(hw, hd), p(hw, -hd)],
      Math.min(1, (a * (Math.min(w, d) / 2 + spread)) / spread),
    );
  }
  function skirtRound(x, z, r, spread = 5, a = 0.34) {
    if (quality.light) return;
    const pts = [];
    for (let i = 0; i < 6; i++)
      pts.push([Math.cos(-i * 1.0472) * (r + spread), Math.sin(-i * 1.0472) * (r + spread)]);
    shadeFan(x, z, pts, Math.min(1, (a * (r + spread)) / spread));
  }
  // What already stands where: new street furniture keeps clear of it.
  const taken = new Map(),
    cellKey = (x, z) => Math.floor(x / 24) + ':' + Math.floor(z / 24);
  function claim(x, z, r) {
    const k = cellKey(x, z);
    if (!taken.has(k)) taken.set(k, []);
    taken.get(k).push([x, z, r]);
  }
  function free(x, z, r) {
    for (let dx = -24; dx <= 24; dx += 24)
      for (let dz = -24; dz <= 24; dz += 24)
        for (const o of taken.get(cellKey(x + dx, z + dz)) || [])
          if (Math.hypot(o[0] - x, o[1] - z) < o[2] + r) return false;
    return true;
  }
  const roadNear = (x, z, m) =>
    roads.some((r) =>
      r.pts.some((a, i) => {
        const b = r.pts[i + 1];
        if (!b) return false;
        const vx = b.x - a.x,
          vz = b.z - a.z,
          t = Math.max(
            0,
            Math.min(1, ((x - a.x) * vx + (z - a.z) * vz) / (vx * vx + vz * vz || 1)),
          );
        return Math.hypot(a.x + vx * t - x, a.z + vz * t - z) < Math.max(8, r.width) / 2 + m;
      }),
    );
  const bridgeNear = (x, z, m) =>
    bridges.some((b) => Math.abs(x - b.x) < 14 + m && z > b.z0 - 190 && z < b.z1 + 190);
  const open = (x, z, r) =>
    free(x, z, r) && !landmarkClear(x, z, r) && !roadNear(x, z, r) && !bridgeNear(x, z, r);
  const tree = (x, z, size = 1, kind = 0) => inFrame(x, z, null, () => tree0(x, z, size, kind));
  function tree0(x, z, size, kind) {
    const leaf = kind === 2 ? C.leafDark : rnd() > 0.5 ? C.leaf : C.leafLight;
    shape(trunkGeo, C.trunk, x, 4 + 2.2 * size, z, 0.6 * size, 4.4 * size, 0.6 * size);
    if (kind === 2) {
      // poplar: tall and narrow, the tree of every Dutch dyke
      shape(
        leafGeo,
        leaf,
        x,
        4 + 9.5 * size,
        z,
        2.6 * size,
        8.5 * size,
        2.6 * size,
        rnd() * 3,
        false,
        0.72,
      );
      return;
    }
    shape(
      leafGeo,
      leaf,
      x,
      4 + 7 * size,
      z,
      4.7 * size,
      5.4 * size,
      4.5 * size,
      rnd() * 3,
      false,
      0.68,
    );
    shape(
      leafGeo,
      C.leafLight,
      x + 2 * size,
      4 + 8.4 * size,
      z - 1,
      3 * size,
      3.2 * size,
      3 * size,
      rnd() * 3,
      true,
      0.8,
    );
  }
  // A house: walls with windows, a tiled roof and gables in the wall colour. `wide`
  // runs along local X, the ridge along local Z; rot turns it to face a street or quay.
  function house(x, z, wide, deep, h, wall, roofCol, rot = 0, style = 3, roofH = 0, own = true) {
    const s = facade(style),
      rh = roofH || wide * 0.42;
    box(wide, h, deep, wall, x, 4 + h / 2, z, rot, false, 0.74, { bay: 2.7, floor: 3.1, s });
    shape(roofGeo, roofCol, x, 4 + h, z, wide + 0.5, rh, deep + 0.7, rot, false);
    shape(gableGeo, wall, x, 4 + h, z, wide, rh, deep, rot, false);
    skirt(x, z, wide, deep, rot, 3.5, 0.3);
    if (own) claim(x, z, Math.max(wide, deep) * 0.62);
  }
  // Low shed with a shallow roof: transit sheds, workshops, farm barns.
  function shed(x, z, wide, deep, h, col, rot = 0) {
    box(wide, h, deep, col, x, 4 + h / 2, z, rot, false, 0.72, {
      bay: 6,
      floor: h,
      s: facade(4),
    });
    shape(roofGeo, C.slate, x, 4 + h, z, wide + 0.8, wide * 0.16, deep + 0.8, rot, false);
    shape(gableGeo, col, x, 4 + h, z, wide, wide * 0.16, deep, rot, false);
    skirt(x, z, wide, deep, rot, 5, 0.32);
    claim(x, z, Math.max(wide, deep) * 0.6);
  }
  // City block from the 2D map. The neighbourhood decides what it becomes: old town
  // in brick with gables, plastered flats, or glass offices that grow into towers.
  const cityBlock = (x, z, w, d, col, port) =>
    inFrame(x, z, null, () => cityBlock0(x, z, w, d, col, port));
  function cityBlock0(x, z, w, d, col, port) {
    const district = noise(x / 380 + 11.3, z / 380 + 4.7) + (hash2(x / 20, z / 20) - 0.5) * 0.16;
    if (port) return shed(x, z, Math.max(w, 15), Math.max(d, 14), 7 + rnd() * 5, pick(SHED));
    if (district < 0.4) {
      const h = 9.5 + Math.floor(rnd() * 3) * 3.1 + rnd();
      // a terrace: eaves to the street, the ridge running along the row
      return house(
        x,
        z,
        Math.max(11, d),
        Math.min(19.2, w + 5),
        h,
        pick(BRICK),
        pick(ROOFS),
        Math.PI / 2,
        3,
        5,
      );
    }
    if (district < 0.66) {
      const h = 12.5 + Math.floor(rnd() * 6) * 3.1,
        wall = rnd() > 0.35 ? pick(PLASTER) : col || pick(PLASTER);
      box(w, h, d, wall, x, 4 + h / 2, z, 0, false, 0.74, {
        bay: 3,
        floor: 3.1,
        s: facade(1),
      });
      box(w - 1.4, 0.7, d - 1.4, '#6f7a80', x, 4 + h + 0.35, z);
      if (rnd() > 0.55)
        box(w * 0.45, 3, d * 0.5, wall, x - w * 0.12, 4 + h + 1.5, z, 0, true, 0.85);
      skirt(x, z, w, d, 0, 5);
      return claim(x, z, Math.max(w, d) * 0.6);
    }
    // business district: the further into it, the taller
    const tall = Math.max(0, district - 0.66) * 3,
      h = 20 + rnd() * 22 + (rnd() > 0.8 ? tall * (40 + rnd() * 60) : 0),
      wall = pick(GLASSY),
      ww = Math.min(19, w * 1.15),
      dd = Math.min(19, d * 1.15);
    box(ww, h, dd, wall, x, 4 + h / 2, z, 0, false, 0.66, {
      bay: 2.4,
      floor: 3.4,
      s: facade(2),
    });
    if (h > 44) {
      const top = 6 + rnd() * 12;
      box(ww * 0.72, top, dd * 0.72, wall, x, 4 + h + top / 2, z, 0, false, 0.9, {
        bay: 2.4,
        floor: 3.4,
        s: facade(2),
      });
      box(ww * 0.3, 3, dd * 0.3, C.steel, x, 4 + h + top + 1.5, z, 0, true);
    } else {
      box(ww - 1.2, 0.8, dd - 1.2, '#57646c', x, 4 + h + 0.4, z);
      box(ww * 0.4, 2.6, dd * 0.4, C.steel, x, 4 + h + 1.3, z, 0, true);
    }
    skirt(x, z, ww, dd, 0, 7, 0.4);
    claim(x, z, Math.max(ww, dd) * 0.6);
  }
  // A map point as the current frame (or the warp itself) puts it in the world.
  const inWorld = (x, z) =>
    WARP.identity ? { x, z } : frame ? toW(frame, x, z) : WARP.forward(x, z);
  const truckParts = (x, z, rot, col) =>
    inFrame(x, z, null, () => {
      const c = Math.cos(rot),
        s = Math.sin(rot);
      box(2.8, 3.4, 9, col, x + s * 1.6, 6.1, z + c * 1.6, rot, true, 0.8);
      box(2.7, 2.9, 2.6, C.cream, x - s * 4.5, 5.8, z - c * 4.5, rot, true, 0.8);
    });
  const green = (k) => ['north', 'park', 'island', 'base', 'town', 'town2'].includes(k);
  // Decoration from the 2D map, thinned so phones stay smooth. Same seed → same harbour.
  const keep = { house: 0.62, tree: 0.5, container: 0.5, block: 0.86, tank: 0.56 };
  const density = quality.light ? 0.5 : 1;
  const cranes = [],
    stsColors = ['#2f6fb0', '#c8452f', '#2f6fb0', '#e9e4d8'];
  // Container stacks mark a terminal, whatever the district colour of the 2D map.
  const stackCells = new Set(),
    cell = (x, z) => Math.round(x / 90) + ':' + Math.round(z / 90);
  for (const d of decor) if (d.type === 'container') stackCells.add(cell(d.x, d.z));
  const nearStacks = (x, z) =>
    [-90, 0, 90].some((dx) => [-90, 0, 90].some((dz) => stackCells.has(cell(x + dx, z + dz))));
  const tankShell = ['#f4f1e6', '#f4f1e6', '#e9e4d2', '#cfdcd9', '#9fbf9c', '#e8d9a8'];
  for (const d of decor) {
    const k = keep[d.type];
    // Houses stay or go by the stretch of street, so rows remain rows.
    const chance = d.type === 'house' ? hash2(d.x / 76, d.z / 19 + 0.5) : rnd();
    if (k !== undefined && chance > k * density) continue;
    const x = d.x,
      z = d.z;
    // Real landmarks stand on cleared ground and replace the 2D placeholder towers.
    if (d.type !== 'crane' && landmarkClear(x, z, 10)) continue;
    if ((d.type === 'tower' || d.type === 'stadium') && LANDMARKS[MAP.id]) continue;
    if ((d.type === 'block' || d.type === 'house') && bridgeNear(x, z, 8)) continue;
    if (d.type === 'tank') {
      const r = Math.max(6, Math.min(14, d.r || 9)),
        h = 9 + r * 0.6;
      shape(tankGeo, pick(tankShell), x, 4 + h / 2, z, r, h, r, 0, false, 0.7);
      shape(coneGeo, '#fbf9f1', x, 4.8 + h, z, r, 1.6, r);
      if (r > 10)
        shape(
          tankGeo,
          rnd() > 0.5 ? C.blue : C.red,
          x,
          4 + h * 0.72,
          z,
          r * 1.01,
          1.3,
          r * 1.01,
          0,
          true,
        );
      skirtRound(x, z, r, 5, 0.36);
      claim(x, z, r + 1);
    } else if (d.type === 'container') {
      const levels = 1 + Math.floor(rnd() * 3);
      for (let i = 0; i < levels; i++)
        box(
          12.2,
          2.9,
          5.8,
          i ? pick(palette) : d.col || pick(palette),
          x,
          5.55 + i * 3,
          z,
          0,
          false,
          0.82,
        );
      if (!HARD.includes(kindAt(x, z))) flat(20, 13, C.concrete, x, 4.2, z);
      skirt(x, z, 12.2, 5.8, 0, 2.5, 0.3);
      claim(x, z, 7);
    } else if (d.type === 'house') {
      const wide = 9 + rnd() * 3.5;
      house(
        x,
        z,
        wide,
        9.5 + rnd() * 2,
        5.6 + rnd() * 1.6,
        rnd() > 0.45 ? pick(BRICK) : pick(PLASTER),
        pick(ROOFS),
      );
    } else if (d.type === 'block') {
      const w = Math.max(11, Math.min(30, d.w || 16)),
        dd = Math.max(11, Math.min(30, d.d || 16));
      cityBlock(x, z, w, dd, d.col, ['port', 'tanks', 'containers'].includes(kindAt(x, z)));
    } else if (d.type === 'tree') {
      tree(x, z, 0.75 + rnd() * 0.45);
      claim(x, z, 2.5);
    } else if (d.type === 'tower') {
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
      // One rigid crane, square to its quay (the boom points at the water).
      frame = WARP.identity ? null : makeFrame(x, z, Math.abs(fx) > Math.abs(fz) ? 'z' : 'x');
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
      cranes.push({ ...inWorld(x + fx * 34, z + fz * 34), phase: rnd() * 6, y: 38 });
      frame = null;
      claim(x - fx * 10, z - fz * 10, 20);
    } else if (d.type === 'crane') {
      // Portal crane on the quay edge, boom over the water (yaw points at the water).
      const yaw = d.yaw ?? 0,
        fx = Math.sin(yaw),
        fz = -Math.cos(yaw),
        px = -fz,
        pz = fx;
      frame = WARP.identity ? null : makeFrame(x, z, Math.abs(fx) > Math.abs(fz) ? 'z' : 'x');
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
      cranes.push({ ...inWorld(tip[0], tip[2]), phase: rnd() * 6 });
      frame = null;
      claim(x, z, 12);
    }
    stats.parcels++;
  }
  // Ground cover: polder parcels with ditches on open land, lawns in towns and parks.
  // Farms, hedgerows and poplars keep the polder from being a bare green sheet.
  const fields = ['#8cc463', '#76b052', '#a3cc6c', '#7fb957', '#b9cf73', '#6fa64f'];
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
          const wide = landContains(x, z + 20, 156, 158);
          if (wide) {
            flat(152, 74, pick(fields), x, 4.2, z - 20);
            flat(152, 74, pick(fields), x, 4.2, z + 60);
            flat(152, 2.4, '#5d9fc0', x, 4.24, z + 20, 0, true);
          } else flat(84, 84, pick(fields), x, 4.2, z);
          if (quality.light) continue;
          if (rnd() > 0.45)
            for (let i = 0; i < 6; i++) {
              const tx = x - 66 + i * 26 + rnd() * 6,
                tz = z + (wide ? 16 : 40);
              if (landContains(tx, tz, 8, 8) && open(tx, tz, 3)) tree(tx, tz, 0.8 + rnd() * 0.3, 2);
            }
          if (rnd() > 0.62 && open(x - 30, z - 24, 22) && landContains(x - 30, z - 24, 44, 40)) {
            // farmyard: house, barn, a few trees
            house(x - 38, z - 24, 10, 13, 5.5, pick(BRICK), pick(ROOFS));
            shed(x - 20, z - 28, 13, 22, 5, rnd() > 0.5 ? '#3f5a4a' : '#8a4a3a');
            tree(x - 46, z - 38, 1.1);
            tree(x - 30, z - 8, 0.9);
          }
        } else if (green(l.kind)) {
          if (rnd() > 0.45) flat(64, 64, rnd() > 0.5 ? C.grass : C.grassDark, x, 4.2, z);
          if (quality.light) continue;
          // a clump of trees: parks and village greens
          const n = l.kind === 'park' || l.kind === 'island' ? 5 : 2;
          for (let i = 0; i < n; i++) {
            const tx = x + (rnd() - 0.5) * 120,
              tz = z + (rnd() - 0.5) * 120;
            if (landContains(tx, tz, 10, 10) && open(tx, tz, 4)) {
              tree(tx, tz, 0.9 + rnd() * 0.6);
              claim(tx, tz, 3);
            }
          }
        }
      }
  }
  // Water's edge. Port and city: a dark quay wall with a pale coping, bollards and
  // fenders. Polder, park and village: stone at the waterline under a grass bank.
  // Drawn 0.3 m proud of the land, so the collision edge stays where it is.
  const edges = [];
  single = quays;
  axis = 'affine'; // the wall and its coping follow the warped edge exactly
  for (const sg of shoreSegments) {
    // A real outline runs at any angle: the pieces are turned along their wall.
    const rot = sg.length ? Math.atan2(sg.nx, sg.nz) : 0,
      alongX = !!sg.length || sg.nz !== 0,
      len = sg.length || (alongX ? sg.width : sg.depth),
      kind = kindAt(sg.x - sg.nx * 3, sg.z - sg.nz * 3),
      w = (t) => (alongX ? len + 0.2 : t),
      d = (t) => (alongX ? t : len + 0.2),
      at = (o) => [sg.x + sg.nx * o, sg.z + sg.nz * o];
    edges.push({ sg, alongX, len, kind });
    if (HARD.includes(kind)) {
      let [x, z] = at(0.05);
      box(w(0.6), 7.4, d(0.6), '#4f5a63', x, 0.3, z, rot, false, 0.55);
      [x, z] = at(-0.9);
      box(w(2.6), 0.5, d(2.6), '#efe8d3', x, 4.2, z, rot);
      if (quality.light) continue;
      [x, z] = at(-1.6);
      box(0.8, 1, 0.8, C.dark, x, 4.9, z);
      [x, z] = at(0.45);
      box(alongX ? 0.7 : 0.3, 3.4, alongX ? 0.3 : 0.7, '#22292e', x, 1.6, z, rot);
    } else {
      let [x, z] = at(0.1);
      box(w(0.8), 4.6, d(0.8), '#8d8f84', x, -0.9, z, rot, false, 0.6);
      [x, z] = at(-1.6);
      box(w(3.2), 0.3, d(3.2), C.grassDark, x, 4.1, z, rot);
    }
    if (quality.light) continue;
    // A band of shade on the land behind the edge gives the quay its depth.
    const [ax, az] = at(-2.2),
      [bx, bz] = at(-9),
      hx = sg.length ? (-sg.nz * (len + 0.2)) / 2 : alongX ? len / 2 + 0.1 : 0,
      hz = sg.length ? (sg.nx * (len + 0.2)) / 2 : alongX ? 0 : len / 2 + 0.1,
      a = HARD.includes(kind) ? 0.26 : 0.16,
      quad = [ax - hx, az - hz, ax + hx, az + hz, bx + hx, bz + hz, bx - hx, bz - hz];
    // wind the quad so it faces up whichever way the shore runs
    const up =
        (quad[2] - quad[0]) * (quad[7] - quad[1]) - (quad[3] - quad[1]) * (quad[6] - quad[0]) < 0,
      order = up ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2];
    for (const i of order) {
      const p = WARP.forward(quad[i * 2], quad[i * 2 + 1]);
      shadeP.push(p.x, SHADE_Y, p.z);
      shadeC.push(0, 0, 0, i < 2 ? a : 0);
    }
  }
  single = null;
  axis = null;
  // Roads of the 2D map, on land only, with a centre line and trees along them.
  let roadStep = 0;
  for (const r of roads)
    for (let i = 0; i < r.pts.length - 1; i++) {
      const a = r.pts[i],
        b = r.pts[i + 1],
        len = Math.hypot(b.x - a.x, b.z - a.z),
        n = Math.ceil(len / 40),
        alongX = Math.abs(b.x - a.x) > Math.abs(b.z - a.z),
        wide = Math.max(8, r.width);
      for (let k = 0; k < n; k++) {
        const x = a.x + ((b.x - a.x) * (k + 0.5)) / n,
          z = a.z + ((b.z - a.z) * (k + 0.5)) / n;
        if (!landContains(x, z, alongX ? 40 : 12, alongX ? 12 : 40)) continue;
        flat(alongX ? len / n + 0.5 : wide, alongX ? wide : len / n + 0.5, C.asphalt, x, 4.5, z);
        if (quality.light) continue;
        flat(alongX ? 14 : 0.5, alongX ? 0.5 : 14, C.stripe, x, 4.56, z, 0, true);
        const side = roadStep++ % 2 ? 1 : -1,
          tx = x + (alongX ? 0 : side * (wide / 2 + 5)),
          tz = z + (alongX ? side * (wide / 2 + 5) : 0);
        if (
          landContains(tx, tz, 8, 8) &&
          free(tx, tz, 3) &&
          !landmarkClear(tx, tz, 3) &&
          !bridgeNear(tx, tz, 0)
        ) {
          tree(tx, tz, 0.9 + rnd() * 0.3);
          claim(tx, tz, 3);
        }
      }
    }
  // Life along the quays. City: a row of canal houses behind a tree-lined quay.
  // Port: transit sheds, stacks, parked lorries, light masts. Oil: pipe racks.
  if (!quality.light)
    for (const { sg, alongX, len, kind } of edges) {
      const tx = alongX ? 1 : 0,
        tz = alongX ? 0 : 1,
        rot = alongX ? 0 : Math.PI / 2,
        P = (along, back) => [sg.x + tx * along - sg.nx * back, sg.z + tz * along - sg.nz * back],
        fits = (x, z, wAlong, wBack, r) =>
          landContains(x, z, alongX ? wAlong : wBack, alongX ? wBack : wAlong) && open(x, z, r);
      // Everything along this stretch stands square to its own quay.
      axis = alongX ? 'x' : 'z';
      if (kind === 'city') {
        if (hash2(sg.x / 150 + 3, sg.z / 150 + 9) < 0.82) {
          const count = Math.max(2, Math.round(len / 7.4)),
            step = len / count;
          for (let i = 0; i < count; i++) {
            const deep = 11 + rnd() * 3,
              [x, z] = P(-len / 2 + (i + 0.5) * step, 12.5 + deep / 2),
              h = 9.5 + Math.floor(rnd() * 3) * 3.1 + rnd() * 1.5;
            if (!fits(x, z, step, deep + 4, 3.2)) continue;
            house(
              x,
              z,
              step - 0.25,
              deep,
              h,
              rnd() > 0.3 ? pick(BRICK) : pick(PLASTER),
              pick(ROOFS),
              rot,
              3,
              4.2,
              false,
            );
            claim(x, z, 3.6);
          }
        }
        for (const along of [-len / 4, len / 4]) {
          const [x, z] = P(along + rnd() * 3, 6.5);
          if (rnd() > 0.3 && fits(x, z, 5, 5, 2.4)) {
            tree(x, z, 0.8 + rnd() * 0.25);
            claim(x, z, 2.4);
          }
        }
      } else if (kind === 'port' || kind === 'containers') {
        const what = rnd();
        if (what < 0.2) {
          const [x, z] = P(0, 30);
          if (fits(x, z, len, 20, 15))
            shed(x, z, 16, len - 3, 8 + rnd() * 3, pick(SHED), rot + Math.PI / 2);
        } else if (what < 0.4) {
          for (let i = 0; i < 2; i++) {
            const [x, z] = P(-7 + i * 14, 24 + rnd() * 4);
            if (!fits(x, z, 13, 7, 7)) continue;
            const levels = 1 + Math.floor(rnd() * 3);
            for (let k = 0; k < levels; k++)
              box(12.2, 2.9, 5.8, pick(palette), x, 5.55 + k * 3, z, rot, false, 0.82);
            skirt(x, z, 12.2, 5.8, rot, 2.5, 0.3);
            claim(x, z, 7);
          }
        } else if (what < 0.52) {
          const [x, z] = P(rnd() * 8 - 4, 18);
          if (fits(x, z, 14, 5, 6)) {
            truckParts(x, z, rot + Math.PI / 2, pick(palette));
            claim(x, z, 6);
          }
        } else if (what < 0.64) {
          const [x, z] = P(0, 13);
          if (fits(x, z, 2, 2, 1.5)) {
            box(0.5, 22, 0.5, C.steel, x, 15, z, 0, true);
            box(3, 0.6, 1.2, C.cream, x, 26.2, z, rot, true);
          }
        }
      } else if (kind === 'tanks') {
        const [x, z] = P(0, 11);
        if (hash2(sg.x / 240 + 5, sg.z / 240) < 0.7 && fits(x, z, len, 5, 3)) {
          for (const [off, y, col] of [
            [-0.9, 7.6, '#d8d2bd'],
            [0.9, 7.6, C.gold],
            [0, 8.6, '#9fb3b8'],
          ]) {
            const [px, pz] = P(0, 11 + off);
            box(alongX ? len + 0.3 : 0.7, 0.7, alongX ? 0.7 : len + 0.3, col, px, y, pz, 0, true);
          }
          box(alongX ? 0.5 : 3.4, 3.4, alongX ? 3.4 : 0.5, C.steel, x, 5.7, z, 0, true);
        }
      }
    }
  axis = null;
  // What is still bare after all that gets something to look at: a small park in
  // town, a shed, a stack or a row of lorries on the port apron.
  if (!quality.light)
    for (const f of footprints) {
      const { x, z } = f;
      if (f.kind === 'city' && open(x, z, 36)) {
        flat(58, 58, rnd() > 0.5 ? C.grass : '#8fc468', x, 4.2, z);
        flat(58, 3, '#dccfae', x, 4.26, z, 0.785, true);
        for (let i = 0; i < 7; i++) {
          const a = i * 0.9 + rnd(),
            tx = x + Math.cos(a) * (14 + rnd() * 12),
            tz = z + Math.sin(a) * (14 + rnd() * 12);
          tree(tx, tz, 0.9 + rnd() * 0.5);
        }
        claim(x, z, 30);
      } else if ((f.kind === 'town' || f.kind === 'town2') && rnd() < 0.5 && open(x, z, 30)) {
        // a few houses round a green: the village fills in
        flat(46, 40, '#8fc468', x, 4.2, z);
        for (const [dx, dz] of [
          [-14, -11],
          [14, -11],
          [0, 12],
        ])
          house(
            x + dx,
            z + dz,
            9 + rnd() * 3,
            10 + rnd() * 2,
            5.6 + rnd() * 1.6,
            rnd() > 0.45 ? pick(BRICK) : pick(PLASTER),
            pick(ROOFS),
            rnd() > 0.5 ? 0 : Math.PI / 2,
          );
        tree(x + 18, z + 10, 0.9 + rnd() * 0.4);
        claim(x, z, 26);
      } else if (f.kind === 'tanks' && rnd() < 0.55 && open(x, z, 30)) {
        // a small tank pit of its own
        for (const [dx, dz, r] of [
          [-11, -8, 8],
          [10, -9, 6.5],
          [1, 11, 7.5],
        ]) {
          const h = 8 + r * 0.6;
          shape(tankGeo, pick(tankShell), x + dx, 4 + h / 2, z + dz, r, h, r, 0, false, 0.7);
          shape(coneGeo, '#fbf9f1', x + dx, 4.7 + h, z + dz, r, 1.4, r);
          skirtRound(x + dx, z + dz, r, 5, 0.36);
        }
        claim(x, z, 26);
      } else if ((f.kind === 'port' || f.kind === 'containers') && open(x, z, 34)) {
        const what = rnd();
        if (what < 0.4)
          shed(x, z, 26, 46, 9 + rnd() * 4, pick(SHED), rnd() > 0.5 ? 0 : Math.PI / 2);
        else if (what < 0.75) {
          for (let i = 0; i < 3; i++)
            for (let j = 0; j < 2; j++) {
              const cx = x - 14 + i * 14,
                cz = z - 5 + j * 10,
                levels = 1 + Math.floor(rnd() * 3);
              for (let k = 0; k < levels; k++)
                box(12.2, 2.9, 5.8, pick(palette), cx, 5.55 + k * 3, cz, 0, false, 0.82);
            }
          skirt(x, z, 42, 18, 0, 3, 0.3);
        } else for (let i = 0; i < 4; i++) truckParts(x - 9 + i * 6, z, 0, pick(palette));
        claim(x, z, 30);
      }
    }
  // Beyond the chart: the polder runs on to the horizon, with hedgerows, farms and
  // the odd village, so the harbour does not end in open sea on every side.
  {
    single = beyond;
    const FAR = 2600,
      HW = MAP.halfWidth,
      pieces = [];
    for (const l of land) {
      if (l.kind === 'pillar') continue;
      const N = l.z1 >= MAP.zMax - 1,
        S = l.z0 <= MAP.zMin + 1,
        W = l.x0 <= -HW + 1,
        E = l.x1 >= HW - 1,
        xa = W ? -HW - FAR : l.x0,
        xb = E ? HW + FAR : l.x1,
        hard = HARD.includes(l.kind);
      if (N) pieces.push([xa, xb, Math.max(MAP.zMax, l.z1), MAP.zMax + FAR, hard]);
      if (S) pieces.push([xa, xb, MAP.zMin - FAR, Math.min(MAP.zMin, l.z0), hard]);
      if (W)
        pieces.push([
          -HW - FAR,
          Math.min(-HW, l.x0),
          Math.max(MAP.zMin, l.z0),
          Math.min(MAP.zMax, l.z1),
          hard,
        ]);
      if (E)
        pieces.push([
          Math.max(HW, l.x1),
          HW + FAR,
          Math.max(MAP.zMin, l.z0),
          Math.min(MAP.zMax, l.z1),
          hard,
        ]);
    }
    const GX = 420,
      GZ = 300,
      Y = 3.7; // just under the land of the chart, which it runs in beneath
    // A parcel as two triangles between its four warped corners (neighbours share
    // them, so the polder has no cracks), with a bank where the piece ends.
    const parcel = (ax, bx, az, bz, col, piece) => {
      const p = [
        [ax, az],
        [bx, az],
        [bx, bz],
        [ax, bz],
      ].map(([x, z]) => WARP.forward(x, z));
      beyond.addTriangles(
        [0, 3, 1, 1, 3, 2].flatMap((i) => [p[i].x, Y, p[i].z]),
        [0, 1, 0],
        col,
      );
      const [x0, x1, z0, z1] = piece;
      for (const [i, j, edge] of [
        [0, 1, az <= z0],
        [1, 2, bx >= x1],
        [2, 3, bz >= z1],
        [3, 0, ax <= x0],
      ]) {
        if (!edge) continue;
        const a = p[i],
          b = p[j],
          len = Math.hypot(b.x - a.x, b.z - a.z) || 1;
        beyond.addTriangles(
          [a.x, Y, a.z, b.x, Y, b.z, a.x, -3, a.z, b.x, Y, b.z, b.x, -3, b.z, a.x, -3, a.z],
          [(b.z - a.z) / len, 0, -(b.x - a.x) / len],
          '#6f9a58',
        );
      }
      stats.parts++;
    };
    for (const piece of pieces) {
      // Each piece runs 40 m in under the land it continues.
      const hard = piece[4],
        x0 = piece[0] <= -HW - FAR ? piece[0] : piece[0] >= HW ? piece[0] - 40 : piece[0],
        x1 = piece[1] >= HW + FAR ? piece[1] : piece[1] <= -HW ? piece[1] + 40 : piece[1],
        z0 = piece[2] >= MAP.zMax ? piece[2] - 40 : piece[2],
        z1 = piece[3] <= MAP.zMin ? piece[3] + 40 : piece[3];
      if (x1 - x0 < 2 || z1 - z0 < 2) continue;
      for (let gx = Math.floor(x0 / GX); gx * GX < x1; gx++)
        for (let gz = Math.floor(z0 / GZ); gz * GZ < z1; gz++) {
          const ax = Math.max(x0, gx * GX),
            bx = Math.min(x1, (gx + 1) * GX),
            az = Math.max(z0, gz * GZ),
            bz = Math.min(z1, (gz + 1) * GZ),
            h = hash2(gx, gz),
            cx = (ax + bx) / 2,
            cz = (az + bz) / 2,
            out = Math.max(Math.abs(cx) - HW, cz - MAP.zMax, MAP.zMin - cz);
          parcel(ax, bx, az, bz, fields[Math.floor(h * fields.length)], [x0, x1, z0, z1]);
          if (quality.light || bx - ax < 200 || bz - az < 160 || out > 1500) continue;
          const h2 = hash2(gx + 71, gz + 13);
          if (h2 < 0.55) {
            // hedgerow or a line of poplars along the parcel
            const along = h2 < 0.28,
              lenH = 140 + h * 180;
            shape(
              leafGeo,
              C.leafDark,
              cx,
              9,
              az + 20,
              along ? lenH / 2 : 9,
              9,
              along ? 9 : 60,
              0,
              false,
              0.6,
            );
            shape(
              leafGeo,
              C.leaf,
              cx + 40,
              10,
              az + 26,
              along ? lenH / 3 : 8,
              10,
              along ? 8 : 40,
              0,
              false,
              0.6,
            );
          }
          if (hard ? h2 > 0.5 : h2 > 0.88) {
            // a village, or the town running on behind the port
            const n = hard ? 9 : 6;
            for (let i = 0; i < n; i++) {
              const hx = cx + (hash2(gx * 7 + i, gz) - 0.5) * 300,
                hz = cz + (hash2(gx, gz * 7 + i) - 0.5) * 200,
                hh = hard ? 10 + hash2(gx + i, gz - i) * 26 : 6;
              if (hard)
                box(16, hh, 14, pick(PLASTER), hx, 4 + hh / 2, hz, 0, false, 0.7, {
                  bay: 3,
                  floor: 3.1,
                  s: 1.5,
                });
              else {
                box(10, hh, 12, pick(BRICK), hx, 4 + hh / 2, hz, 0, false, 0.75);
                shape(roofGeo, C.roof, hx, 4 + hh, hz, 10.6, 4.4, 12.6);
                shape(gableGeo, '#b5553b', hx, 4 + hh, hz, 10, 4.4, 12);
              }
            }
            if (!hard) {
              box(7, 24, 7, '#b9a184', cx, 16, cz, 0, false, 0.75);
              shape(spireGeo, C.slate, cx, 37, cz, 5.4, 18, 5.4, 0.785);
            }
          } else if (h2 > 0.7) {
            box(11, 5.5, 14, pick(BRICK), cx - 60, 6.75, cz + 30, 0, false, 0.75);
            shape(roofGeo, C.roof, cx - 60, 9.5, cz + 30, 11.6, 4.6, 14.6);
            box(14, 5, 24, '#3f5a4a', cx - 40, 6.5, cz + 36, 0, false, 0.75);
            shape(roofGeo, C.slate, cx - 40, 9, cz + 36, 14.8, 2.6, 24.8);
          }
        }
    }
    single = null;
  }
  // Fixed bridges: high deck across the water; the pillars collide. Each named
  // bridge gets the silhouette you know it by.
  for (const br of bridges) {
    if (br.ax !== undefined) {
      realBridge(br);
      continue;
    }
    const span = br.z1 - br.z0,
      zc = (br.z0 + br.z1) / 2,
      x = br.x,
      name = br.name || '',
      lift = /Hef/.test(name);
    // One rigid bridge, straight across where it stands on the map.
    frame = WARP.identity ? null : makeFrame(x, zc, 'z');
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
        emit(boxGeo, C.asphalt, x, (za + zb) / 2, false, 1, null);
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
    if (/Erasmus/.test(name) && br.pylon !== null && !frame && swan([x, -2, br.pylon], [0, 0, 1])) {
      // the Blender pylon stands (swan); on a warped map the built one bends along
    } else if (/Erasmus/.test(name) && br.pylon !== null) {
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
        if (!frame && pylon('willemsbrug', [x, 4, p], [0, 0, 1])) continue;
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
    frame = null;
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
  for (const [batch, name] of [
    [quays, 'quay-walls'],
    [beyond, 'hinterland'],
  ]) {
    if (!batch.positions.length) continue;
    const m = new T.Mesh(batch.geometry(), material);
    m.name = name;
    m.receiveShadow = true;
    root.add(m);
    stats.triangles += batch.positions.length / 9;
    stats.draws++;
  }
  if (shadeP.length) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(shadeP, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(shadeC, 4));
    g.computeBoundingSphere();
    const m = new T.Mesh(
      g,
      new T.MeshBasicMaterial({
        color: '#16242e',
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        side: T.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -8,
      }),
    );
    m.name = 'ground-shade';
    m.renderOrder = 1;
    root.add(m);
    stats.triangles += shadeP.length / 9;
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
    [fullBox, C.dark, 0, 1.05, 0, 2.8, 1.2, 13],
    [fullBox, C.cream, 0, 2.4, -4.8, 2.9, 2.8, 3.6],
    [fullBox, C.glass, 0, 3, -6.65, 2.5, 1.2, 0.1],
    [fullBox, C.red, 0, 2.8, 1.8, 3, 3.3, 9],
    [fullBox, C.dark, 0, 0.7, -4.4, 3.2, 1.4, 1.3],
    [fullBox, C.dark, 0, 0.7, 4.6, 3.2, 1.4, 1.3],
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
    [fullBox, C.gold, 0, 0, 0, 5, 1, 2],
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
    .map((b) => WARP.forward((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2));
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
          Math.hypot(tile.x - camera.position.x, tile.z - camera.position.z) < limit + tile.reach;
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
  // Lit windows follow the dusk: 0 by day, 1 in the dead of night.
  const setNight = (v) => (night.value = v);
  return { root, stats, footprints, routes, tiles, update, setNight };
}
