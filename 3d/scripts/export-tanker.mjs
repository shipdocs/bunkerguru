// npm ci; node scripts/export-tanker.mjs
// Runtime uses the same factory, so the GLB and game cannot drift apart.
import { mkdir, writeFile } from 'node:fs/promises';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import * as T from '../vendor/three.js';
import { createBunkerTanker } from '../src/render/bunker-tanker.mjs';
import { PROFILES } from '../src/game/ship-profile.mjs';

globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = `data:${blob.type};base64,${Buffer.from(result).toString('base64')}`;
      this.onloadend?.();
    });
  }
};
const folder = new URL('../assets/vessels/', import.meta.url);
await mkdir(folder, { recursive: true });
for (const editable of [false, true]) {
  const model = createBunkerTanker(PROFILES.legacy, { editable });
  // Runtime handles are deliberately not part of glTF extras.
  delete model.userData.tanker;
  let part = 0,
    triangles = 0,
    meshes = 0;
  model.traverse((o) => {
    if (!o.name) o.name = `${o.parent?.name || 'Tanker'}-part-${++part}`;
    if (o.isMesh) {
      meshes++;
      triangles += (o.geometry.index?.count || o.geometry.attributes.position.count) / 3;
    }
  });
  const rotation = new T.Quaternion(),
    values = [];
  for (let i = 0; i <= 4; i++) {
    rotation.setFromAxisAngle(new T.Vector3(0, 1, 0), (i * Math.PI) / 2);
    values.push(...rotation.toArray());
  }
  const radarAnimation = new T.AnimationClip('Radar-spin', 2.5, [
    new T.QuaternionKeyframeTrack('Radar-rotor.quaternion', [0, 0.625, 1.25, 1.875, 2.5], values),
  ]);
  // Include hidden light assemblies for later switching in other engines/Blender.
  const buffer = await new GLTFExporter().parseAsync(model, {
    binary: true,
    onlyVisible: false,
    animations: [radarAnimation],
  });
  const name = editable ? 'bunkertanker-110-editable.glb' : 'bunkertanker-110.glb';
  await writeFile(new URL(name, folder), Buffer.from(buffer));
  console.log(`${name}: ${buffer.byteLength} bytes, ${meshes} meshes, ${triangles} triangles`);
}
