import * as T from '../../vendor/three.js';

// Bake static shapes into spatial tiles: one draw per tile/layer, regardless of
// how many windows, containers or trees it contains. No per-frame allocations.
export class GeometryBatch {
  constructor() {
    this.positions = [];
    this.normals = [];
    this.colors = [];
  }
  add(geometry, matrix, color) {
    const p = geometry.getAttribute('position'),
      n = geometry.getAttribute('normal'),
      index = geometry.index;
    const normalMatrix = new T.Matrix3().getNormalMatrix(matrix),
      point = new T.Vector3(),
      normal = new T.Vector3(),
      c = new T.Color(color);
    for (let i = 0, end = index ? index.count : p.count; i < end; i++) {
      const k = index ? index.getX(i) : i;
      point.fromBufferAttribute(p, k).applyMatrix4(matrix);
      normal.fromBufferAttribute(n, k).applyMatrix3(normalMatrix).normalize();
      this.positions.push(point.x, point.y, point.z);
      this.normals.push(normal.x, normal.y, normal.z);
      this.colors.push(c.r, c.g, c.b);
    }
  }
  geometry() {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(this.positions, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(this.normals, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(this.colors, 3));
    g.computeBoundingSphere();
    return g;
  }
}
const shipMaterial = new T.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.8,
  metalness: 0.06,
  side: T.DoubleSide,
});
export function batchVessel(root) {
  root.updateMatrixWorld(true);
  const batch = new GeometryBatch(),
    parts = [],
    geometries = new Set();
  root.traverse((o) => {
    if (
      o.isMesh &&
      !Array.isArray(o.material) &&
      !o.material.map &&
      o.material.color &&
      (!o.material.emissive || o.material.emissive.getHex() === 0)
    ) {
      batch.add(o.geometry, o.matrixWorld, o.material.color);
      parts.push(o);
      geometries.add(o.geometry);
    }
  });
  if (!parts.length) return root;
  for (const p of parts) p.removeFromParent();
  for (const g of geometries) g.dispose();
  const m = new T.Mesh(batch.geometry(), shipMaterial);
  m.castShadow = m.receiveShadow = true;
  m.name = 'batched-vessel';
  root.add(m);
  return root;
}
