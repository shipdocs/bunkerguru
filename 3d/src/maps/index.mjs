import { buildClassic } from './classic-map.mjs';
import amsterdam from './classic/amsterdam.mjs';
import rotterdam from './classic/rotterdam.mjs';
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
export const MAP = buildClassic(DEFS[selectedMapId()]);
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

export function landAt(x, z, margin = 0) {
  return land.some(
    (l) => x > l.x0 - margin && x < l.x1 + margin && z > l.z0 - margin && z < l.z1 + margin,
  );
}
export function waterAt(x, z, margin = 0) {
  return (
    x > -MAP.halfWidth + margin &&
    x < MAP.halfWidth - margin &&
    z > MAP.zMin + margin &&
    z < MAP.zMax - margin &&
    !landAt(x, z, margin)
  );
}
export const inRect = (r, x, z, m = 0) =>
  x > r.x0 - m && x < r.x1 + m && z > r.z0 - m && z < r.z1 + m;

// Quay edges facing water, in 30 m pieces, for rendering and mooring lines.
export const shoreSegments = [];
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
      if (waterAt(x + nx * 2, z + nz * 2))
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
      cross += side * Math.sin(u * Math.PI) * -dir * (u < 0.5 ? 1 : -1) * 0.35 * depth;
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
  b.h
    ? { x0: b.shipX - b.length / 2, x1: b.shipX + b.length / 2, z0: b.shipZ - 14, z1: b.shipZ + 14 }
    : {
        x0: b.shipX - 14,
        x1: b.shipX + 14,
        z0: b.shipZ - b.length / 2,
        z1: b.shipZ + b.length / 2,
      },
);
const free = new Map();
function open(x, z, m) {
  return waterAt(x, z, m) && !shipRects.some((r) => inRect(r, x, z, m));
}
function clearLine(a, b, m) {
  const d = Math.hypot(b.x - a.x, b.z - a.z),
    n = Math.max(1, Math.ceil(d / 8));
  for (let i = 0; i <= n; i++)
    if (!open(a.x + ((b.x - a.x) * i) / n, a.z + ((b.z - a.z) * i) / n, m)) return false;
  return true;
}
export function waterRoute(start, goal, margin = 10) {
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
