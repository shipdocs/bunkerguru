import * as T from '../../vendor/three.js';
import { hullOutline } from '../game/ship-profile.mjs';
import { batchVessel } from './scene-batch.mjs';
import { buildBunkerTanker } from './bunker-tanker.mjs';
export function createShipFactory(scene, { mesh, box, cyl, beam, textSprite }) {
  // Low-poly hulls with decks, pipes, railings, accommodation and wheelhouse.
  function ship(length, width, color, tanker = false, playerProfile = null, opts = {}) {
    // Bunker boats (yours, the rivals', your fleet): the detailed Rotterdam tanker.
    if (tanker && playerProfile) {
      const t = buildBunkerTanker({ mesh, box, cyl, beam }, playerProfile, {
        color,
        name: opts.name,
      });
      batchVessel(t);
      scene.add(t);
      return t;
    }
    const g = new T.Group();
    const sh = new T.Shape();
    sh.moveTo(-width * 0.4, length * 0.5);
    sh.lineTo(-width * 0.5, length * 0.38);
    sh.lineTo(-width * 0.5, -length * 0.32);
    sh.quadraticCurveTo(-width * 0.45, -length * 0.49, 0, -length * 0.53);
    sh.quadraticCurveTo(width * 0.45, -length * 0.49, width * 0.5, -length * 0.32);
    sh.lineTo(width * 0.5, length * 0.38);
    sh.lineTo(width * 0.4, length * 0.5);
    sh.closePath();
    if (playerProfile) {
      sh.curves = [];
      sh.currentPoint.set(0, 0);
      for (const [method, ...args] of hullOutline(playerProfile)) sh[method](...args);
      sh.closePath();
    }
    const hull = mesh(
      new T.ExtrudeGeometry(sh, {
        depth: tanker ? 3 : 7,
        bevelEnabled: true,
        bevelSize: playerProfile ? 0 : 0.5,
        bevelThickness: playerProfile ? 0 : 0.5,
        bevelSegments: 1,
        steps: 1,
      }),
      color,
      0,
      tanker ? 2.4 : 6,
      0,
      g,
    );
    hull.rotation.x = Math.PI / 2;
    const deck = mesh(new T.ShapeGeometry(sh), '#637f7c', 0, tanker ? 2.8 : 6.5, 0, g);
    deck.rotation.x = Math.PI / 2;
    deck.material.side = T.DoubleSide;
    const y = tanker ? 3 : 7;
    for (let side of [-1, 1]) {
      beam(
        [side * width * 0.46, y + 0.8, length * 0.35],
        [side * width * 0.46, y + 0.8, -length * 0.32],
        0.12,
        '#e2d9b8',
        g,
      );
      for (let z = -length * 0.3; z < length * 0.4; z += length / 12)
        beam([side * width * 0.46, y, z], [side * width * 0.46, y + 1, z], 0.09, '#dddcc1', g);
    }
    box(width * 0.8, 3.5, length * 0.15, '#ebe9d5', 0, y + 1.7, length * 0.31, g);
    box(width * 0.72, 2.4, length * 0.1, '#eeeede', 0, y + 4.6, length * 0.28, g);
    box(width * 0.75, 0.35, length * 0.115, '#d8dbcd', 0, y + 6, length * 0.28, g);
    box(width * 0.62, 1.4, 0.12, '#31515d', 0, y + 4.7, length * 0.229, g);
    for (let side of [-1, 1])
      box(0.12, 1.3, length * 0.065, '#31515d', side * width * 0.365, y + 4.7, length * 0.28, g);
    cyl(0.35, 5, '#d2d4c1', 0, y + 8, length * 0.31, g);
    beam([-2, y + 8, length * 0.31], [2, y + 8, length * 0.31], 0.13, '#ede4c6', g);
    box(1.4, 4, 1.6, '#e19b54', width * 0.23, y + 4, length * 0.39, g);
    box(1.6, 0.5, 1.8, '#253f45', width * 0.23, y + 6, length * 0.39, g);
    if (tanker) {
      for (let z = -length * 0.28; z < length * 0.16; z += 5) {
        cyl(1.25, 0.65, '#d3d6c5', 0, y + 0.4, z, g);
        box(width * 0.65, 0.18, 0.25, '#d8c48f', 0, y + 0.7, z, g);
      }
      for (let x of [-1.5, -0.7, 0.7, 1.5])
        beam([x, y + 0.5, -length * 0.35], [x, y + 0.5, length * 0.16], 0.18, '#d4bd83', g);
      for (let z of [-length * 0.32, length * 0.15])
        box(width * 0.7, 0.5, 2, '#dd9653', 0, y + 0.5, z, g);
    } else {
      for (let z = -length * 0.28; z < length * 0.16; z += 15) {
        box(width * 0.75, 1.5, 12, '#7a9999', 0, y + 0.8, z, g);
        box(width * 0.78, 0.3, 12.5, '#a5bab4', 0, y + 1.7, z, g);
      }
    }
    for (let side of [-1, 1])
      for (let z = -length * 0.2; z < length * 0.4; z += length * 0.15) {
        const f = cyl(0.7, 1.2, '#1d3036', side * width * 0.51, y - 1, z, g);
        f.rotation.z = Math.PI / 2;
      }
    // Deck fittings use the same vessel dimensions as the hull.
    if (tanker) {
      for (const side of [-1, 1]) {
        box(0.1, 1.45, length * 0.1, '#234650', side * width * 0.366, y + 4.7, length * 0.28, g);
        for (let k = 0; k < 4; k++)
          box(
            0.15,
            1.6,
            0.12,
            '#e8e6d8',
            side * width * 0.38,
            y + 4.7,
            length * (0.235 + k * 0.03),
            g,
          );
        for (const end of [-0.38, 0.43]) {
          box(1.5, 0.25, 1.2, '#3c5559', side * width * 0.28, y + 0.1, length * end, g);
          cyl(0.18, 0.65, '#263c40', side * width * 0.28 - 0.35, y + 0.45, length * end, g);
          cyl(0.18, 0.65, '#263c40', side * width * 0.28 + 0.35, y + 0.45, length * end, g);
        }
      }
      box(width * 0.65, 0.14, length * 0.5, '#46615f', 0, y + 0.06, -length * 0.09, g);
      for (let z = -length * 0.3; z < length * 0.1; z += length * 0.1) {
        cyl(0.55, 0.25, '#b9c2ae', 0, y + 0.3, z, g);
        cyl(0.23, 0.35, '#ce8851', width * 0.2, y + 0.5, z, g);
      }
      for (const z of [-length * 0.12, length * 0.1]) {
        const reel = mesh(
          new T.TorusGeometry(0.8, 0.22, 6, 16),
          '#253d40',
          -width * 0.25,
          y + 1,
          z,
          g,
        );
        reel.rotation.y = Math.PI / 2;
        box(0.8, 0.3, 2, '#bb8655', -width * 0.25, y + 0.15, z, g);
      }
      beam(
        [width * 0.3, y + 0.3, length * 0.1],
        [width * 0.3, y + 3, length * 0.1],
        0.18,
        '#dda758',
        g,
      );
      beam(
        [width * 0.3, y + 3, length * 0.1],
        [width * 0.1, y + 3.8, -length * 0.04],
        0.16,
        '#dda758',
        g,
      );
      for (const side of [-1, 1]) {
        const ring = mesh(
          new T.TorusGeometry(0.4, 0.12, 6, 12),
          '#e6894d',
          side * width * 0.405,
          y + 2,
          length * 0.31,
          g,
        );
        ring.rotation.y = Math.PI / 2;
      }
      box(width * 0.6, 0.15, length * 0.08, '#56737a', 0, y + 6.25, length * 0.28, g);
    }
    textSprite(
      tanker ? 'BUNKERGURU' : 'BULK CARRIER',
      0,
      y + 2,
      -length * 0.37,
      tanker ? 8 : 15,
      '#faf4d7',
      g,
    );
    for (const side of [-1, 1]) {
      const lightMat = new T.MeshStandardMaterial({
        color: side < 0 ? '#ff5940' : '#59e6aa',
        emissive: side < 0 ? '#ff2200' : '#00bb66',
        emissiveIntensity: 1.5,
      });
      mesh(new T.SphereGeometry(0.25, 8, 6), lightMat, side * width * 0.4, y + 5, length * 0.26, g);
    }
    batchVessel(g);
    scene.add(g);
    return g;
  }

  return ship;
}
