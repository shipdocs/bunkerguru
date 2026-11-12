import * as T from '../../vendor/three.js';
// Buildings modelled in Blender (blender/models/*.py → assets/landmarks/*.glb). A tiny
// GLB reader for exactly what bglib exports: meshes with plain coloured materials, no
// textures. Every model becomes one geometry with vertex colours (one draw call), plus
// the glowing parts (windows, lamps) as a separate geometry that lights up at night.
// Models load before the world is built; a model that is missing or fails keeps the
// hand-built shape in the game, so the game never waits on or breaks over a model.
const loaded = new Map();
export const modelMaterial = new T.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.8,
  metalness: 0.05,
  side: T.DoubleSide,
});
export const MODEL_NAMES = [
  'euromast',
  'erasmusbrug',
  'hotelny',
  'derotterdam',
  'cubes',
  'markthal',
  'whitehouse',
  'dekuip',
  'maassilo',
  'depot',
  'laurenskerk',
  'zalmhaventoren',
  'willemsbrug',
  'maeslantkering',
];
const folder = new URL('../../assets/landmarks/', import.meta.url);

export function model(name) {
  return loaded.get(name) || null;
}

// Fetch every model, but never take longer than `timeout` ms all together.
export async function preloadModels(names = MODEL_NAMES, timeout = 6000) {
  if (typeof fetch !== 'function') return;
  const one = async (name) => {
    try {
      const r = await fetch(new URL(name + '.glb', folder));
      if (!r.ok) return;
      loaded.set(name, parseGlb(await r.arrayBuffer()));
    } catch (error) {
      console.warn('model', name, error);
    }
  };
  await Promise.race([
    Promise.all(names.map(one)),
    new Promise((done) => setTimeout(done, timeout)),
  ]);
}

const COMPONENTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const ARRAYS = {
  5121: Uint8Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array,
};
// → { body: BufferGeometry, glow: BufferGeometry | null, size: {x, y, z} }
export function parseGlb(buffer) {
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== 0x46546c67) throw new Error('not a GLB file');
  let json = null,
    bin = null;
  for (let at = 12; at < view.byteLength; ) {
    const len = view.getUint32(at, true),
      type = view.getUint32(at + 4, true);
    if (type === 0x4e4f534a)
      json = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, at + 8, len)));
    else if (type === 0x004e4942) bin = buffer.slice(at + 8, at + 8 + len);
    at += 8 + len;
  }
  if (!json || !bin) throw new Error('GLB without json or binary chunk');
  const read = (i) => {
    const a = json.accessors[i],
      bv = json.bufferViews[a.bufferView],
      n = COMPONENTS[a.type],
      Arr = ARRAYS[a.componentType];
    if (bv.byteStride && bv.byteStride !== n * Arr.BYTES_PER_ELEMENT)
      throw new Error('interleaved buffers are not supported');
    return new Arr(bin, (bv.byteOffset || 0) + (a.byteOffset || 0), a.count * n);
  };
  const parts = { body: { p: [], n: [], c: [] }, glow: { p: [], n: [], c: [] } };
  const v = new T.Vector3(),
    normalMatrix = new T.Matrix3();
  const walk = (index, parent) => {
    const node = json.nodes[index],
      m = new T.Matrix4();
    if (node.matrix) m.fromArray(node.matrix);
    else
      m.compose(
        new T.Vector3(...(node.translation || [0, 0, 0])),
        new T.Quaternion(...(node.rotation || [0, 0, 0, 1])),
        new T.Vector3(...(node.scale || [1, 1, 1])),
      );
    m.premultiply(parent);
    if (node.mesh !== undefined) {
      normalMatrix.getNormalMatrix(m);
      for (const prim of json.meshes[node.mesh].primitives) {
        if ((prim.mode ?? 4) !== 4) continue;
        const mat = json.materials?.[prim.material] || {},
          base = mat.pbrMetallicRoughness?.baseColorFactor || [0.8, 0.8, 0.8, 1],
          glow = (mat.emissiveFactor || [0, 0, 0]).some((e) => e > 0.2),
          out = glow ? parts.glow : parts.body,
          pos = read(prim.attributes.POSITION),
          nor = prim.attributes.NORMAL !== undefined ? read(prim.attributes.NORMAL) : null,
          idx = prim.indices !== undefined ? read(prim.indices) : null,
          count = idx ? idx.length : pos.length / 3;
        for (let k = 0; k < count; k++) {
          const i = idx ? idx[k] : k;
          v.fromArray(pos, i * 3).applyMatrix4(m);
          out.p.push(v.x, v.y, v.z);
          if (nor)
            v.fromArray(nor, i * 3)
              .applyMatrix3(normalMatrix)
              .normalize();
          else v.set(0, 1, 0);
          out.n.push(v.x, v.y, v.z);
          out.c.push(base[0], base[1], base[2]);
        }
      }
    }
    for (const c of node.children || []) walk(c, m);
  };
  const scene = json.scenes[json.scene || 0];
  for (const root of scene.nodes) walk(root, new T.Matrix4());
  const geo = (part, colours) => {
    if (!part.p.length) return null;
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(part.p, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(part.n, 3));
    if (colours) g.setAttribute('color', new T.Float32BufferAttribute(part.c, 3));
    g.computeBoundingBox();
    g.computeBoundingSphere();
    return g;
  };
  const body = geo(parts.body, true);
  if (!body) throw new Error('model without solid parts');
  const size = body.boundingBox.getSize(new T.Vector3());
  return { body, glow: geo(parts.glow, false), size: { x: size.x, y: size.y, z: size.z } };
}
