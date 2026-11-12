// A harbour built on its real outline (OpenStreetMap) instead of on the rectangles of
// the 2D map. The world is the map here: no warp, north up, x east, z south, metres.
// Quays, terminals, berths and bridges are given as a point near the real wall; the
// builder snaps them to that wall, so everything lies against the quay it belongs to.
import { createWarp } from './warp.mjs';
import { createShape, landUse } from './shape.mjs';
const SHIP_BEAM = 26;
const headingOf = (tx, tz) => Math.atan2(tx, -tz); // forward = (sin h, −cos h)

// A polyline with arc length: point, heading and nearest station.
export function createPath(pts) {
  const s = [0];
  for (let i = 1; i < pts.length; i++)
    s.push(s[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
  const length = s[s.length - 1];
  function at(d) {
    d = Math.max(0, Math.min(length, d));
    let i = 1;
    while (i < pts.length - 1 && s[i] < d) i++;
    const a = pts[i - 1],
      b = pts[i],
      l = s[i] - s[i - 1] || 1,
      f = (d - s[i - 1]) / l,
      tx = (b.x - a.x) / l,
      tz = (b.z - a.z) / l;
    return { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f, tx, tz, h: headingOf(tx, tz) };
  }
  // Station of the nearest point: {s, n (signed: + = right of the direction), x, z}.
  function near(x, z) {
    let best = null;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1],
        b = pts[i],
        dx = b.x - a.x,
        dz = b.z - a.z,
        l2 = dx * dx + dz * dz || 1,
        t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / l2)),
        qx = a.x + dx * t,
        qz = a.z + dz * t,
        d = Math.hypot(x - qx, z - qz);
      if (!best || d < best.d) {
        const l = Math.sqrt(l2);
        best = {
          d,
          s: s[i - 1] + t * l,
          // Right of the direction of travel (x east, z south): (−tz, tx).
          n: ((x - qx) * -dz + (z - qz) * dx) / l,
          x: qx,
          z: qz,
        };
      }
    }
    return best;
  }
  return { pts, length, at, near };
}
// Chaikin smoothing: a hand-drawn line becomes a gentle curve.
function smooth(pts, rounds = 3) {
  for (let r = 0; r < rounds; r++) {
    const out = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i],
        b = pts[i + 1];
      out.push({ x: a.x * 0.75 + b.x * 0.25, z: a.z * 0.75 + b.z * 0.25 });
      out.push({ x: a.x * 0.25 + b.x * 0.75, z: a.z * 0.25 + b.z * 0.75 });
    }
    out.push(pts[pts.length - 1]);
    pts = out;
  }
  return pts;
}
const P = (arr) => arr.map(([x, z]) => ({ x, z }));

export function buildReal(def) {
  const bounds = def.bounds,
    shape = createShape(def.water, bounds),
    useAt = landUse(def.landuse, bounds),
    warp = createWarp(null);
  // The quay nearest to a point on the water: wall point, along-quay direction and
  // the normal into the water. Throws when there is no quay near, so a typo in the
  // data shows at once.
  const quay = (x, z, name) => {
    const w = shape.wall(x, z, 300);
    if (!w) throw new Error('No quay near ' + name + ' (' + x + ', ' + z + ')');
    return w;
  };
  // A strip of water along a quay: terminals and waiting places.
  const strip = (t, kind, i) => {
    const w = quay(t.at[0], t.at[1], t.name),
      width = t.width || 34,
      len = t.length || 240,
      x = w.qx + w.nx * (width / 2),
      z = w.qz + w.nz * (width / 2),
      h = headingOf(w.tx, w.tz);
    return {
      id: kind + '-' + i,
      kind,
      name: t.name,
      yard: !!t.yard,
      gate: t.gate,
      x,
      z,
      h,
      mx: x,
      mz: z,
      mh: h,
      len,
      width,
      tx: w.tx,
      tz: w.tz,
      away: { x: w.nx, z: w.nz },
      obb: { cx: x, cz: z, tx: w.tx, tz: w.tz, hl: len / 2, hw: width / 2 },
      ...obbBox(x, z, w.tx, w.tz, len / 2, width / 2),
    };
  };
  const terminals = def.terminals.map((t, i) => strip(t, 'terminal', i));
  const waits = def.waits.map((t, i) => strip(t, 'wait', i));
  // Seagoing ships alongside: the hull a metre off the wall, the bunker boat outside.
  const customers = def.berths.map((b, i) => {
    const w = quay(b.at[0], b.at[1], b.name),
      len = b.length || 200,
      beam = SHIP_BEAM,
      h = headingOf(w.tx, w.tz),
      shipX = w.qx + w.nx * (beam / 2 + 1),
      shipZ = w.qz + w.nz * (beam / 2 + 1),
      x = shipX + w.nx * (beam / 2 + 7),
      z = shipZ + w.nz * (beam / 2 + 7),
      zx = shipX + w.nx * (beam / 2 + 23),
      zz = shipZ + w.nz * (beam / 2 + 23);
    return {
      id: def.id + '-' + i,
      kind: 'ship',
      name: b.name,
      company: b.where,
      color: b.col,
      gate: null,
      length: len,
      beam,
      shipX,
      shipZ,
      h,
      x,
      z,
      away: { x: w.nx, z: w.nz },
      shipMX: shipX,
      shipMZ: shipZ,
      mh: h,
      mx: x,
      mz: z,
      clear: 0,
      tx: w.tx,
      tz: w.tz,
      zone: {
        obb: { cx: zx, cz: zz, tx: w.tx, tz: w.tz, hl: len / 2 + 10, hw: 21 },
        ...obbBox(zx, zz, w.tx, w.tz, len / 2 + 10, 21),
      },
    };
  });
  // Ships that lie there for good (a cruise ship, a hotel ship): against the wall like a
  // berth, a box for collisions, a Blender model in the world (render/world.mjs).
  const liners = [...(def.liners || []), ...(def.moored || [])].map((l) => {
    const w = quay(l.at[0], l.at[1], l.name),
      bow = l.bow === -1 ? -1 : 1;
    return {
      name: l.name || '',
      model: l.model || null,
      color: l.col || '#eeeeee',
      length: l.length,
      beam: l.beam,
      shipX: w.qx + w.nx * (l.beam / 2 + 1),
      shipZ: w.qz + w.nz * (l.beam / 2 + 1),
      h: headingOf(w.tx * bow, w.tz * bow),
    };
  });
  // Fixed bridges: from a point on the water straight across (angle = deck direction),
  // to 30 m onto the land on either side.
  const bridges = def.bridges.map((b) => {
    const dx = Math.sin(b.dir),
      dz = -Math.cos(b.dir),
      reach = (sg) => {
        let d = 0;
        while (d < 1500 && shape.inside(b.at[0] + dx * d * sg, b.at[1] + dz * d * sg)) d += 2;
        return d + 30;
      },
      d0 = reach(-1),
      d1 = reach(1);
    return {
      name: b.name,
      color: b.col || '#ccc',
      ax: b.at[0] - dx * d0,
      az: b.at[1] - dz * d0,
      bx: b.at[0] + dx * d1,
      bz: b.at[1] + dz * d1,
      // Pillars and pylons as fractions of the span from a to b.
      pillars: (b.pillars || []).map((f) => ({
        x: b.at[0] + dx * (f * (d0 + d1) - d0),
        z: b.at[1] + dz * (f * (d0 + d1) - d0),
      })),
      pylon: b.pylon ?? null,
      height: b.height || 30,
    };
  });
  const river = createPath(smooth(P(def.river)));
  // The river's half width at a station: the narrower side, measured square to it.
  const halfAt = (s) => {
    const p = river.at(s),
      side = (sg) => {
        let d = 0;
        while (d < 900 && shape.inside(p.x - p.tz * d * sg, p.z + p.tx * d * sg)) d += 5;
        return d;
      };
    return Math.min(side(1), side(-1));
  };
  const widths = [];
  for (let s = 0; s <= river.length; s += 50) widths.push(halfAt(s));
  const riverHalfAt = (s) => {
    const i = Math.max(0, Math.min(widths.length - 1, Math.round(s / 50)));
    return Math.max(80, widths[i]);
  };
  const lanePath = (offset) =>
    createPath(
      river.pts.map((p, i, a) => {
        const b = a[Math.min(a.length - 1, i + 1)],
          c = a[Math.max(0, i - 1)],
          tx = b.x - c.x,
          tz = b.z - c.z,
          l = Math.hypot(tx, tz) || 1;
        return { x: p.x - (tz / l) * offset, z: p.z + (tx / l) * offset };
      }),
    );
  const basins = def.basins.map((b) => {
    const poly = P(b.poly),
      xs = poly.map((p) => p.x),
      zs = poly.map((p) => p.z);
    return {
      name: b.name,
      poly,
      x0: Math.min(...xs),
      x1: Math.max(...xs),
      z0: Math.min(...zs),
      z1: Math.max(...zs),
      label: { x: b.label[0], z: b.label[1] },
      mouth: b.mouth ? { x: b.mouth[0], z: b.mouth[1] } : null,
      mouthHalf: b.mouthHalf || 120,
      side: 0,
    };
  });
  const start = { x: def.start[0], z: def.start[1], h: def.start[2] || 0 };
  return {
    id: def.id,
    real: true,
    warp,
    shape,
    landUseAt: useAt,
    river,
    riverHalfAt,
    lanePath,
    name: def.name,
    icon: def.icon,
    desc: def.desc,
    radio: def.radio,
    i18n: def.i18n || {},
    version: 6,
    layout: def.layout,
    sn: { k: 1, cx: 0 },
    halfWidth: bounds.halfWidth,
    zMin: bounds.zMin,
    zMax: bounds.zMax,
    halfLength: Math.max(-bounds.zMin, bounds.zMax),
    riverHalf: def.riverHalf || 180,
    land: [],
    basins,
    terminals,
    waits,
    customers,
    traffic: def.traffic.map((t, i) => ({
      id: i,
      name: t.name,
      color: t.col,
      path: t.path ? createPath(smooth(P(t.path), 2)) : lanePath(t.lane || 0),
      s: t.s,
      v: t.v,
      length: t.len,
      beam: t.len >= 150 ? SHIP_BEAM : t.len >= 80 ? 10 : t.len >= 30 ? 8 : 4,
      shuttle: !!t.path,
      escort: t.escort || null,
    })),
    gates: [],
    liners,
    bridges,
    channels: [],
    labels: def.labels.map((l) => ({ x: l.at[0], z: l.at[1], text: l.text, size: l.size })),
    roads: [],
    // no crane, shed or house on the quay beside a cruise ship
    decor: makeDecor(shape, useAt, bounds, [
      ...(def.landmarks || []),
      ...liners.map((l) => ({ x: l.shipX, z: l.shipZ, r: l.length / 2 + 15 })),
    ]),
    landmarks: def.landmarks || [],
    start,
    mstart: start,
    rivals: def.rivals.map(([x, z, h]) => ({ x, z, h })),
    lanes: null,
    aiPace: def.aiPace || 1,
    current: { base: def.currentSpeed || 0, tide: def.tide || null },
  };
}
// Axis-aligned box round an oriented rectangle (for broad phases and old callers).
function obbBox(cx, cz, tx, tz, hl, hw) {
  const ex = Math.abs(tx) * hl + Math.abs(tz) * hw,
    ez = Math.abs(tz) * hl + Math.abs(tx) * hw;
  return { x0: cx - ex, x1: cx + ex, z0: cz - ez, z1: cz + ez };
}
// Is (x, z) inside an oriented rectangle, with margin m?
export function inObb(o, x, z, m = 0) {
  const dx = x - o.cx,
    dz = z - o.cz,
    a = dx * o.tx + dz * o.tz,
    b = -dx * o.tz + dz * o.tx;
  return Math.abs(a) < o.hl + m && Math.abs(b) < o.hw + m;
}
export function inPoly(poly, x, z) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i],
      b = poly[j];
    if (a.z > z !== b.z > z && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) c = !c;
  }
  return c;
}

// What stands on the land, from the land use and the distance to the water: cranes on
// the port quays, container stacks and sheds behind them, city blocks, park trees.
// Only what can be seen from the water (650 m inland). Same seed, same harbour.
const COLS = ['#e67e22', '#27ae60', '#2980b9', '#e74c3c', '#f1c40f', '#8e9aa6'];
function makeDecor(shape, useAt, bounds, landmarks) {
  let seed = 51;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const kind = (x, z) => {
    // The majority of the land use round the point: a single odd cell does not count.
    const n = { p: 0, c: 0, g: 0 };
    for (const dx of [-50, 0, 50]) for (const dz of [-50, 0, 50]) n[useAt(x + dx, z + dz)]++;
    return n.p >= n.c && n.p >= n.g ? 'p' : n.g > n.c ? 'g' : 'c';
  };
  const near = (x, z, r) => landmarks.some((l) => Math.hypot(l.x - x, l.z - z) < (l.r || 0) + r);
  const out = [];
  const STEP = 48,
    W = bounds.halfWidth;
  for (let x = -W + STEP / 2; x < W; x += STEP)
    for (let z = bounds.zMin + STEP / 2; z < bounds.zMax; z += STEP) {
      const px = x + (rnd() - 0.5) * 10,
        pz = z + (rnd() - 0.5) * 10;
      if (shape.inside(px, pz)) continue;
      const q = shape.closest(px, pz, 420);
      if (!q || q.d < 18 || near(px, pz, 12)) continue;
      const k = kind(px, pz),
        r = rnd();
      if (k === 'p') {
        if (q.d < 160 && r < 0.45) {
          const col = COLS[Math.floor(rnd() * COLS.length)];
          out.push({ type: 'container', x: px, z: pz - 9, col });
          out.push({ type: 'container', x: px, z: pz + 9, col: COLS[Math.floor(rnd() * 6)] });
        } else if (r < 0.12 && q.d > 90) out.push({ type: 'tank', x: px, z: pz, r: 11 });
        else if (r < 0.8)
          out.push({ type: 'block', x: px, z: pz, w: 26 + rnd() * 14, d: 20 + rnd() * 10 });
      } else if (k === 'c') {
        if (r < 0.75)
          out.push({ type: 'block', x: px, z: pz, w: 16 + rnd() * 12, d: 16 + rnd() * 12 });
        else out.push({ type: 'tree', x: px, z: pz });
      } else {
        for (let i = 0; i < 3; i++)
          if (rnd() < 0.7)
            out.push({ type: 'tree', x: px + (rnd() - 0.5) * 36, z: pz + (rnd() - 0.5) * 36 });
      }
    }
  // Cranes along the port quays, square to the wall, the boom over the water: in pairs
  // with a long stretch of bare quay between (a pair per ~700 m), not a fence of them.
  // Counted in metres of port quay, not in pieces (a detailed OSM wall has many).
  let along = 0,
    next = 60,
    second = false;
  for (const g of shape.segments(30)) {
    const bx = g.x - g.nx * 10,
      bz = g.z - g.nz * 10;
    if (kind(g.x - g.nx * 40, g.z - g.nz * 40) !== 'p' || near(bx, bz, 20)) continue;
    along += g.length;
    if (along < next) continue;
    next = along + (second ? 700 : 36);
    second = !second;
    out.push({ type: 'crane', x: bx, z: bz, yaw: Math.atan2(g.nx, -g.nz) });
  }
  return out;
}
