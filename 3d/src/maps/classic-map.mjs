// Converts a classic 2D Bunkerguru map (maps/*.js, s/n river frame in pixels, see
// engine.js loadMap) into the 3D frame: metres, x = along the river (sea at −x),
// z = across (n < 0 = north = −z). The river is drawn straight (TH ignored).
// Exactly as in the 2D game, K enlarges the world while ships keep their size and
// berths, terminals and waiting places stay against their quay.
import { createWarp, warpParams } from './warp.mjs';
const SCALE = 2, // pixels per metre in the 2D game
  SH = 52; // seagoing ship beam in pixels (26 m)
const COLS = ['#e67e22', '#27ae60', '#2980b9', '#e74c3c', '#f1c40f'];
const FILL = { house: 38, block: 40, tree: 32, container: 22, tank: 70 };

function inPoly(p, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i],
      b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}
function bounds(poly) {
  const xs = poly.map((p) => p.x),
    ys = poly.map((p) => p.y);
  return { s0: Math.min(...xs), s1: Math.max(...xs), n0: Math.min(...ys), n1: Math.max(...ys) };
}

export function buildClassic(def) {
  const K = def.K || 1;
  const quad0 = (s0, s1, n0, n1) => [
    { x: s0, y: n0 },
    { x: s1, y: n0 },
    { x: s1, y: n1 },
    { x: s0, y: n1 },
  ];
  const helpers = (k) => ({
    quad: (s0, s1, n0, n1) => quad0(s0 * k, s1 * k, n0 * k, n1 * k),
    poly: (pts) => pts.map(([a, b]) => ({ x: a * k, y: b * k })),
    sn2w: (s, n) => ({ x: s * k, y: n * k }),
    RIVER_HALF: def.RIVER_HALF,
    TH: 0,
    SH,
    S_MIN: def.S_MIN,
    S_MAX: def.S_MAX,
    cols: COLS,
  });
  const m0 = def.build(helpers(1)),
    onLand = (s, n) => m0.land.some((l) => inPoly({ x: s, y: n }, l.poly));
  const h = helpers(K);
  const m = def.build(h);
  if (!m.start) m.start = { s: 0, n: 0, hdgOff: 0 };
  if (K !== 1) {
    const gap = (f) => {
      for (let d = 1; d <= 14; d++) if (f(d)) return d;
      return null;
    };
    const ax = (a0, a1, g0, g1) => {
      const len = a1 - a0;
      if (g0 !== null) {
        const e = K * (a0 - g0) + g0;
        return [e, e + len];
      }
      if (g1 !== null) {
        const e = K * (a1 + g1) - g1;
        return [e - len, e];
      }
      const c = ((a0 + a1) / 2) * K;
      return [c - len / 2, c + len / 2];
    };
    const rectT = (o) => {
      const sm = (o.s0 + o.s1) / 2,
        nm = (o.n0 + o.n1) / 2;
      const [s0, s1] = ax(
        o.s0,
        o.s1,
        gap((d) => onLand(o.s0 - d, nm)),
        gap((d) => onLand(o.s1 + d, nm)),
      );
      const [n0, n1] = ax(
        o.n0,
        o.n1,
        gap((d) => onLand(sm, o.n0 - d)),
        gap((d) => onLand(sm, o.n1 + d)),
      );
      Object.assign(o, { s0, s1, n0, n1 });
    };
    const inRect = (o, s, n) => s > o.s0 && s < o.s1 && n > o.n0 && n < o.n1;
    const st0 = m.start,
      waits0 = (m.waits || []).map((w) => ({ ...w }));
    for (const t of m.terminals) rectT(t);
    for (const w of m.waits || []) rectT(w);
    for (const b of m.berths) {
      const mid = ((b.a0 + b.a1) / 2) * K,
        len = b.a1 - b.a0;
      b.a0 = mid - len / 2;
      b.a1 = mid + len / 2;
      b.c = K * (b.c - b.side * 28) + b.side * 28;
    }
    for (const b of m.basins || []) for (const k of ['s0', 's1', 'n0', 'n1']) b[k] *= K;
    for (const t of m.traffic || []) {
      t.s *= K;
      t.n *= K;
      if (t.nMin !== undefined) {
        t.nMin *= K;
        t.nMax *= K;
      }
    }
    for (const c of m.channels || []) for (const k of ['s0', 's1', 'n0', 'n1']) c[k] *= K;
    for (const g of m.gates || [])
      for (const k of g.axis === 'n' ? ['n', 's0', 's1'] : ['s', 'n0', 'n1']) g[k] *= K;
    for (const br of m.bridges || []) {
      for (const k of ['s', 'n0', 'n1']) br[k] *= K;
      if (br.pillars) br.pillars = br.pillars.map((p) => p * K);
      if (br.pylon !== undefined) br.pylon *= K;
      if (br.towers) br.towers = br.towers.map((p) => p * K);
    }
    for (const l of m.labels || []) {
      l.s *= K;
      l.n *= K;
    }
    for (const r of m.roads || []) r.pts = r.pts.map(([s, n]) => [s * K, n * K]);
    for (const r of m.rivals || []) {
      r.s *= K;
      r.n *= K;
    }
    const wi = waits0.findIndex((w) => inRect(w, st0.s, st0.n));
    m.start =
      wi >= 0
        ? {
            s: (m.waits[wi].s0 + m.waits[wi].s1) / 2,
            n: (m.waits[wi].n0 + m.waits[wi].n1) / 2,
            hdgOff: st0.hdgOff,
          }
        : { s: st0.s * K, n: st0.n * K, hdgOff: st0.hdgOff };
  }
  // ---- to metres in the 3D frame ----
  const sMin = def.S_MIN * K,
    sMax = def.S_MAX * K;
  const cx = (sMin + sMax) / 2 / SCALE;
  const X = (s) => s / SCALE - cx,
    Z = (n) => n / SCALE,
    M = (px) => px / SCALE;
  const heading = (hdgOff) => hdgOff + Math.PI / 2; // 2D canvas angle → 3D heading
  const rect = (o) => ({ x0: X(o.s0), x1: X(o.s1), z0: Z(o.n0), z1: Z(o.n1) });
  const land = m.land.map((l) => {
    const b = bounds(l.poly);
    return { ...rect(b), kind: l.kind || 'north', label: l.label, col: l.col };
  });
  const bridges = (m.bridges || []).map((br) => ({
    name: br.name,
    x: X(br.s),
    z0: Z(br.n0),
    z1: Z(br.n1),
    pillars: (br.pillars || []).map(Z),
    pylon: br.pylon !== undefined ? Z(br.pylon) : null,
    towers: (br.towers || []).map(Z),
    color: br.col || '#ccc',
  }));
  for (const br of bridges)
    for (const p of br.pillars)
      land.push({ x0: br.x - 4.5, x1: br.x + 4.5, z0: p - 4.5, z1: p + 4.5, kind: 'pillar' });
  const gates = (m.gates || []).map((g) => ({
    name: g.name,
    kind: g.kind,
    prepT: g.prepT,
    openT: g.openT,
    ...(g.axis === 'n'
      ? { x0: X(g.s0), x1: X(g.s1), z0: Z(g.n) - 3, z1: Z(g.n) + 3 }
      : { x0: X(g.s) - 3, x1: X(g.s) + 3, z0: Z(g.n0), z1: Z(g.n1) }),
  }));
  const zs = land.flatMap((l) => [l.z0, l.z1]);
  const halfWidth = (sMax - sMin) / 2 / SCALE,
    zMin = Math.min(...zs, -M(def.RIVER_HALF * K) - 200),
    zMax = Math.max(...zs, M(def.RIVER_HALF * K) + 200);
  const riverHalf = M(def.RIVER_HALF * K);
  const basins = (m.basins || []).map((b) => ({
    name: b.name,
    ...rect(b),
    side: (b.n0 + b.n1) / 2 > 0 ? 1 : -1,
    labelZ: b.labelN !== undefined ? Z(b.labelN * K) : null,
  }));
  // Strips against a wall: terminals and waiting places. The boat lies along the long side.
  const strip = (t, kind, i) => {
    const r = rect(t),
      alongZ = r.z1 - r.z0 > r.x1 - r.x0;
    // Wall side: the edge of the strip that touches land.
    const mx = (r.x0 + r.x1) / 2,
      mz = (r.z0 + r.z1) / 2;
    const landAt = (x, z) => land.some((l) => x > l.x0 && x < l.x1 && z > l.z0 && z < l.z1);
    let wall;
    if (alongZ) wall = landAt(r.x0 - 8, mz) ? -1 : landAt(r.x1 + 8, mz) ? 1 : 0;
    else wall = landAt(mx, r.z0 - 8) ? -1 : landAt(mx, r.z1 + 8) ? 1 : 0;
    return {
      id: kind + '-' + i,
      kind,
      name: t.name,
      yard: !!t.yard,
      gate: t.gate,
      ...r,
      x: mx,
      z: mz,
      alongZ,
      wall,
      h: alongZ ? 0 : Math.PI / 2,
    };
  };
  const terminals = m.terminals.map((t, i) => strip(t, 'terminal', i));
  const waits = (m.waits || []).map((w, i) => strip(w, 'wait', i));
  const customers = m.berths.map((b, i) => {
    const alongX = b.axis === 's',
      len = M(b.a1 - b.a0),
      mid = (b.a0 + b.a1) / 2;
    const shipX = alongX ? X(mid) : X(b.c),
      shipZ = alongX ? Z(b.c) : Z(mid);
    const d0 = b.c + b.side * (SH / 2 + 2),
      d1 = b.c + b.side * (SH / 2 + 44);
    const zone = alongX
      ? { x0: X(b.a0 - 10), x1: X(b.a1 + 10), z0: Z(Math.min(d0, d1)), z1: Z(Math.max(d0, d1)) }
      : { x0: X(Math.min(d0, d1)), x1: X(Math.max(d0, d1)), z0: Z(b.a0 - 10), z1: Z(b.a1 + 10) };
    const off = b.side * (M(SH) / 2 + 7);
    return {
      id: def.id + '-' + i,
      kind: 'ship',
      name: b.name,
      company: b.where,
      color: b.col,
      gate: b.gate,
      length: len,
      beam: M(SH),
      shipX,
      shipZ,
      h: alongX ? Math.PI / 2 : 0,
      zone,
      side: b.side,
      x: shipX + (alongX ? 0 : off),
      z: shipZ + (alongX ? off : 0),
    };
  });
  const traffic = (m.traffic || []).map((t, i) => ({
    id: i,
    name: t.name,
    color: t.col,
    axis: t.axis === 'n' ? 'z' : 'x',
    x: X(t.s),
    z: Z(t.n),
    v: t.v,
    length: M(t.len),
    beam: t.len >= 150 ? M(SH) : t.len >= 80 ? 10 : 8,
    zMin: t.nMin !== undefined ? Z(t.nMin) : null,
    zMax: t.nMax !== undefined ? Z(t.nMax) : null,
  }));
  const channels = (m.channels || []).map((c) => ({ ...rect(c), cs: c.cs, cn: c.cn }));
  const labels = (m.labels || []).map((l) => ({
    x: X(l.s),
    z: Z(l.n),
    text: l.text,
    size: l.size,
  }));
  const roads = (m.roads || []).map((r) => ({
    pts: r.pts.map(([s, n]) => ({ x: X(s), z: Z(n) })),
    width: M(r.w * 2),
  }));
  // Decoration from the 2D map: placed only on land, scaled like the 2D game.
  const decor = [];
  let seed = 3;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const landOnly = land.filter((l) => l.kind !== 'pillar');
  const onLandM = (x, z, r = 0) =>
    landOnly.some((l) => x - r > l.x0 && x + r < l.x1 && z - r > l.z0 && z + r < l.z1);
  const add = (type, s, n, extra = {}) => {
    const offs =
      FILL[type] && K !== 1
        ? [
            [0, 0],
            [FILL[type], 0],
            [0, FILL[type]],
            [FILL[type], FILL[type]],
          ]
        : [[0, 0]];
    for (const [ds, dn] of offs) {
      const x = X(s * K + ds),
        z = Z(n * K + dn);
      const ok = type === 'crane' ? true : onLandM(x, z, FILL[type] ? 7 : 0);
      if (ok) decor.push({ type, x, z, ...extra });
    }
  };
  if (m.decor) m.decor(add, rnd, h);
  for (const d of decor) {
    if (d.r) d.r = M(d.r);
    if (d.type === 'block') {
      d.w = M(d.w || 20);
      d.d = M(d.h || 20);
      delete d.h;
    }
    // 2D angle → 3D heading of the crane boom (towards the water).
    if (d.ang !== undefined) d.yaw = heading(d.ang);
  }
  const start = { x: X(m.start.s), z: Z(m.start.n), h: heading(m.start.hdgOff || 0) };
  const rivals = (m.rivals || []).map((r) => ({ x: X(r.s), z: Z(r.n), h: heading(r.hdgOff || 0) }));
  const lanes = def.lanes
    ? { down: M(def.lanes.down * K), up: M(def.lanes.up * K), mouth: M(def.lanes.mouth * K) }
    : null;
  const warp = createWarp(warpParams(def.id), riverHalf);
  return {
    id: def.id,
    warp,
    name: def.name,
    icon: def.icon,
    desc: def.desc,
    radio: def.radio,
    i18n: def.i18n || {},
    version: 5,
    // 2D map units (s along, n across the river) → metres: x = s·k − cx, z = n·k.
    sn: { k: K / SCALE, cx },
    halfWidth,
    zMin,
    zMax,
    halfLength: Math.max(-zMin, zMax),
    riverHalf,
    land,
    basins,
    terminals,
    waits,
    customers,
    traffic,
    gates,
    bridges,
    channels,
    labels,
    roads,
    decor,
    start,
    rivals,
    lanes,
    current: { base: def.currentSpeed || 0, tide: def.tide || null },
  };
}
