import { basinSections, boundsAt, CANAL_INSETS } from './waterway-layout.mjs';
export { boundsAt as basinBoundsAt } from './waterway-layout.mjs';
import source from './amsterdam-source.mjs';
// Original map topology, expressed in scene metres. Rotate the old s/n frame
// onto an east/west canal: x=s-2200, z=n; do not scale vessel dimensions.
const quad = (s0, s1, n0, n1) => [
  { x: s0 - 2200, z: n0 },
  { x: s1 - 2200, z: n0 },
  { x: s1 - 2200, z: n1 },
  { x: s0 - 2200, z: n1 },
];
export const originalMap = source.build({
  quad,
  RIVER_HALF: source.RIVER_HALF,
  TH: 0,
  cols: ['#668b8c', '#b56f4c', '#c4b078', '#586f74', '#789274'],
});
export const MAP = Object.freeze({
  version: 4,
  name: 'Amsterdam Westpoort',
  halfWidth: 2500,
  halfLength: 1100,
  riverHalf: 140,
});
export const land = originalMap.land.map((l) => ({
  ...l,
  x0: Math.min(...l.poly.map((p) => p.x)),
  x1: Math.max(...l.poly.map((p) => p.x)),
  z0: Math.min(...l.poly.map((p) => p.z)),
  z1: Math.max(...l.poly.map((p) => p.z)),
}));
export const basins = originalMap.basins.map((b, i) => {
  const sections = basinSections(b, i);
  return {
    ...b,
    sections,
    x0: Math.min(...sections.map((p) => p.x0)),
    x1: Math.max(...sections.map((p) => p.x1)),
    z0: b.n0,
    z1: b.n1,
  };
});
function fill(x0, x1, z0, z1, kind) {
  if (x1 <= x0 || z1 <= z0) return;
  land.push({
    x0,
    x1,
    z0,
    z1,
    kind,
    poly: [
      { x: x0, z: z0 },
      { x: x1, z: z0 },
      { x: x1, z: z1 },
      { x: x0, z: z1 },
    ],
  });
}
for (const b of basins)
  for (const p of b.sections) {
    const leftKind =
      land.find((l) => l.x1 === b.s0 - 2200 && l.z0 <= p.z0 && l.z1 >= p.z1)?.kind ||
      (b.z0 < 0 ? 'north' : 'tanks');
    const rightKind =
      land.find((l) => l.x0 === b.s1 - 2200 && l.z0 <= p.z0 && l.z1 >= p.z1)?.kind ||
      (b.z0 < 0 ? 'north' : 'containers');
    fill(b.s0 - 2200, p.x0, p.z0, p.z1, leftKind);
    fill(p.x1, b.s1 - 2200, p.z0, p.z1, rightKind);
  }
for (const p of CANAL_INSETS) {
  if (p.north) fill(p.x0, p.x1, -140, -140 + p.north, 'north');
  if (p.south) fill(p.x0, p.x1, 140 - p.south, 140, 'containers');
}
export function waterAt(x, z, margin = 0) {
  return (
    x > -2500 + margin &&
    x < 2500 - margin &&
    z > -1100 + margin &&
    z < 1100 - margin &&
    !land.some(
      (l) => x > l.x0 - margin && x < l.x1 + margin && z > l.z0 - margin && z < l.z1 + margin,
    )
  );
}
export const supplyTerminals = originalMap.terminals.map((t, i) => {
  const z = (t.n0 + t.n1) / 2,
    b = basins[i === 0 ? 2 : 0],
    edge = boundsAt(b, z),
    anchorX = i === 0 ? edge.x0 : edge.x1;
  return { id: 'terminal-' + i, name: t.name, x: anchorX + (i === 0 ? 18 : -18), z, h: 0, anchorX };
});
export const customers = originalMap.berths.map((b, i) => {
  const along = b.axis === 's',
    beam = 22,
    shipZ = along ? b.c : (b.a0 + b.a1) / 2;
  const basin = basins[[0, 1, 2, 3, -1, 8][i]],
    edges = basin ? boundsAt(basin, shipZ) : null;
  const shipX = along ? (b.a0 + b.a1) / 2 - 2200 : b.side > 0 ? edges.x0 + 28 : edges.x1 - 28;
  return {
    id: 'amsterdam-' + i,
    name: b.name,
    company: b.where,
    color: b.col,
    length: Math.min(160, (b.a1 - b.a0) * 0.5),
    beam,
    shipX,
    shipZ,
    h: along ? Math.PI / 2 : 0,
    x: shipX + (along ? 0 : b.side * 26),
    z: shipZ + (along ? b.side * 26 : 0),
  };
});
// Safe open-water positions where the 110 m hull can swing through 360°.
export const turningAreas = [
  { basin: 0, x: -1800, z: 760 },
  { basin: 1, x: -1000, z: 920 },
  { basin: 2, x: -100, z: 840 },
  { basin: 3, x: 500, z: 620 },
  { basin: 4, x: 900, z: 510 },
  { basin: 5, x: 1500, z: 430 },
  { basin: 6, x: 2000, z: 410 },
  { basin: 8, x: 1232, z: -320 },
];
export function canalTraffic(clock = 0) {
  return originalMap.traffic.map((b, i) => {
    const along = b.axis !== 'n',
      lo = along ? -2400 : b.nMin + 30,
      hi = along ? 2400 : b.nMax - 30,
      span = hi - lo;
    const start = along ? b.s - 2200 : b.n;
    const phase = (((start - lo + b.v * clock) % (span * 2)) + span * 2) % (span * 2),
      forward = phase < span,
      position = lo + (forward ? phase : span * 2 - phase),
      velocity = b.v * (forward ? 1 : -1);
    return {
      id: i,
      name: b.name,
      x: along ? position : b.s - 2200,
      z: along ? b.n : position,
      h: along ? (velocity > 0 ? Math.PI / 2 : -Math.PI / 2) : velocity > 0 ? Math.PI : 0,
      length: b.len * 0.5,
      beam: along ? 20 : 8,
      speed: Math.abs(velocity),
      color: b.col,
    };
  });
}
export function basinAt(p) {
  return basins.find((b) =>
    b.sections.some((q) => p.x > q.x0 && p.x < q.x1 && p.z > q.z0 && p.z < q.z1),
  );
}
export function canalRoute(s, t) {
  const a = basinAt(s),
    b = basinAt(t);
  if (a && a === b)
    return [
      { x: s.x, z: s.z },
      { x: t.x, z: t.z },
    ];
  const points = [{ x: s.x, z: s.z }];
  if (a) {
    const x = (a.x0 + a.x1) / 2;
    points.push({ x, z: s.z }, { x, z: 0 });
  } else if (Math.abs(s.z) > 60) points.push({ x: s.x, z: 0 });
  if (b) {
    const x = (b.x0 + b.x1) / 2;
    points.push({ x, z: 0 }, { x, z: t.z });
  } else points.push({ x: t.x, z: 0 });
  points.push({ x: t.x, z: t.z });
  return points;
}
export const shoreSegments = [];
for (const l of land) {
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
