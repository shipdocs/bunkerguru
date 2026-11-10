// Water as real outlines instead of rectangles: one or more closed rings (flat x, z
// lists, metres). A point is water inside an odd number of rings. Everything the game
// asks of a quay comes from here: is this water, how far to the nearest wall, which
// way is the water, and the wall itself in pieces for drawing and mooring.
const CELL = 64; // edge index
export function createShape(rings, bounds) {
  const ax = [],
    az = [],
    bx = [],
    bz = [];
  for (const r of rings) {
    const n = r.length / 2;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      ax.push(r[2 * i]);
      az.push(r[2 * i + 1]);
      bx.push(r[2 * j]);
      bz.push(r[2 * j + 1]);
    }
  }
  const E = ax.length,
    X0 = -bounds.halfWidth - 2 * CELL,
    Z0 = bounds.zMin - 2 * CELL,
    cols = Math.ceil((2 * bounds.halfWidth + 4 * CELL) / CELL),
    rows = Math.ceil((bounds.zMax - bounds.zMin + 4 * CELL) / CELL);
  // Each cell lists the edges whose box touches it; each row the edges crossing its band.
  const cells = Array.from({ length: cols * rows }, () => []),
    bands = Array.from({ length: rows }, () => []);
  const ci = (x) => Math.max(0, Math.min(cols - 1, Math.floor((x - X0) / CELL))),
    ri = (z) => Math.max(0, Math.min(rows - 1, Math.floor((z - Z0) / CELL)));
  for (let e = 0; e < E; e++) {
    const c0 = ci(Math.min(ax[e], bx[e])),
      c1 = ci(Math.max(ax[e], bx[e])),
      r0 = ri(Math.min(az[e], bz[e])),
      r1 = ri(Math.max(az[e], bz[e]));
    for (let r = r0; r <= r1; r++) {
      bands[r].push(e);
      for (let c = c0; c <= c1; c++) cells[r * cols + c].push(e);
    }
  }
  function inside(x, z) {
    if (!Number.isFinite(x) || !Number.isFinite(z)) return false;
    let c = false;
    for (const e of bands[ri(z)]) {
      const z1 = az[e],
        z2 = bz[e];
      if (z1 > z !== z2 > z && x < ((bx[e] - ax[e]) * (z - z1)) / (z2 - z1) + ax[e]) c = !c;
    }
    return c;
  }
  // Nearest point on any wall within maxR: {d, qx, qz, e}, or null.
  function closest(x, z, maxR = 400) {
    let best = null,
      bd = maxR,
      seen = new Set();
    const cx = ci(x),
      cz = ri(z);
    for (let ring = 0; ring * CELL <= bd + CELL; ring++) {
      for (let r = cz - ring; r <= cz + ring; r++)
        for (let c = cx - ring; c <= cx + ring; c++) {
          if (Math.max(Math.abs(r - cz), Math.abs(c - cx)) !== ring) continue;
          if (r < 0 || c < 0 || r >= rows || c >= cols) continue;
          for (const e of cells[r * cols + c]) {
            if (seen.has(e)) continue;
            seen.add(e);
            const dx = bx[e] - ax[e],
              dz = bz[e] - az[e],
              l2 = dx * dx + dz * dz || 1,
              t = Math.max(0, Math.min(1, ((x - ax[e]) * dx + (z - az[e]) * dz) / l2)),
              qx = ax[e] + dx * t,
              qz = az[e] + dz * t,
              d = Math.hypot(x - qx, z - qz);
            if (d < bd) {
              bd = d;
              best = { d, qx, qz, e, t };
            }
          }
        }
      if (best && ring * CELL > bd + CELL) break;
    }
    return best;
  }
  const inBounds = (x, z, m = 0) =>
    x > -bounds.halfWidth + m &&
    x < bounds.halfWidth - m &&
    z > bounds.zMin + m &&
    z < bounds.zMax - m;
  // Signed distance to the nearest wall: + in the water, − on land (capped at maxR).
  function sdist(x, z, maxR = 400) {
    const q = closest(x, z, maxR),
      d = q ? q.d : maxR;
    return inside(x, z) ? d : -d;
  }
  const water = (x, z, m = 0) =>
    inBounds(x, z, m) && (m > 0 ? sdist(x, z, m + 1) >= m : inside(x, z));
  const land = (x, z, m = 0) => (m > 0 ? sdist(x, z, m + 1) < m : !inside(x, z));
  // The wall nearest to (x, z), with its unit normal pointing into the water.
  function wall(x, z, maxR = 400) {
    const q = closest(x, z, maxR);
    if (!q) return null;
    const e = q.e,
      dx = bx[e] - ax[e],
      dz = bz[e] - az[e],
      l = Math.hypot(dx, dz) || 1;
    // The water side of this edge: probe a metre off its middle.
    let nx = -dz / l,
      nz = dx / l;
    const mx = (ax[e] + bx[e]) / 2,
      mz = (az[e] + bz[e]) / 2;
    if (!inside(mx + nx, mz + nz)) [nx, nz] = [-nx, -nz];
    return { ...q, nx, nz, tx: dx / l, tz: dz / l, wet: inside(x, z) };
  }
  // Wall pieces of at most `step` metres: middle, length, unit normal into the water.
  function segments(step = 30) {
    const out = [];
    for (let e = 0; e < E; e++) {
      const dx = bx[e] - ax[e],
        dz = bz[e] - az[e],
        l = Math.hypot(dx, dz);
      if (l < 0.5) continue;
      let nx = -dz / l,
        nz = dx / l;
      const mx = (ax[e] + bx[e]) / 2,
        mz = (az[e] + bz[e]) / 2;
      if (!inside(mx + nx, mz + nz)) [nx, nz] = [-nx, -nz];
      const count = Math.ceil(l / step);
      for (let i = 0; i < count; i++) {
        const a = (i + 0.5) / count;
        out.push({ x: ax[e] + dx * a, z: az[e] + dz * a, length: l / count, nx, nz, edge: e });
      }
    }
    return out;
  }
  const rings2 = rings.map((r) => {
    const pts = [];
    for (let i = 0; i < r.length; i += 2) pts.push({ x: r[i], z: r[i + 1] });
    return pts;
  });
  return { rings: rings2, inside, closest, sdist, water, land, wall, segments, inBounds };
}
// Run-length coded land use grid (see real/rotterdam-osm.mjs) → kind at a point.
export function landUse(grid, bounds) {
  const cells = [];
  for (const row of grid.data.split('|')) {
    const out = [];
    for (const m of row.matchAll(/(\d*)([a-z])/g))
      for (let i = 0; i < (Number(m[1]) || 1); i++) out.push(m[2]);
    cells.push(out);
  }
  return (x, z) => {
    const c = Math.floor((x + bounds.halfWidth) / grid.cell),
      r = Math.floor((z - bounds.zMin) / grid.cell);
    return (
      cells[Math.max(0, Math.min(grid.rows - 1, r))]?.[Math.max(0, Math.min(grid.cols - 1, c))] ||
      'c'
    );
  };
}
