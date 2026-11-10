import * as T from '../../vendor/three.js';
import { WARP, gridLines, rectOutline } from '../maps/index.mjs';
export const warpedOutline = rectOutline;
// Map rectangles drawn in the warped world (maps/warp.mjs): land, zones and strips
// follow the bends and the lean of the basins. Vertices sit on one grid shared by the
// whole map, so neighbouring rectangles meet without cracks. On a straight map
// (identity warp) every rectangle is a single quad, as before.
// The rectangle as a flat mesh at height y; uv in map metres / tile (0 = no uv).
export function warpedRect(r, y = 0, tile = 0) {
  const xs = gridLines(r.x0, r.x1, 'x'),
    zs = gridLines(r.z0, r.z1, 'z'),
    pos = [],
    uv = [],
    index = [];
  for (const z of zs)
    for (const x of xs) {
      const w = WARP.forward(x, z);
      pos.push(w.x, y, w.z);
      if (tile) uv.push(x / tile, z / tile);
    }
  const n = xs.length;
  for (let j = 0; j < zs.length - 1; j++)
    for (let i = 0; i < n - 1; i++) {
      const a = j * n + i,
        b = a + 1,
        c = a + n,
        d = c + 1;
      index.push(a, c, b, b, c, d);
    }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute(
    'normal',
    new T.Float32BufferAttribute(
      pos.map((_, i) => (i % 3 === 1 ? 1 : 0)),
      3,
    ),
  );
  if (tile) g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(index);
  g.computeBoundingSphere();
  return g;
}
// Vertical wall round the rectangle from y0 up to y1, facing outwards.
export function warpedSkirt(r, y0, y1) {
  const pts = warpedOutline(r),
    pos = [],
    nor = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i],
      b = pts[(i + 1) % pts.length];
    // The outline runs clockwise seen from above (x right, z down): outside is on
    // the left of the direction of travel.
    let nx = b.z - a.z,
      nz = -(b.x - a.x);
    const len = Math.hypot(nx, nz) || 1;
    nx /= len;
    nz /= len;
    pos.push(a.x, y1, a.z, b.x, y1, b.z, a.x, y0, a.z, b.x, y1, b.z, b.x, y0, b.z, a.x, y0, a.z);
    for (let k = 0; k < 6; k++) nor.push(nx, 0, nz);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
  g.computeBoundingSphere();
  return g;
}
// Something straight and rigid (a gate, a bridge deck) between two map points:
// middle, length and the yaw for a mesh modelled along +x (rotation.y).
export function span(ax, az, bx, bz) {
  const a = WARP.forward(ax, az),
    b = WARP.forward(bx, bz);
  return {
    x: (a.x + b.x) / 2,
    z: (a.z + b.z) / 2,
    length: Math.hypot(b.x - a.x, b.z - a.z),
    yaw: -Math.atan2(b.z - a.z, b.x - a.x),
  };
}
