import * as T from '../../vendor/three.js';
import { MAP, SHAPE } from '../maps/index.mjs';
// The land of a real outline (maps/shape.mjs): one sheet round the water, painted by
// land use (port grey, city sand, parks green), with a quay wall all along the water.
const PAINT = { p: [176, 176, 168], c: [206, 196, 172], g: [118, 172, 86] };
const MARGIN = 1600; // the land runs on beyond the chart
function landuseTexture(light) {
  const W = MAP.halfWidth + MARGIN,
    Z0 = MAP.zMin - MARGIN,
    Z1 = MAP.zMax + MARGIN,
    px = light ? 8 : 4, // metres per pixel
    w = Math.ceil((2 * W) / px),
    h = Math.ceil((Z1 - Z0) / px);
  const cv = globalThis.document?.createElement('canvas');
  if (!cv) return null;
  cv.width = Math.min(w, 4096);
  cv.height = Math.min(h, 4096);
  const c = cv.getContext('2d');
  if (!c?.createImageData) return null;
  const img = c.createImageData(cv.width, cv.height),
    sx = (2 * W) / cv.width,
    sz = (Z1 - Z0) / cv.height;
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let j = 0; j < cv.height; j++)
    for (let i = 0; i < cv.width; i++) {
      const x = -W + (i + 0.5) * sx,
        z = Z0 + (j + 0.5) * sz,
        col = PAINT[MAP.landUseAt(x, z)] || PAINT.c,
        n = (rnd() - 0.5) * 10,
        k = (j * cv.width + i) * 4;
      img.data[k] = col[0] + n;
      img.data[k + 1] = col[1] + n;
      img.data[k + 2] = col[2] + n;
      img.data[k + 3] = 255;
    }
  c.putImageData(img, 0, 0);
  // Soften the 50 m cells of the land use into districts.
  if (c.filter !== undefined) {
    c.filter = 'blur(' + Math.round(14 / px) + 'px)';
    c.drawImage(cv, 0, 0);
    c.filter = 'none';
  }
  const tex = new T.CanvasTexture(cv);
  tex.colorSpace = T.SRGBColorSpace;
  tex.anisotropy = 8;
  return { tex, W, Z0, Z1 };
}
export function createRealTerrain(scene, quality = { light: false }) {
  const group = new T.Group();
  group.name = 'terrain';
  const W = MAP.halfWidth + MARGIN,
    Z0 = MAP.zMin - MARGIN,
    Z1 = MAP.zMax + MARGIN;
  // Shape in (x, −z), turned flat afterwards: the water rings are its holes.
  const outer = new T.Shape([
    new T.Vector2(-W, -Z0),
    new T.Vector2(-W, -Z1),
    new T.Vector2(W, -Z1),
    new T.Vector2(W, -Z0),
  ]);
  for (const r of SHAPE.rings) outer.holes.push(new T.Path(r.map((p) => new T.Vector2(p.x, -p.z))));
  const g = new T.ShapeGeometry(outer);
  g.rotateX(-Math.PI / 2);
  g.translate(0, 4, 0);
  const pos = g.getAttribute('position'),
    uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) + W) / (2 * W);
    uv[i * 2 + 1] = 1 - (pos.getZ(i) - Z0) / (Z1 - Z0);
  }
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  const paint = landuseTexture(quality.light);
  const top = new T.Mesh(
    g,
    new T.MeshStandardMaterial({
      color: paint ? '#ffffff' : '#c9c2ad',
      map: paint?.tex || null,
      roughness: 1,
      metalness: 0,
    }),
  );
  top.receiveShadow = true;
  top.name = 'terrain-top';
  group.add(top);
  // The quay wall: a skirt down from the land into the water along every ring.
  const p = [],
    n = [];
  for (const r of SHAPE.rings)
    for (let i = 0; i < r.length; i++) {
      const a = r[i],
        b = r[(i + 1) % r.length],
        mx = (a.x + b.x) / 2,
        mz = (a.z + b.z) / 2;
      let nx = -(b.z - a.z),
        nz = b.x - a.x;
      const l = Math.hypot(nx, nz) || 1;
      nx /= l;
      nz /= l;
      if (!SHAPE.inside(mx + nx, mz + nz)) [nx, nz] = [-nx, -nz];
      p.push(a.x, 3.9, a.z, b.x, 3.9, b.z, a.x, -3, a.z, b.x, 3.9, b.z, b.x, -3, b.z, a.x, -3, a.z);
      for (let k = 0; k < 6; k++) n.push(nx, 0, nz);
    }
  const sg = new T.BufferGeometry();
  sg.setAttribute('position', new T.Float32BufferAttribute(p, 3));
  sg.setAttribute('normal', new T.Float32BufferAttribute(n, 3));
  const side = new T.Mesh(
    sg,
    new T.MeshStandardMaterial({ color: '#8a8478', roughness: 0.8, side: T.DoubleSide }),
  );
  side.name = 'terrain-surface';
  group.add(side);
  scene.add(group);
  return group;
}
// A flat oriented strip on the water (terminal, waiting place, berth zone).
export function obbGeometry(o, y) {
  const g = new T.PlaneGeometry(o.hl * 2, o.hw * 2);
  g.rotateX(-Math.PI / 2);
  g.rotateY(Math.atan2(-o.tz, o.tx));
  g.translate(o.cx, y, o.cz);
  return g;
}
