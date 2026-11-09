// Builds the scenery and landmarks of the map in BUNKERGURU_MAP and prints one JSON
// line: budgets and problems (landmark off land or in a berth, NaN in geometry).
globalThis.document = {
  createElement: () => ({
    getContext: () =>
      new Proxy({}, { get: (o, k) => o[k] ?? (() => {}), set: (o, k, v) => ((o[k] = v), true) }),
  }),
};
const T = await import('../../vendor/three.js');
const { MAP, landAt, terminals, waits, customers, inRect } =
  await import('../../src/maps/index.mjs');
const { createHarborScenery } = await import('../../src/render/scenery.mjs');
const { createLandmarks, landmarkSpots, LANDMARKS } =
  await import('../../src/render/landmarks.mjs');
const { createPrimitives } = await import('../../src/render/primitives.mjs');
const scene = new T.Scene(),
  problems = [];
const scenery = createHarborScenery(scene),
  lm = createLandmarks(scene, createPrimitives(scene));
for (const p of landmarkSpots())
  if (!landAt(p.x, p.z)) problems.push(`landmark off land at ${p.x},${p.z}`);
// A landmark is scenery: its centre never stands in a berth, terminal or waiting place.
for (const l of LANDMARKS[MAP.id] || []) {
  const x = l.s * MAP.sn.k - MAP.sn.cx,
    z = l.n * MAP.sn.k;
  if (l.kind === 'barrier' || l.kind === 'liftbridge') continue;
  for (const zone of [...terminals, ...waits, ...customers.map((c) => c.zone)])
    if (inRect(zone, x, z, 5)) problems.push(`${l.kind} ${l.name} stands in a berth`);
}
let triangles = 0;
scene.traverse((o) => {
  const p = o.geometry?.getAttribute?.('position');
  if (!p) return;
  if (o.name === 'landmark') triangles += p.count / 3;
  for (const n of p.array)
    if (!Number.isFinite(n)) {
      problems.push('NaN in ' + o.name);
      break;
    }
});
lm.update(12.5, { x: 0.4, z: -0.2 });
console.log(
  JSON.stringify({
    id: MAP.id,
    problems,
    landmarks: lm.stats.count,
    landmarkTriangles: triangles,
    scenery: scenery.stats,
  }),
);
