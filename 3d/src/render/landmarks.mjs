import * as T from '../../vendor/three.js';
import { MAP, landAt } from '../maps/index.mjs';
// Landmarks (fase 3): one or two tall shapes per harbour you can steer by, as in the
// real port — the Euromast in Rotterdam, the cathedral spire in Antwerp, the
// Maeslantkering at the mouth of the Nieuwe Waterweg, the tower across the IJ.
// Simple toy shapes, a name label and a red aviation light that shows at night.
// Positions are map metres on land, checked in tests (landmarkSpots).
export const LANDMARKS = {
  amsterdam: [
    { kind: 'tower', name: "A'DAM Toren", x: 2250, z: -420 },
    { kind: 'mill', name: 'Molen', x: -900, z: -520 },
  ],
  rotterdam: [{ kind: 'euromast', name: 'Euromast', x: -680, z: -560 }],
  europoort: [
    { kind: 'barrier', name: 'Maeslantkering', x: -2700, z: 0 },
    { kind: 'turbines', name: 'Windpark', x: 2300, z: 1700 },
  ],
  antwerpen: [
    { kind: 'cathedral', name: 'Kathedraal', x: 1050, z: -620 },
    { kind: 'castle', name: 'Het Steen', x: 820, z: -260 },
  ],
};
// Footprints that must stand on land (the barrier's two arms sit on either bank).
export function landmarkSpots(id = MAP.id) {
  const RH = MAP.riverHalf;
  return (LANDMARKS[id] || []).flatMap((l) =>
    l.kind === 'barrier'
      ? [
          { x: l.x, z: -RH - 60 },
          { x: l.x, z: RH + 60 },
        ]
      : [{ x: l.x, z: l.z }],
  );
}

export function createLandmarks(scene, { box, cyl, mesh, textSprite }) {
  const root = new T.Group();
  root.name = 'landmarks';
  scene.add(root);
  const spinners = [];
  const redLight = new T.MeshBasicMaterial({ color: '#ff3b2f' });
  const beacon = (x, y, z, p = root) => mesh(new T.SphereGeometry(1.6, 8, 6), redLight, x, y, z, p);
  const label = (name, x, y, z) => textSprite(name, x, y, z, 46, '#fff1c9', root, 0.12);
  const cone = (r, h, c, x, y, z, seg = 8, p = root) =>
    mesh(new T.ConeGeometry(r, h, seg), c, x, y, z, p);

  for (const l of LANDMARKS[MAP.id] || []) {
    const { x, z } = l;
    if (l.kind === 'euromast') {
      // Concrete shaft, the crow's nest, and the thin Space Tower on top: 185 m.
      cyl(5.5, 100, '#e7e1d2', x, 50, z, root);
      cyl(13, 7, '#d8d1bf', x, 96, z, root);
      cyl(2.4, 80, '#c9ccd2', x, 139, z, root);
      beacon(x, 180, z);
      label(l.name, x, 196, z);
    } else if (l.kind === 'tower') {
      // A dark office tower with a red-lit crown.
      box(30, 82, 30, '#323a47', x, 41, z, root);
      box(36, 10, 36, '#262c36', x, 86, z, root);
      box(37, 3, 37, '#c0392b', x, 92, z, root);
      beacon(x, 96, z);
      label(l.name, x, 110, z);
    } else if (l.kind === 'mill') {
      // A Dutch windmill: tapered body, cap and four sails that keep turning.
      mesh(new T.CylinderGeometry(5, 8.5, 24, 8), '#5b4a3a', x, 12, z, root);
      cone(6.5, 6, '#3f3329', x, 27, z, 8);
      const sails = new T.Group();
      sails.position.set(x, 26, z - 7.5);
      for (let i = 0; i < 4; i++) {
        const arm = box(2.6, 20, 0.6, '#efe6d2', 0, 10, 0, new T.Group());
        arm.parent.rotation.z = (i * Math.PI) / 2;
        sails.add(arm.parent);
      }
      root.add(sails);
      spinners.push({ o: sails, axis: 'z', speed: 0.6 });
      label(l.name, x, 46, z);
    } else if (l.kind === 'turbines') {
      // Three tall wind turbines along the quay.
      for (let i = 0; i < 3; i++) {
        const tx = x + (i - 1) * 140;
        cyl(2.2, 90, '#f3f4f2', tx, 45, z, root);
        box(5, 5, 10, '#e6e8e6', tx, 91, z, root);
        const rotor = new T.Group();
        rotor.position.set(tx, 91, z - 6);
        for (let k = 0; k < 3; k++) {
          const g = new T.Group();
          box(2.2, 38, 0.6, '#f8f8f6', 0, 19, 0, g);
          g.rotation.z = (k * Math.PI * 2) / 3;
          rotor.add(g);
        }
        rotor.rotation.z = i;
        root.add(rotor);
        spinners.push({ o: rotor, axis: 'z', speed: 0.9 + i * 0.1 });
        beacon(tx, 96, z);
      }
      label(l.name, x, 140, z);
    } else if (l.kind === 'cathedral') {
      // Nave, the tall tower and its spire: 123 m above Antwerp.
      box(34, 30, 70, '#b8ab90', x, 15, z + 30, root);
      cone(26, 14, '#6d6a66', x, 37, z + 30, 4).rotation.y = Math.PI / 4;
      box(16, 72, 16, '#c3b699', x, 36, z, root);
      mesh(new T.CylinderGeometry(5, 8, 22, 8), '#b3a68b', x, 83, z, root);
      cone(5, 30, '#9c917a', x, 109, z, 8);
      beacon(x, 125, z);
      label(l.name, x, 138, z);
    } else if (l.kind === 'castle') {
      // Het Steen: a squat stone castle on the quay with pointed turrets.
      box(44, 16, 28, '#8e8a80', x, 8, z, root);
      box(20, 12, 18, '#9a958a', x - 4, 22, z, root);
      for (const [dx, dz] of [
        [-20, -12],
        [20, -12],
        [20, 12],
      ]) {
        cyl(4.5, 24, '#9a958a', x + dx, 12, z + dz, root);
        cone(5.5, 9, '#3d4652', x + dx, 28.5, z + dz, 8);
      }
      label(l.name, x, 48, z);
    } else if (l.kind === 'barrier') {
      // Maeslantkering: two white gate arms on the banks, each braced back to a
      // ball joint by a lattice of beams. The yellow-red marks the gate faces.
      const RH = MAP.riverHalf;
      for (const side of [-1, 1]) {
        const gz = side * (RH + 22),
          jz = side * (RH + 230);
        box(240, 22, 6, '#f2f2ee', x, 11, gz, root);
        box(240, 2, 6.4, '#e0a42b', x, 21, gz, root);
        mesh(new T.SphereGeometry(8, 12, 8), '#d9dad6', x + 120, 9, jz, root);
        for (const ex of [-120, 0, 120]) {
          for (const ey of [2, 20]) {
            const a = new T.Vector3(x + ex, ey, gz),
              b = new T.Vector3(x + 120, 9, jz);
            const m = mesh(
              new T.CylinderGeometry(1.4, 1.4, a.distanceTo(b), 6),
              '#f2f2ee',
              0,
              0,
              0,
              root,
            );
            m.position.copy(a).add(b).multiplyScalar(0.5);
            m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.clone().sub(a).normalize());
          }
        }
        beacon(x + 120, 20, jz);
      }
      label(l.name, x, 60, -RH - 120);
    }
  }
  return {
    root,
    update(time) {
      for (const sp of spinners) sp.o.rotation[sp.axis] = time * sp.speed;
    },
    onLand: () => landmarkSpots().every((p) => landAt(p.x, p.z)),
  };
}
