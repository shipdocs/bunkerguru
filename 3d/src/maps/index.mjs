import { buildClassic } from './classic-map.mjs';
import { buildReal, inObb, inPoly } from './real-map.mjs';
import amsterdam from './classic/amsterdam.mjs';
import rotterdam from './real/rotterdam.mjs';
import europoort from './classic/europoort.mjs';
import antwerpen from './classic/antwerpen.mjs';
import training from './classic/training.mjs';

// All maps of the 2D game. One map is active per page load; switching map reloads
// the page (?map=id), so every module can treat the geometry as static.
const DEFS = { europoort, rotterdam, amsterdam, antwerpen, training };
export const MAP_KEY = 'bunkerguru3d-map';
export const MAP_LIST = Object.values(DEFS).map((d) => ({
  id: d.id,
  name: d.name,
  icon: d.icon,
  desc: d.desc,
}));
export function selectedMapId() {
  let id = globalThis.BUNKERGURU_MAP || globalThis.process?.env?.BUNKERGURU_MAP || null; // tests and tools
  if (!DEFS[id])
    try {
      id = new URLSearchParams(globalThis.location?.search || '').get('map');
    } catch {}
  if (!DEFS[id])
    try {
      id = globalThis.localStorage?.getItem(MAP_KEY);
    } catch {}
  if (DEFS[id]) return id;
  // New players start with the practice voyage, as in the 2D game.
  let known = false;
  try {
    known = !!globalThis.localStorage?.getItem('bunkerguru3d-v1');
  } catch {}
  return known || !globalThis.document ? 'amsterdam' : 'training';
}
// Maps with a real outline (def.water) are built on it; the others from the 2D map.
const DEF = DEFS[selectedMapId()];
export const MAP = DEF.water ? buildReal(DEF) : buildClassic(DEF);
// The outline of a real map (maps/shape.mjs), or null on a map of rectangles.
export const SHAPE = MAP.shape || null;
export const {
  land,
  basins,
  terminals,
  waits,
  customers,
  gates,
  bridges,
  channels,
  labels,
  roads,
  decor,
} = MAP;
// Ships that lie there for good (a real map's cruise ship and hotel ship).
export const liners = MAP.liners || [];

// Two frames (see warp.mjs). The MAP is the straight 2D chart: land rectangles, zones,
// lanes and routes are defined and planned there (…M functions, m-prefixed fields).
// The WORLD is what you see and sail in: the map warped into bends and leaning
// basins. The functions without M take world coordinates and look them up on the map.
export const WARP = MAP.warp;
export const toMap = (x, z) => WARP.inverse(x, z);
export const toWorld = (x, z) => WARP.forward(x, z);
export function landAtM(x, z, margin = 0) {
  if (SHAPE) return SHAPE.land(x, z, margin);
  return land.some(
    (l) => x > l.x0 - margin && x < l.x1 + margin && z > l.z0 - margin && z < l.z1 + margin,
  );
}
export function waterAtM(x, z, margin = 0) {
  if (SHAPE) return SHAPE.water(x, z, margin);
  return (
    x > -MAP.halfWidth + margin &&
    x < MAP.halfWidth - margin &&
    z > MAP.zMin + margin &&
    z < MAP.zMax - margin &&
    !landAtM(x, z, margin)
  );
}
export function landAt(x, z, margin = 0) {
  const m = WARP.inverse(x, z);
  return landAtM(m.x, m.z, margin);
}
export function waterAt(x, z, margin = 0) {
  const m = WARP.inverse(x, z);
  return waterAtM(m.x, m.z, margin);
}
// Map rectangles in the warped world. Their edges are cut on one grid shared by the
// whole map (so neighbours meet without cracks): every 60 m, 15 cm off a 3 km bend at
// most, and every 15 m just behind the banks, where a basin swings to its lean. On a
// straight map a rectangle keeps its four corners.
export function gridLines(a0, a1, axis = 'x') {
  const out = [a0];
  if (!WARP.identity) {
    const RH = MAP.riverHalf,
      add = (v) => v > a0 + 0.01 && v < a1 - 0.01 && out.push(v);
    for (let v = Math.ceil(a0 / 60) * 60; v < a1; v += 60) add(v);
    if (axis === 'z')
      for (const side of [-1, 1]) for (const d of [0, 15, 30, 45]) add(side * (RH + d));
  }
  out.push(a1);
  return [...new Set(out)].sort((a, b) => a - b);
}
// World points round a map rectangle: (x0,z0) → (x1,z0) → (x1,z1) → (x0,z1).
export function rectOutline(r) {
  const xs = gridLines(r.x0, r.x1, 'x'),
    zs = gridLines(r.z0, r.z1, 'z'),
    at = (x, z) => WARP.forward(x, z);
  return [
    ...xs.slice(0, -1).map((x) => at(x, r.z0)),
    ...zs.slice(0, -1).map((z) => at(r.x1, z)),
    ...xs
      .slice(1)
      .reverse()
      .map((x) => at(x, r.z1)),
    ...zs
      .slice(1)
      .reverse()
      .map((z) => at(r.x0, z)),
  ];
}
// Which quay gives a spot on land its direction: 'x' along the river, 'z' along a
// basin quay, by the nearest water's edge of the land it stands on (map coordinates).
export function quayAxis(x, z) {
  if (SHAPE) return 'x';
  const l = land.find(
    (l) => l.kind !== 'pillar' && x >= l.x0 && x <= l.x1 && z >= l.z0 && z <= l.z1,
  );
  if (!l) return 'x';
  let best = 'x',
    d0 = 400;
  for (const [d, ax, px, pz] of [
    [z - l.z0, 'x', x, l.z0 - 3],
    [l.z1 - z, 'x', x, l.z1 + 3],
    [x - l.x0, 'z', l.x0 - 3, z],
    [l.x1 - x, 'z', l.x1 + 3, z],
  ])
    if (d < d0 && waterAtM(px, pz)) [best, d0] = [ax, d];
  return best;
}
// The chart as it lies in the world: the box round the warped map.
export const worldBounds = (() => {
  const b = { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity },
    W = MAP.halfWidth,
    see = (x, z) => {
      const p = WARP.forward(x, z);
      b.x0 = Math.min(b.x0, p.x);
      b.x1 = Math.max(b.x1, p.x);
      b.z0 = Math.min(b.z0, p.z);
      b.z1 = Math.max(b.z1, p.z);
    };
  for (let i = 0; i <= 200; i++) {
    const x = -W + (2 * W * i) / 200,
      z = MAP.zMin + ((MAP.zMax - MAP.zMin) * i) / 200;
    for (const zz of [MAP.zMin, MAP.zMax]) see(x, zz);
    for (const xx of [-W, W]) see(xx, z);
  }
  return b;
})();
// Is a world point inside a map rectangle (zone, strip, gate, basin)?
export const inRectW = (r, x, z, m = 0) => {
  if (r.obb) return inObb(r.obb, x, z, m);
  if (r.poly) return inPoly(r.poly, x, z);
  const p = WARP.inverse(x, z);
  return p.x > r.x0 - m && p.x < r.x1 + m && p.z > r.z0 - m && p.z < r.z1 + m;
};
// The nearest quay to a world point: the spot on the wall (world) and the clear
// distance to it, measured square to the warped wall. rects: map rectangles.
export function nearestQuay(x, z, rects = land) {
  if (SHAPE && rects === land) {
    const w = SHAPE.wall(x, z, 600);
    return w && { x: w.qx, z: w.qz, d: w.wet ? w.d : 0 };
  }
  const m = WARP.inverse(x, z);
  let best = null;
  for (const l of rects) {
    const qx = Math.max(l.x0, Math.min(l.x1, m.x)),
      qz = Math.max(l.z0, Math.min(l.z1, m.z)),
      d = Math.hypot(qx - m.x, qz - m.z);
    if (!best || d < best.d) best = { qx, qz, d };
  }
  if (!best) return null;
  const q = WARP.forward(best.qx, best.qz),
    face = (best.qx !== m.x) !== (best.qz !== m.z);
  return {
    x: q.x,
    z: q.z,
    d: face
      ? best.d /
        WARP.normal(best.qx, best.qz, Math.sign(m.x - best.qx), Math.sign(m.z - best.qz)).scale
      : Math.hypot(q.x - x, q.z - z),
  };
}
// Where a boat lies against the quay of a terminal or waiting place: half a beam plus
// a fender off the wall, `along` metres from the middle. Map pose; worldPose() warps it.
export function stripSpot(t, along = 0) {
  if (t.away) {
    const off = t.width / 2 - 7;
    return {
      x: t.mx - t.away.x * off + t.tx * along,
      z: t.mz - t.away.z * off + t.tz * along,
      h: t.mh,
    };
  }
  const off = t.wall * ((t.alongZ ? t.x1 - t.x0 : t.z1 - t.z0) / 2 - 7);
  return {
    x: t.alongZ ? t.mx + off : t.mx + along,
    z: t.alongZ ? t.mz + along : t.mz + off,
    h: t.mh,
  };
}
export const worldPose = (p) => WARP.poseForward(p);
export const mapPose = (p) => WARP.poseInverse(p);
// Movers that sail on the map (traffic, rivals, own fleet) publish where they are in
// the world after every update: wx, wz, wh. Rendering, the chart and the player's
// collisions read those.
export function publishPose(o) {
  const w = WARP.forward(o.x, o.z);
  o.wx = w.x;
  o.wz = w.z;
  o.wh = WARP.heading(o.x, o.z, o.h);
  return o;
}
export const inRect = (r, x, z, m = 0) =>
  x > r.x0 - m && x < r.x1 + m && z > r.z0 - m && z < r.z1 + m;

// Quay edges facing water, in 30 m pieces, for rendering and mooring lines.
export const shoreSegments = SHAPE
  ? SHAPE.segments(30).map((g) => ({
      ...g,
      width: Math.abs(g.nz) * g.length || 2,
      depth: Math.abs(g.nx) * g.length || 2,
    }))
  : [];
for (const l of land) {
  if (l.kind === 'pillar') continue;
  for (const [x0, z0, x1, z1, nx, nz] of [
    [l.x0, l.z0, l.x1, l.z0, 0, -1],
    [l.x1, l.z0, l.x1, l.z1, 1, 0],
    [l.x1, l.z1, l.x0, l.z1, 0, 1],
    [l.x0, l.z1, l.x0, l.z0, -1, 0],
  ]) {
    const length = Math.hypot(x1 - x0, z1 - z0),
      count = Math.ceil(length / 30);
    for (let i = 0; i < count; i++) {
      const a = i / count,
        b = (i + 1) / count,
        x = x0 + ((x1 - x0) * (a + b)) / 2,
        z = z0 + ((z1 - z0) * (a + b)) / 2;
      if (waterAtM(x + nx * 2, z + nz * 2))
        shoreSegments.push({
          x,
          z,
          width: Math.abs(x1 - x0) / count || 2,
          depth: Math.abs(z1 - z0) / count || 2,
          nx,
          nz,
        });
    }
  }
}

// Water velocity (m/s, world frame) as in engine.js currentAt: stronger mid-river,
// slower along the banks, eddies before harbour mouths, side channels with their
// own flow. speed > 0 = ebb (towards the sea, −x), < 0 = flood.
export function currentAt(x, z, speed) {
  if (MAP.river) return riverCurrent(x, z, speed);
  if (WARP.identity) return currentAtM(x, z, speed);
  // The water follows the bends: same strength, turned along the warped river.
  const m = WARP.inverse(x, z),
    c = currentAtM(m.x, m.z, speed),
    sp = Math.hypot(c.x, c.z);
  if (!sp) return c;
  const t = WARP.tangent(m.x, m.z, c.x, c.z),
    k = sp / Math.hypot(t.x, t.z);
  return { x: t.x * k, z: t.z * k };
}
// A real river: the water runs along the fairway (seawards on the ebb), strongest in
// the middle, slack along the banks, still inside the basins.
function riverCurrent(x, z, speed) {
  const q = MAP.river.near(x, z);
  if (!q) return { x: 0, z: 0 };
  const half = MAP.riverHalfAt(q.s),
    r = Math.abs(q.n) / half;
  if (r >= 1.6 || !SHAPE.inside(x, z) || basins.some((b) => b.poly && inBasin(b, x, z)))
    return { x: 0, z: 0 };
  // Beyond the fairway the stream dies out over 60 % of its half width, not in a step:
  // a harbour mouth is a gentle shear, not a wall of water.
  const f = r < 1 ? 1 - Math.pow(r, 2.5) * 0.7 : (0.3 * (1.6 - r)) / 0.6,
    p = MAP.river.at(q.s);
  // speed > 0 = ebb, towards the sea: against the direction of the fairway (west → east).
  return { x: -p.tx * speed * f, z: -p.tz * speed * f };
}
export function currentAtM(x, z, speed) {
  if (MAP.river) return riverCurrent(x, z, speed);
  const RH = MAP.riverHalf;
  if (Math.abs(z) < RH && Math.abs(x) < MAP.halfWidth) {
    let f = 1 - Math.pow(Math.abs(z) / RH, 2.5) * 0.7,
      cross = 0;
    for (const b of basins) {
      if (x < b.x0 - 20 || x > b.x1 + 20) continue;
      const side = b.z0 >= RH - 1 ? 1 : b.z1 <= -RH + 1 ? -1 : 0;
      if (!side || Math.sign(z) !== side) continue;
      const depth = (Math.abs(z) - (RH - 85)) / 85;
      if (depth <= 0) continue;
      const u = (x - b.x0 + 20) / (b.x1 - b.x0 + 40);
      const dir = speed >= 0 ? -1 : 1;
      // Eddy before the mouth: half the 2D strength (felt too strong from the deck).
      cross += side * Math.sin(u * Math.PI) * -dir * (u < 0.5 ? 1 : -1) * 0.175 * depth;
      f -= 0.3 * depth * Math.sin(u * Math.PI);
    }
    return { x: -speed * f, z: Math.abs(speed) * cross };
  }
  for (const c of channels)
    if (inRect(c, x, z)) {
      const k = MAP.current.tide ? speed / MAP.current.tide.ebbMax : CURRENT_FEEL;
      return { x: c.cs * k, z: c.cn * k };
    }
  return { x: 0, z: 0 };
}

// Tide as in engine.js: period in 2D real seconds; the 2D game ran three simulated
// seconds per real second, so one cycle lasts period × 3 simulated seconds here.
// CURRENT_FEEL: the 2D maps carry arcade stream speeds (up to 4 m/s on the Waterweg).
// Seen from the deck in 3D that is too much: leaving a harbour the bow is swept away
// before the rudder bites. Half of it gives 1.5–2 m/s at the peak, close to the real
// rivers. One factor for river, eddies and side channels; the hull model is untouched.
export const CURRENT_FEEL = 0.5;
export function tideSpeed(clock, phase = 0) {
  const td = MAP.current.tide;
  if (!td) return MAP.current.base * CURRENT_FEEL;
  const f = Math.sin((clock * Math.PI * 2) / (td.period * 3) + phase);
  return (f >= 0 ? td.ebbMax * Math.pow(f, 0.8) : -td.floodMax * Math.pow(-f, 0.8)) * CURRENT_FEEL;
}
export function tideState(clock, phase = 0) {
  const td = MAP.current.tide;
  const v = tideSpeed(clock, phase);
  if (!td) return { speed: v, label: 'stroom ' + v.toFixed(1).replace('.', ',') + ' m/s naar zee' };
  const a = (clock * Math.PI * 2) / (td.period * 3) + phase,
    rising = Math.cos(a) > 0;
  return {
    speed: v,
    ebb: v >= 0,
    label:
      (v >= 0 ? 'EB' : 'VLOED') +
      ' ' +
      Math.abs(v).toFixed(1).replace('.', ',') +
      ' m/s ' +
      (Math.sin(a) >= 0 === rising ? '▲' : '▼') +
      ' · ' +
      (Math.cos(a) >= 0 ? '+' : '−') +
      Math.abs(1.2 * Math.cos(a))
        .toFixed(1)
        .replace('.', ',') +
      ' m ' +
      // Level = cos(a): rising while sin(a) < 0 (the ▲/▼ before is the current).
      (Math.sin(a) < 0 ? '↗' : '↘'),
  };
}
// Water level in metres around mean: +amp at high water (start of ebb), −amp at low.
export function tideLevel(clock, phase = 0, amp = 1.2) {
  const td = MAP.current.tide;
  if (!td) return 0;
  return amp * Math.cos((clock * Math.PI * 2) / (td.period * 3) + phase);
}
// Next high water (start of ebb) after simulated time t, or null without tide.
export function nextHighWater(t, phase = 0) {
  const td = MAP.current.tide;
  if (!td) return null;
  const P = td.period * 3,
    off = (phase * P) / (2 * Math.PI);
  return Math.ceil((t + off) / P) * P - off;
}

// Route advice over water (A* on a 24 m grid, then shortened), as navigation.js.
const CELL = 24;
const cols = Math.ceil((MAP.halfWidth * 2) / CELL),
  rows = Math.ceil((MAP.zMax - MAP.zMin) / CELL);
const point = (id) => ({
  x: -MAP.halfWidth + ((id % cols) + 0.5) * CELL,
  z: MAP.zMin + (Math.floor(id / cols) + 0.5) * CELL,
});
const shipRects = customers.map((b) =>
  b.zone?.obb
    ? {
        ...b.zone,
        obb: { cx: b.shipX, cz: b.shipZ, tx: b.tx, tz: b.tz, hl: b.length / 2, hw: b.beam / 2 },
      }
    : b.alongX
      ? {
          x0: b.shipMX - b.length / 2,
          x1: b.shipMX + b.length / 2,
          z0: b.shipMZ - 14,
          z1: b.shipMZ + 14,
        }
      : {
          x0: b.shipMX - 14,
          x1: b.shipMX + 14,
          z0: b.shipMZ - b.length / 2,
          z1: b.shipMZ + b.length / 2,
        },
);
const free = new Map();
function open(x, z, m) {
  return (
    waterAtM(x, z, m) &&
    !shipRects.some((r) => (r.obb ? inObb(r.obb, x, z, m) : inRect(r, x, z, m)))
  );
}
function clearLine(a, b, m) {
  const d = Math.hypot(b.x - a.x, b.z - a.z),
    n = Math.max(1, Math.ceil(d / 8));
  for (let i = 0; i <= n; i++)
    if (!open(a.x + ((b.x - a.x) * i) / n, a.z + ((b.z - a.z) * i) / n, m)) return false;
  return true;
}
// A map route as world points: straight map legs become gentle curves, so they are
// cut into pieces of at most 40 m. The ends are the caller's own world points.
export function routeToWorld(pts, start, goal) {
  const out = [start || WARP.forward(pts[0].x, pts[0].z)];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1],
      b = pts[i],
      n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 40));
    for (let k = 1; k <= n; k++)
      out.push(
        goal && i === pts.length - 1 && k === n
          ? goal
          : WARP.forward(a.x + ((b.x - a.x) * k) / n, a.z + ((b.z - a.z) * k) / n),
      );
  }
  return out;
}
// World points in, world points out; planned on the map.
export function waterRoute(start, goal, margin = 10) {
  const a = WARP.inverse(start.x, start.z),
    b = WARP.inverse(goal.x, goal.z);
  return routeToWorld(waterRouteM(a, b, margin), start, goal);
}
export function waterRouteM(start, goal, margin = 10) {
  const ends = (p) => clearLine(p, p, 0);
  const clear = (a, b) => clearLine(a, b, margin);
  if (clearLine(start, goal, margin)) return [start, goal];
  const pass = (id) => {
    const key = id + ':' + margin; // clearance differs per caller
    if (!free.has(key)) {
      const p = point(id);
      free.set(key, open(p.x, p.z, margin));
    }
    return free.get(key);
  };
  const nearest = (p) => {
    const cx = Math.floor((p.x + MAP.halfWidth) / CELL),
      cz = Math.floor((p.z - MAP.zMin) / CELL);
    let best = -1,
      dist = Infinity;
    for (let dz = -5; dz <= 5; dz++)
      for (let dx = -5; dx <= 5; dx++) {
        const x = cx + dx,
          z = cz + dz;
        if (x < 0 || z < 0 || x >= cols || z >= rows) continue;
        const id = z * cols + x,
          q = point(id),
          d = Math.hypot(q.x - p.x, q.z - p.z);
        if (d < dist && pass(id) && clearLine(p, q, 0)) {
          best = id;
          dist = d;
        }
      }
    return best;
  };
  void ends;
  const first = nearest(start),
    last = nearest(goal);
  if (first < 0 || last < 0) return [start, goal];
  const cost = new Map([[first, 0]]),
    parent = new Map(),
    closed = new Set(),
    heap = [];
  const hh = (id) => Math.hypot(point(id).x - point(last).x, point(id).z - point(last).z);
  const push = (item) => {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const j = (i - 1) >> 1;
      if (heap[j].f <= item.f) break;
      heap[i] = heap[j];
      i = j;
    }
    heap[i] = item;
  };
  const pop = () => {
    const result = heap[0],
      tail = heap.pop();
    if (heap.length) {
      let i = 0;
      while (i * 2 + 1 < heap.length) {
        let j = i * 2 + 1;
        if (j + 1 < heap.length && heap[j + 1].f < heap[j].f) j++;
        if (heap[j].f >= tail.f) break;
        heap[i] = heap[j];
        i = j;
      }
      heap[i] = tail;
    }
    return result.id;
  };
  push({ id: first, f: hh(first) });
  while (heap.length) {
    const id = pop();
    if (closed.has(id)) continue;
    if (id === last) {
      const path = [goal];
      for (let at = last; at !== undefined; at = parent.get(at)) path.push(point(at));
      path.push(start);
      path.reverse();
      const out = [start];
      let i = 0;
      while (i < path.length - 1) {
        let j = path.length - 1;
        while (j > i + 1 && !clear(path[i], path[j])) j--;
        out.push(path[j]);
        i = j;
      }
      return out;
    }
    closed.add(id);
    const x = id % cols,
      z = Math.floor(id / cols);
    for (let dz = -1; dz <= 1; dz++)
      for (let dx = -1; dx <= 1; dx++) {
        if ((!dx && !dz) || x + dx < 0 || z + dz < 0 || x + dx >= cols || z + dz >= rows) continue;
        const next = (z + dz) * cols + x + dx;
        if (closed.has(next) || !pass(next)) continue;
        const g = cost.get(id) + Math.hypot(dx, dz) * CELL;
        if (g < (cost.get(next) ?? Infinity)) {
          cost.set(next, g);
          parent.set(next, id);
          push({ id: next, f: g + hh(next) });
        }
      }
  }
  return [start, goal];
}

// Along the river: station s (metres from the sea end) and n across it (+ = to the right
// going upstream), and back. On a map of rectangles these are the map's own x and z.
export function riverFrame(x, z) {
  if (MAP.river) {
    const q = MAP.river.near(x, z);
    return { s: q.s - MAP.river.length / 2, n: q.n };
  }
  const m = WARP.inverse(x, z);
  return { s: m.x, n: m.z };
}
export function riverAt(s, n = 0) {
  if (MAP.river) {
    const p = MAP.river.at(s + MAP.river.length / 2);
    return { x: p.x - p.tz * n, z: p.z + p.tx * n, h: p.h };
  }
  return { ...WARP.forward(s, n), h: WARP.heading(s, n, Math.PI / 2) };
}
// Half the river's length along its course (= halfWidth on a map of rectangles), and
// its half width at a station.
export const riverSpan = MAP.river ? MAP.river.length / 2 : MAP.halfWidth;
export const riverHalfAt = (s) =>
  MAP.river ? MAP.riverHalfAt(s + MAP.river.length / 2) : MAP.riverHalf;
// Is a world point in a basin (on its polygon or map rectangle)?
export const inBasin = (b, x, z) => (b.poly ? inPoly(b.poly, x, z) : inRectW(b, x, z));
// Where a basin opens onto the river: station, side (+1 south / right going upstream)
// and half the width of the mouth along the river.
export function basinMouth(b) {
  if (b.mouth) {
    const f = riverFrame(b.mouth.x, b.mouth.z);
    return { s: f.s, side: Math.sign(f.n), half: b.mouthHalf || 120 };
  }
  const RH = MAP.riverHalf,
    side = b.z0 >= RH - 1 ? 1 : b.z1 <= -RH + 1 ? -1 : 0;
  return { s: (b.x0 + b.x1) / 2, side, half: (b.x1 - b.x0) / 2 };
}
// The same along the river for boats that sail on the map (rivals, own fleet):
// map coordinates in and out; h = heading upstream.
export const riverFrameM = (x, z) => (MAP.river ? riverFrame(x, z) : { s: x, n: z });
export const riverAtM = (s, n = 0) => (MAP.river ? riverAt(s, n) : { x: s, z: n, h: Math.PI / 2 });
