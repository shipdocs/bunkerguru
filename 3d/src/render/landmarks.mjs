import * as T from '../../vendor/three.js';
import { MAP, landAt } from '../maps/index.mjs';
import { GeometryBatch } from './scene-batch.mjs';
// Landmarks: the shapes you steer by in the real port. Cartoon models, but each one
// stands where it stands on the harbour chart, in the s/n units of the 2D map
// (s along the river from the sea, n across, n < 0 = north bank), so a position can
// be checked against maps/*.js. r = footprint radius that is kept free of houses,
// tanks and trees. Positions must be on land (landmarkSpots, tests).
export const LANDMARKS = {
  rotterdam: [
    { kind: 'euromast', name: 'Euromast', s: 1540, n: -400, r: 40 },
    { kind: 'depot', name: 'Depot Boijmans', s: 1800, n: -640, r: 45 },
    { kind: 'mill', name: 'Delfshaven', s: 1110, n: -700, r: 22, body: '#6b4a38' },
    {
      kind: 'highrise',
      name: 'Zalmhaventoren',
      s: 2130,
      n: -340,
      r: 30,
      h: 215,
      w: 24,
      c: '#f1efe8',
      crown: '#d7dde2',
    },
    { kind: 'highrise', name: '', s: 2075, n: -350, r: 22, h: 70, w: 22, c: '#e9e4d8' },
    { kind: 'whitehouse', name: 'Witte Huis', s: 2660, n: -330, r: 20 },
    { kind: 'cubes', name: 'Kubuswoningen', s: 2640, n: -430, r: 34 },
    { kind: 'markthal', name: 'Markthal', s: 2540, n: -560, r: 62 },
    {
      kind: 'church',
      name: 'Laurenskerk',
      s: 2440,
      n: -700,
      r: 40,
      h: 65,
      c: '#b9a98c',
      blunt: true,
    },
    {
      kind: 'highrise',
      name: '',
      s: 2330,
      n: -640,
      r: 24,
      h: 150,
      w: 26,
      c: '#8fa6b8',
      crown: '#6f8798',
    },
    { kind: 'highrise', name: '', s: 2250, n: -760, r: 24, h: 130, w: 24, c: '#c9b79a' },
    { kind: 'highrise', name: '', s: 2380, n: -820, r: 24, h: 105, w: 28, c: '#7f93a3' },
    { kind: 'derotterdam', name: 'De Rotterdam', s: 2490, n: 330, r: 55 },
    { kind: 'hotelny', name: 'Hotel New York', s: 2385, n: 300, r: 26 },
    {
      kind: 'highrise',
      name: 'Maastoren',
      s: 2590,
      n: 440,
      r: 26,
      h: 165,
      w: 26,
      c: '#4c5560',
      crown: '#3a424c',
    },
    { kind: 'highrise', name: '', s: 2440, n: 450, r: 22, h: 124, w: 22, c: '#a9553f' },
    { kind: 'highrise', name: '', s: 2530, n: 560, r: 22, h: 95, w: 24, c: '#d9d2c2' },
    { kind: 'silo', name: 'Maassilo', s: 1660, n: 700, r: 45 },
    { kind: 'stadium', name: 'De Kuip', s: 3900, n: 850, r: 85 },
  ],
  europoort: [
    { kind: 'barrier', name: 'Maeslantkering', s: -500, n: 0 },
    { kind: 'turbines', name: 'Windpark Landtong', s: 60, n: 285, r: 20, count: 5, gap: 130 },
    {
      kind: 'church',
      name: 'Groote Kerk Maassluis',
      s: 150,
      n: -330,
      r: 30,
      h: 48,
      c: '#a9805e',
      dome: true,
    },
    { kind: 'mill', name: 'Molen De Hoop', s: 230, n: -600, r: 22 },
    { kind: 'radar', name: 'Verkeerspost', s: 880, n: -205, r: 14 },
    { kind: 'mill', name: 'Rozenburg', s: 820, n: 300, r: 22 },
    { kind: 'refinery', name: 'Europoort', s: 250, n: 900, r: 100 },
    { kind: 'refinery', name: 'Botlek', s: 1330, n: 520, r: 100 },
    { kind: 'liftbridge', name: 'Botlekbrug', s: 1650, n: 1250, s0: 1480, s1: 1820 },
    {
      kind: 'church',
      name: 'Grote Kerk Vlaardingen',
      s: 2400,
      n: -430,
      r: 30,
      h: 50,
      c: '#b08b6a',
    },
    { kind: 'refinery', name: 'Shell Pernis', s: 2950, n: 620, r: 110, big: true },
    { kind: 'refinery', name: '', s: 3350, n: 1050, r: 100 },
    { kind: 'cooling', name: '', s: 2380, n: 700, r: 60, count: 1, h: 70 },
    { kind: 'tallmills', name: 'Schiedamse molens', s: 3610, n: -480, r: 70 },
    { kind: 'gantry', name: 'Wilton-Fijenoord', s: 3890, n: -330, r: 30 },
    { kind: 'highrise', name: '', s: 4700, n: -520, r: 24, h: 110, w: 24, c: '#8fa6b8' },
    { kind: 'highrise', name: '', s: 4900, n: -640, r: 24, h: 140, w: 24, c: '#e9e4d8' },
  ],
  amsterdam: [
    { kind: 'steel', name: 'Hoogovens', s: -150, n: -520, r: 110 },
    { kind: 'turbines', name: 'Windpark Westpoort', s: 30, n: 250, r: 20, count: 2, gap: 120 },
    { kind: 'turbines', name: '', s: 660, n: 250, r: 20, count: 2, gap: 120 },
    { kind: 'mill', name: 'Nauerna', s: 900, n: -420, r: 22 },
    { kind: 'coal', name: 'Kolenoverslag', s: 1700, n: 560, r: 110 },
    { kind: 'zaanhotel', name: 'Zaandam', s: 2260, n: -420, r: 30 },
    { kind: 'mills', name: 'Zaanse molens', s: 2420, n: -260, r: 20, count: 4, gap: 75 },
    { kind: 'plant', name: 'Hemwegcentrale', s: 2900, n: 800, r: 70 },
    { kind: 'refinery', name: '', s: 2450, n: 700, r: 95 },
    { kind: 'silo', name: 'Graansilo', s: 3900, n: 300, r: 45 },
    { kind: 'hammercrane', name: 'NDSM-werf', s: 4250, n: -300, r: 70 },
    { kind: 'rem', name: 'REM-eiland', s: 4400, n: 230, r: 16 },
    { kind: 'pontsteiger', name: 'Pontsteiger', s: 4560, n: 300, r: 50 },
    { kind: 'tower', name: "A'DAM Toren", s: 4620, n: -330, r: 30 },
    { kind: 'highrise', name: 'Sloterdijk', s: 4000, n: 800, r: 24, h: 95, w: 26, c: '#7f93a3' },
    { kind: 'highrise', name: '', s: 4080, n: 880, r: 24, h: 75, w: 24, c: '#d9d2c2' },
  ],
  antwerpen: [
    {
      kind: 'cooling',
      name: 'Kerncentrale Doel',
      s: 60,
      n: 620,
      r: 130,
      count: 2,
      h: 120,
      domes: true,
    },
    { kind: 'radar', name: 'Radartoren Zandvliet', s: 190, n: -260, r: 14 },
    { kind: 'refinery', name: 'BASF', s: 800, n: -620, r: 110, big: true },
    { kind: 'turbines', name: 'Windpark Linkeroever', s: 1040, n: 330, r: 20, count: 1, gap: 150 },
    { kind: 'fort', name: 'Fort Liefkenshoek', s: 1240, n: 185, r: 0, small: true },
    { kind: 'fort', name: 'Fort Lillo', s: 1700, n: -420, r: 80 },
    { kind: 'mill', name: 'De Eenhoorn', s: 1560, n: -280, r: 22, body: '#f2efe6' },
    { kind: 'turbines', name: '', s: 2350, n: 420, r: 20, count: 3, gap: 140 },
    { kind: 'havenhuis', name: 'Havenhuis', s: 2760, n: -520, r: 50 },
    { kind: 'castle', name: 'Het Steen', s: 3020, n: -250, r: 34 },
    { kind: 'cathedral', name: 'Kathedraal', s: 3250, n: -520, r: 50 },
    { kind: 'boerentoren', name: 'Boerentoren', s: 3360, n: -660, r: 26 },
    { kind: 'slabs', name: 'Linkeroever', s: 3250, n: 520, r: 70 },
    { kind: 'mas', name: 'MAS', s: 3760, n: -330, r: 28 },
    { kind: 'refinery', name: 'Petroleum Zuid', s: 4320, n: -700, r: 100 },
  ],
};
const toX = (s) => s * MAP.sn.k - MAP.sn.cx,
  toZ = (n) => n * MAP.sn.k;
const list = (id) =>
  (LANDMARKS[id] || []).map((l) => ({ ...l, x: toX(l.s), z: toZ(l.n), r: (l.r || 0) * MAP.sn.k }));
// Footprints that must stand on land (barrier arms and bridge towers on either bank).
export function landmarkSpots(id = MAP.id) {
  const RH = MAP.riverHalf;
  return list(id).flatMap((l) =>
    l.kind === 'barrier'
      ? [
          { x: l.x, z: -RH - 60 },
          { x: l.x, z: RH + 60 },
        ]
      : l.kind === 'liftbridge'
        ? [
            { x: toX(l.s0) - 14, z: l.z },
            { x: toX(l.s1) + 14, z: l.z },
          ]
        : [{ x: l.x, z: l.z }],
  );
}
// Scenery keeps this ground free: no house inside a cooling tower.
const clearList = list(MAP.id).filter((l) => l.r > 0);
export const landmarkClear = (x, z, pad = 0) =>
  clearList.some((l) => Math.hypot(x - l.x, z - l.z) < l.r + pad);

const G = {
  box: new T.BoxGeometry(1, 1, 1),
  cyl: new T.CylinderGeometry(1, 1, 1, 14),
  cone: new T.ConeGeometry(1, 1, 14),
  pyr: new T.ConeGeometry(1, 1, 4),
  sph: new T.SphereGeometry(1, 12, 8),
  ico: new T.IcosahedronGeometry(1, 0),
  oct: new T.OctahedronGeometry(1, 0),
};
const taper = new Map();
const taperGeo = (top, seg = 14) => {
  const k = top.toFixed(2) + ':' + seg;
  if (!taper.has(k)) taper.set(k, new T.CylinderGeometry(top, 1, 1, seg));
  return taper.get(k);
};
// Hyperboloid cooling tower, unit height and base radius.
const coolingGeo = new T.LatheGeometry(
  [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1].map(
    (t) => new T.Vector2(0.62 + 0.38 * Math.pow(1 - t / 0.78, 2) * (t < 0.78 ? 1 : 0.35), t),
  ),
  18,
);
coolingGeo.computeVertexNormals();
// Market hall: a horseshoe arch, unit width/height/depth.
const archGeo = (() => {
  const sh = new T.Shape();
  sh.moveTo(-0.5, 0);
  sh.lineTo(-0.5, 0.45);
  sh.absarc(0, 0.45, 0.5, Math.PI, 0, true);
  sh.lineTo(0.5, 0);
  sh.lineTo(0.3, 0);
  sh.lineTo(0.3, 0.42);
  sh.absarc(0, 0.42, 0.3, 0, Math.PI, false);
  sh.lineTo(-0.3, 0);
  sh.closePath();
  const g = new T.ExtrudeGeometry(sh, { depth: 1, bevelEnabled: false, curveSegments: 10 });
  g.translate(0, 0, -0.5);
  g.scale(1, 1 / 0.95, 1);
  return g;
})();
const halfRing = new T.TorusGeometry(1, 0.035, 5, 20, Math.PI);

// One landmark = one draw: every part is baked into a vertex-coloured batch.
const kitMaterial = new T.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.85,
  metalness: 0.04,
  side: T.DoubleSide,
});
class Kit {
  constructor() {
    this.b = new GeometryBatch();
    this.o = new T.Object3D();
    this.n = 0;
  }
  // y = underside of the part (ground = 0).
  put(g, c, x, y, z, sx, sy, sz, ry = 0, rx = 0, rz = 0, centre = false) {
    this.o.position.set(x, centre ? y : y + sy / 2, z);
    this.o.rotation.set(rx, ry, rz);
    this.o.scale.set(sx, sy, sz);
    this.o.updateMatrix();
    this.b.add(g, this.o.matrix, c);
    this.n++;
    return this;
  }
  box(w, h, d, c, x, y, z, ry = 0) {
    return this.put(G.box, c, x, y, z, w, h, d, ry);
  }
  cyl(r, h, c, x, y, z, top = 1, seg = 14) {
    return this.put(top === 1 ? G.cyl : taperGeo(top, seg), c, x, y, z, r, h, r);
  }
  cone(r, h, c, x, y, z) {
    return this.put(G.cone, c, x, y, z, r, h, r);
  }
  pyr(w, h, d, c, x, y, z) {
    return this.put(G.pyr, c, x, y, z, w * 0.7071, h, d * 0.7071, Math.PI / 4);
  }
  ball(r, c, x, y, z, sy = 1) {
    return this.put(G.sph, c, x, y, z, r, r * sy, r, 0, 0, 0, true);
  }
  beam(a, b, r, c) {
    const A = new T.Vector3(...a),
      B = new T.Vector3(...b),
      d = B.clone().sub(A);
    this.o.position.copy(A).add(B).multiplyScalar(0.5);
    this.o.scale.set(r, d.length(), r);
    this.o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
    this.o.updateMatrix();
    this.b.add(G.cyl, this.o.matrix, c);
    this.o.quaternion.identity();
    return this;
  }
  // A tower block with window bands on all four sides.
  tower(w, h, d, c, x, y, z, glass = '#4f7184', step = 7) {
    this.box(w, h, d, c, x, y, z);
    for (let b = y + 4; b < y + h - 3; b += step)
      this.box(w + 0.4, step * 0.42, d + 0.4, glass, x, b, z);
    return this;
  }
  mesh(parent, x = 0, y = 0, z = 0) {
    const m = new T.Mesh(this.b.geometry(), kitMaterial);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    m.name = 'landmark';
    parent.add(m);
    return m;
  }
}
const GROUND = 4; // top of the land

export function createLandmarks(scene, { mesh, textSprite }) {
  const root = new T.Group();
  root.name = 'landmarks';
  scene.add(root);
  const spinners = [],
    puffs = [],
    flames = [];
  const stats = { count: 0, parts: 0 };
  const redLight = new T.MeshBasicMaterial({ color: '#ff3b2f' }),
    flameMat = new T.MeshBasicMaterial({ color: '#ffb23c' }),
    steamMat = new T.MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    }),
    smokeMat = new T.MeshBasicMaterial({
      color: '#8d8a86',
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
  // Lights, plumes, flames and rotors are placed relative to the landmark being built.
  let ox = 0,
    oz = 0;
  const beaconGeo = new T.SphereGeometry(1.6, 8, 6);
  const beacon = (x, y, z) => mesh(beaconGeo, redLight, ox + x, GROUND + y, oz + z, root);
  const label = (name, x, y, z) =>
    name && textSprite(name, x, GROUND + y, z, 46, '#fff1c9', root, 0.1);
  // Rising steam or smoke: a few soft balls that climb, swell and start again.
  const plume = (x, y, z, size, rise, mat = steamMat, n = 4) => {
    for (let i = 0; i < n; i++) {
      const m = mesh(G.ico, mat, ox + x, GROUND + y, oz + z, root);
      m.castShadow = m.receiveShadow = false;
      puffs.push({ m, x: ox + x, y: GROUND + y, z: oz + z, size, rise, off: i / n });
    }
  };
  const flame = (x, y, z, size = 5) => {
    const m = mesh(G.cone, flameMat, ox + x, GROUND + y, oz + z, root);
    m.castShadow = false;
    flames.push({ m, size, y: GROUND + y, ph: ox + x });
  };
  const spinner = (kit, x, y, z, speed, axis = 'z') => {
    const grp = new T.Group();
    grp.position.set(ox + x, GROUND + y, oz + z);
    kit.mesh(grp);
    root.add(grp);
    spinners.push({ o: grp, axis, speed, ph: (ox + x) * 0.01 });
    stats.parts += kit.n;
  };
  const windmill = (k, x, z, f, s = 1, body = '#5b4a3a', cap = '#3f3329', y0 = 0) => {
    k.cyl(8.5 * s, 24 * s, body, x, y0, z, 0.6, 8);
    k.cyl(9.5 * s, 1.2, '#e9dfc8', x, y0 + 9 * s, z, 1, 8);
    k.cone(6.5 * s, 6 * s, cap, x, y0 + 24 * s, z);
    const sails = new Kit();
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      sails.put(
        G.box,
        '#efe6d2',
        Math.sin(a) * 10 * s,
        Math.cos(a) * 10 * s,
        0,
        2.6 * s,
        20 * s,
        0.6,
        0,
        0,
        -a,
        true,
      );
      sails.put(
        G.box,
        '#8a7151',
        Math.sin(a) * 10 * s,
        Math.cos(a) * 10 * s,
        0.4,
        0.5,
        21 * s,
        0.5,
        0,
        0,
        -a,
        true,
      );
    }
    spinner(sails, x, y0 + 26 * s, z + f * 7.5 * s, 0.6);
  };
  const turbine = (k, x, z, f, i = 0) => {
    k.cyl(2.4, 92, '#f3f4f2', x, 0, z, 0.55);
    k.box(5, 5, 11, '#e6e8e6', x, 90, z);
    const rotor = new Kit();
    for (let b = 0; b < 3; b++) {
      const a = (b * Math.PI * 2) / 3;
      rotor.put(
        G.box,
        '#f8f8f6',
        Math.sin(a) * 21,
        Math.cos(a) * 21,
        0,
        2.4,
        42,
        0.6,
        0,
        0,
        -a,
        true,
      );
    }
    rotor.ball(2.6, '#e6e8e6', 0, 0, 0);
    spinner(rotor, x, 92.5, z + f * 6.5, 0.9 + (i % 3) * 0.12);
    beacon(x, 96, z);
  };
  const chimney = (k, x, z, h, r = 3.5, smoke = true) => {
    k.cyl(r, h, '#c9c4ba', x, 0, z, 0.7);
    for (let i = 0; i < 3; i++)
      k.cyl(r * 0.76, 5, i % 2 ? '#f4f1ea' : '#c0392b', x, h - 16 + i * 5, z);
    beacon(x, h + 1.5, z);
    if (smoke) plume(x, h + 4, z, r * 2.2, 46, smokeMat, 3);
  };
  const flare = (k, x, z, h) => {
    k.cyl(1.1, h, '#8d969b', x, 0, z);
    k.beam([x - 9, 0, z], [x, h * 0.7, z], 0.4, '#8d969b');
    k.beam([x + 9, 0, z], [x, h * 0.7, z], 0.4, '#8d969b');
    k.beam([x, 0, z + 9], [x, h * 0.7, z], 0.4, '#8d969b');
    flame(x, h, z, 5);
  };
  // Process plant: columns, pipe rack, spheres, furnace, chimneys and a flare.
  const refinery = (k, big) => {
    const steel = '#c9d0d3',
      dark = '#75848c';
    k.box(150, 0.5, 96, '#b9b6a6', 0, 0, 0);
    // pipe rack along the plot
    for (let x = -66; x <= 66; x += 22)
      for (const dz of [-3.5, 3.5]) k.box(0.9, 9, 0.9, dark, x, 0, dz);
    k.box(136, 0.6, 8, dark, 0, 9, 0);
    for (const [dz, c] of [
      [-2.6, '#e6ae54'],
      [-0.8, steel],
      [1, '#ca7860'],
      [2.7, steel],
    ])
      k.beam([-68, 10, dz], [68, 10, dz], 0.55, c);
    // distillation columns with platforms
    const cols = big ? [-54, -38, -20, 4, 26, 44] : [-46, -28, -8, 14];
    cols.forEach((x, i) => {
      const h = 36 + ((i * 17) % 30),
        r = 2.6 + (i % 3) * 0.9;
      k.cyl(r, h, steel, x, 0, -24);
      k.ball(r, steel, x, h, -24, 0.6);
      for (let y = 10; y < h; y += 11) k.cyl(r + 1.4, 0.7, dark, x, y, -24);
      k.box(1.2, h, 1.2, dark, x + r + 0.8, 0, -24);
    });
    // furnace with stack, cooler bank
    k.box(26, 16, 14, '#a9adb0', 50, 0, -30);
    k.cyl(2, 26, '#8d969b', 50, 16, -30, 0.8);
    k.box(40, 5, 12, dark, -30, 6, 26);
    for (let x = -46; x <= -14; x += 8) k.cyl(3, 0.8, steel, x, 11, 26);
    for (const x of [-48, -12]) for (const dz of [21, 31]) k.box(1, 6, 1, dark, x, 0, dz);
    // LPG spheres on legs
    for (const x of [20, 40, 60]) {
      k.ball(8, '#f0efe9', x, 12, 28);
      k.cyl(8.2, 0.8, '#ca7860', x, 11.6, 28);
      for (const [dx, dz] of [
        [-5, -5],
        [5, -5],
        [-5, 5],
        [5, 5],
      ])
        k.box(0.9, 9, 0.9, dark, x + dx, 0, 28 + dz);
    }
    return {
      chimneys: big
        ? [
            [-66, 30, 95],
            [66, -36, 80],
          ]
        : [[-64, 30, 78]],
      flare: [70, 36, big ? 88 : 66],
    };
  };

  for (const l of list(MAP.id)) {
    const { x, z } = l;
    ox = x;
    oz = z;
    const f = z < 0 ? 1 : -1, // towards the river
      k = new Kit();
    let top = 40;
    if (l.kind === 'euromast') {
      k.box(46, 9, 22, '#e7e1d2', 0, 0, 0).box(46, 2, 22, '#4f7184', 0, 3.5, 0);
      k.cyl(5.5, 100, '#e7e1d2', 0, 0, 0);
      k.cyl(13, 6, '#d8d1bf', 0, 92, 0, 1.25).cyl(16.2, 2.4, '#4f7184', 0, 98, 0);
      k.cyl(15, 1.5, '#e7e1d2', 0, 100.4, 0);
      k.cyl(2.4, 80, '#c9ccd2', 0, 101, 0, 0.6);
      beacon(0, 183, 0);
      top = 196;
    } else if (l.kind === 'highrise') {
      const w = l.w || 24;
      k.box(w + 14, 8, w + 10, '#cfc8b8', 0, 0, 0);
      k.tower(w, l.h, w * 0.85, l.c, 0, 0, 0);
      if (l.crown) k.box(w * 0.7, 9, w * 0.6, l.crown, 0, l.h, 0);
      k.box(1, 12, 1, '#8d969b', 0, l.h + (l.crown ? 9 : 0), 0);
      beacon(0, l.h + (l.crown ? 22 : 13), 0);
      top = l.h + 34;
    } else if (l.kind === 'derotterdam') {
      // Three towers, each a block shifted on top of another: the vertical city.
      k.box(100, 20, 34, '#566a78', 0, 0, 0);
      for (const i of [-1, 0, 1]) {
        const sh = i === 0 ? 5 : -5;
        k.tower(28, 62, 30, '#63798a', i * 33, 20, 0, '#a8c6d6', 6);
        k.tower(28, 66, 30, '#6d8596', i * 33 + sh, 83, sh * 0.7, '#b6d4e2', 6);
      }
      beacon(0, 151, 0);
      top = 164;
    } else if (l.kind === 'hotelny') {
      k.box(40, 16, 22, '#b9785a', 0, 0, 0).box(40.4, 1.2, 22.4, '#e9dfc8', 0, 10, 0);
      k.put(G.pyr, '#5d5750', 0, 16, 0, 30, 7, 17, Math.PI / 4);
      for (const dx of [-13, 13]) {
        k.box(7, 26, 7, '#c08566', dx, 0, f * 9);
        k.cyl(4.2, 5, '#6fae9a', dx, 26, f * 9, 0.35).ball(1.6, '#6fae9a', dx, 32.5, f * 9);
      }
      top = 46;
    } else if (l.kind === 'whitehouse') {
      k.tower(17, 38, 17, '#f4f1e6', 0, 0, 0, '#7c8f9a', 5);
      k.pyr(18, 8, 18, '#5f7482', 0, 38, 0);
      for (const [dx, dz] of [
        [-8, -8],
        [8, -8],
        [-8, 8],
        [8, 8],
      ])
        k.cyl(2, 5, '#f4f1e6', dx, 37, dz).cone(2.4, 4, '#5f7482', dx, 42, dz);
      top = 58;
    } else if (l.kind === 'cubes') {
      // Yellow cube houses standing on a corner, each on its own pillar.
      for (let i = 0; i < 6; i++) {
        const cx = ((i % 3) - 1) * 17,
          cz = (i < 3 ? -1 : 1) * 9;
        k.cyl(3, 11, '#d9d2c2', cx, 0, cz, 1, 6);
        k.put(G.box, '#f2c230', cx, 18, cz, 12, 12, 12, Math.PI / 4, 0.9553, 0, true);
        k.put(G.box, '#fff6d6', cx, 18, cz, 12.3, 3, 12.3, Math.PI / 4, 0.9553, 0, true);
      }
      top = 40;
    } else if (l.kind === 'markthal') {
      k.put(archGeo, '#9aa3a8', 0, 0, 0, 96, 40, 110);
      for (const dz of [-54, 54]) k.box(56, 30, 0.8, '#8fc4d4', 0, 0, dz);
      k.box(54, 3, 100, '#e6ae54', 0, 0, 0);
      top = 54;
    } else if (l.kind === 'depot') {
      // The mirrored bowl in the Museumpark, trees on the roof.
      k.cyl(20, 40, '#b4d2dd', 0, 0, 0, 1.5, 20);
      k.cyl(30.5, 1.2, '#e9eef0', 0, 40, 0, 1, 20);
      for (let i = 0; i < 6; i++)
        k.put(
          G.ico,
          i % 2 ? '#60996d' : '#82ad70',
          Math.cos(i) * 16,
          45,
          Math.sin(i) * 16,
          5,
          6,
          5,
          0,
          0,
          0,
          true,
        );
      top = 62;
    } else if (l.kind === 'church') {
      const h = l.h,
        c = l.c;
      k.box(15, 15, 46, c, 0, 0, -f * 28);
      k.put(G.pyr, '#5d5f66', 0, 15, -f * 28, 12, 9, 34, Math.PI / 4);
      k.box(34, 12, 12, c, 0, 0, -f * 30);
      k.box(13, h, 13, c, 0, 0, 0);
      if (l.dome) {
        k.cyl(8, 6, '#5d5f66', 0, h, 0, 0.75, 8).ball(6, '#5d5f66', 0, h + 6, 0, 0.9);
        k.cyl(1.2, 8, '#5d5f66', 0, h + 10, 0);
      } else if (l.blunt) {
        k.box(10, 10, 10, c, 0, h, 0).cyl(4.5, 9, '#6f8d84', 0, h + 10, 0, 0.5, 8);
      } else k.pyr(13.5, h * 0.55, 13.5, '#5d5f66', 0, h, 0);
      k.box(13.6, 1.2, 13.6, '#e9dfc8', 0, h * 0.72, 0);
      top = h * 1.6 + 16;
    } else if (l.kind === 'mill') {
      windmill(k, 0, 0, f, 1.15, l.body);
      top = 52;
    } else if (l.kind === 'mills') {
      for (let i = 0; i < l.count; i++)
        windmill(k, (i - (l.count - 1) / 2) * l.gap, (i % 2) * 14, f, 0.9, '#3f6b4a', '#2f4f3a');
      top = 48;
    } else if (l.kind === 'tallmills') {
      // Schiedam: the tallest windmills in the world, with a gallery halfway up.
      for (let i = 0; i < 3; i++) {
        const mx = (i - 1) * 46;
        k.cyl(9, 22, '#8a5a44', mx, 0, i * 8, 0.8, 8);
        k.cyl(10.5, 1.2, '#e9dfc8', mx, 22, i * 8, 1, 8);
        windmill(k, mx, i * 8, f, 0.85, '#8a5a44', '#3f3329', 22);
      }
      top = 70;
    } else if (l.kind === 'turbines') {
      for (let i = 0; i < l.count; i++) turbine(k, (i - (l.count - 1) / 2) * l.gap, 0, f, i);
      top = 128;
    } else if (l.kind === 'radar') {
      k.cyl(3.4, 38, '#f3f4f2', 0, 0, 0, 0.75);
      k.cyl(6.5, 4, '#f3f4f2', 0, 38, 0, 1.15).cyl(7.6, 1.6, '#4f7184', 0, 39.4, 0);
      k.box(1, 6, 1, '#8d969b', 0, 42, 0);
      const bar = new Kit();
      bar.box(9, 1, 1.2, '#f3f4f2', 0, 0, 0);
      spinner(bar, 0, 48, 0, 2.2, 'y');
      top = 60;
    } else if (l.kind === 'refinery') {
      const r = refinery(k, l.big);
      for (const [cx, cz, h] of r.chimneys) chimney(k, cx, cz, h, 3.4);
      flare(k, ...r.flare);
      top = l.big ? 112 : 96;
    } else if (l.kind === 'cooling') {
      for (let i = 0; i < l.count; i++) {
        const cx = (i - (l.count - 1) / 2) * l.h * 1.05;
        k.put(coolingGeo, '#d9d6cc', cx, 0, 0, l.h * 0.42, l.h, l.h * 0.42);
        plume(cx, l.h + 6, 0, l.h * 0.26, l.h * 0.9, steamMat, 5);
      }
      if (l.domes)
        for (const dx of [-40, 40]) {
          k.cyl(15, 30, '#e9e6dc', dx, 0, f * 95).ball(15, '#e9e6dc', dx, 30, f * 95, 0.9);
          k.box(40, 16, 26, '#c9c4ba', dx, 0, f * 62);
        }
      top = l.h * 2 + 24;
    } else if (l.kind === 'steel') {
      // Blast furnaces at the sea end of the canal: furnace, stoves, gas holder.
      for (const dx of [-40, 30]) {
        k.cyl(11, 46, '#7a4a3a', dx, 0, 0, 0.55).cyl(6, 14, '#5e3a2c', dx, 46, 0, 0.7);
        k.beam([dx + 46, 0, 20], [dx + 3, 58, 2], 1.6, '#5e3a2c');
        for (let i = 0; i < 3; i++)
          k.cyl(5, 30, '#8d6f5e', dx - 20 + i * 11, 0, -24).ball(
            5,
            '#8d6f5e',
            dx - 20 + i * 11,
            30,
            -24,
          );
        plume(dx, 62, 0, 9, 60, steamMat, 3);
      }
      k.cyl(22, 44, '#6f7f86', 86, 0, 10).cyl(22.4, 2, '#4f5d63', 86, 30, 10);
      k.box(120, 14, 30, '#8a8f8c', 0, 0, 44);
      k.put(G.pyr, '#6f7f86', 0, 14, 44, 85, 6, 21, Math.PI / 4);
      chimney(k, -86, -10, 110, 4);
      top = 124;
    } else if (l.kind === 'silo') {
      for (let i = 0; i < 6; i++)
        for (const dz of [-8, 8]) k.cyl(8, 46, '#d9d2c2', (i - 2.5) * 15.5, 0, dz);
      k.box(96, 8, 20, '#c9c0ad', 0, 46, 0).box(96.4, 2, 20.4, '#4f7184', 0, 49, 0);
      k.box(16, 70, 20, '#c9c0ad', -56, 0, 0).box(16.4, 3, 20.4, '#ca7860', -56, 66, 0);
      top = 84;
    } else if (l.kind === 'coal') {
      for (const [dx, dz, r] of [
        [-70, -20, 44],
        [10, -24, 50],
        [84, -14, 40],
        [-30, 46, 46],
        [56, 50, 42],
      ])
        k.put(G.cone, '#2f3236', dx, 0, dz, r, r * 0.42, r * 0.7);
      // stacker with a long boom on rails
      k.box(190, 0.6, 5, '#75848c', 0, 0, 14);
      k.box(12, 16, 10, '#e6ae54', -10, 0, 14);
      k.beam([-10, 16, 14], [44, 30, -14], 1.4, '#e6ae54');
      k.beam([-10, 30, 14], [44, 30, -14], 0.3, '#75848c');
      k.box(2, 14, 2, '#e6ae54', -10, 16, 14);
      top = 44;
    } else if (l.kind === 'zaanhotel') {
      // Zaan houses stacked into a hotel: greens, white trim, a blue one.
      const greens = ['#3f7f5a', '#5b9a6c', '#2f6247', '#7fb58a', '#3f7f5a', '#5a86b0'];
      let i = 0;
      for (let y = 0; y < 40; y += 10)
        for (const dx of [-11, 0, 11]) {
          const c = greens[i++ % greens.length],
            dz = ((i * 5) % 7) - 3;
          k.box(11, 10, 20, c, dx, y, dz);
          k.box(4, 4, 20.6, '#f4f1e6', dx, y + 3, dz);
          if (y >= 30) k.put(G.pyr, '#f4f1e6', dx, y + 10, dz, 7.8, 6, 14.5, Math.PI / 4);
          if (y >= 30) k.put(G.pyr, c, dx, y + 10.2, dz, 7.2, 5.6, 14, Math.PI / 4);
        }
      top = 60;
    } else if (l.kind === 'plant') {
      k.box(80, 34, 44, '#7d4e3a', 0, 0, 0).box(82, 4, 46, '#5e3a2c', 0, 34, 0);
      k.box(30, 50, 30, '#8a5a44', -20, 0, 0);
      for (let i = -3; i <= 3; i++) k.box(5, 20, 44.6, '#4f7184', i * 10, 8, 0);
      chimney(k, 52, 0, 150, 6);
      top = 166;
    } else if (l.kind === 'hammercrane') {
      // NDSM yard: the big shed and the hammerhead crane on the quay.
      k.box(110, 26, 50, '#8d969b', -20, 0, -f * 40);
      for (let i = -3; i <= 3; i++)
        k.put(G.pyr, '#6f7f86', -20 + i * 15, 26, -f * 40, 10.6, 7, 35, Math.PI / 4);
      k.box(111, 6, 50.6, '#e6ae54', -20, 8, -f * 40);
      k.box(10, 46, 10, '#3d4a52', 40, 0, f * 14);
      for (let y = 6; y < 46; y += 8) k.box(10.6, 1, 10.6, '#e6ae54', 40, y, f * 14);
      k.box(78, 6, 7, '#3d4a52', 52, 46, f * 14).box(12, 9, 10, '#e9e4d8', 28, 52, f * 14);
      k.box(1, 22, 1, '#3d4a52', 84, 24, f * 14).box(5, 3, 5, '#e6ae54', 84, 21, f * 14);
      beacon(40, 62, f * 14);
      top = 74;
    } else if (l.kind === 'rem') {
      for (const [dx, dz] of [
        [-7, -7],
        [7, -7],
        [-7, 7],
        [7, 7],
      ])
        k.cyl(1.2, 14, '#f4f1e6', dx, 0, dz);
      k.box(20, 5, 20, '#c0392b', 0, 14, 0).box(20, 5, 20, '#f4f1e6', 0, 19, 0);
      k.box(14, 1, 14, '#c0392b', 0, 24, 0).box(1, 14, 1, '#c0392b', 6, 25, 6);
      top = 46;
    } else if (l.kind === 'pontsteiger') {
      for (const dx of [-29, 29]) k.tower(22, 62, 24, '#4a3f3c', dx, 0, 0, '#c9a36a', 6);
      k.tower(80, 26, 24, '#4a3f3c', 0, 62, 0, '#c9a36a', 6);
      k.box(110, 5, 40, '#cfc8b8', 0, 0, 0);
      beacon(0, 90, 0);
      top = 102;
    } else if (l.kind === 'tower') {
      k.tower(30, 82, 30, '#323a47', 0, 0, 0, '#5d7890', 6);
      k.box(38, 9, 38, '#262c36', 0, 82, 0).box(39, 3, 39, '#c0392b', 0, 88, 0);
      k.box(46, 1.2, 8, '#e6ae54', 0, 91, 0); // the swing over the edge
      k.box(60, 10, 26, '#e9e4d8', -50, 0, 0); // Eye film museum
      k.put(G.oct, '#f4f1e6', -50, 16, 0, 36, 9, 16, 0.3, 0, 0, true);
      beacon(0, 96, 0);
      top = 110;
    } else if (l.kind === 'stadium') {
      // De Kuip: an oval bowl, a floating roof ring and four light masts.
      k.put(taperGeo(0.82, 24), '#b9bdc0', 0, 0, 0, 78, 20, 62);
      k.put(G.cyl, '#5fa35a', 0, 20.2, 0, 50, 0.4, 36);
      k.put(G.cyl, '#e9eef0', 0, 24, 0, 80, 2, 64);
      k.put(G.cyl, '#5fa35a', 0, 24.2, 0, 54, 2, 40);
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        k.box(1.4, 24, 1.4, '#8d969b', Math.cos(a) * 80, 0, Math.sin(a) * 64);
      }
      for (const [dx, dz] of [
        [-70, -56],
        [70, -56],
        [-70, 56],
        [70, 56],
      ])
        k.box(2, 50, 2, '#8d969b', dx, 0, dz).box(12, 7, 2, '#fff6d6', dx, 50, dz);
      top = 66;
    } else if (l.kind === 'gantry') {
      // Shipyard gantry crane spanning the slipway.
      for (const dz of [-34, 34]) {
        k.beam([-9, 0, dz], [0, 58, dz], 1.5, '#3f6aa8');
        k.beam([9, 0, dz], [0, 58, dz], 1.5, '#3f6aa8');
      }
      k.box(8, 7, 84, '#3f6aa8', 0, 58, 0).box(9, 6, 9, '#e6ae54', 0, 52, 10);
      k.box(0.6, 24, 0.6, '#3d4a52', 0, 28, 10);
      k.box(60, 12, 16, '#8d969b', -46, 0, 0);
      beacon(0, 67, 0);
      top = 80;
    } else if (l.kind === 'liftbridge') {
      // Lift bridge over the side channel, span raised: ships pass underneath.
      const a = toX(l.s0) - x,
        b = toX(l.s1) - x;
      for (const tx of [a - 14, b + 14]) {
        for (const dz of [-8, 8]) k.box(5, 72, 5, '#5f7f9a', tx, 0, dz);
        for (let y = 12; y < 72; y += 14) k.box(5.4, 1.4, 21, '#5f7f9a', tx, y, 0);
        k.box(9, 6, 22, '#4c6880', tx, 72, 0);
        beacon(tx, 80, 0);
      }
      k.box(b - a + 18, 4, 18, '#5f7f9a', (a + b) / 2, 52, 0);
      k.box(b - a + 18, 1.2, 19, '#e9dfc8', (a + b) / 2, 56, 0);
      for (const [tx, dir] of [
        [a - 14, -1],
        [b + 14, 1],
      ])
        k.box(120, 3, 16, '#8d969b', tx + dir * 66, 6, 0);
      top = 92;
    } else if (l.kind === 'fort') {
      const s = l.small ? 0.42 : 1,
        brick = '#9a5f48';
      for (const [dx, dz, w, d] of [
        [0, -50, 110, 8],
        [0, 50, 110, 8],
        [-55, 0, 8, 100],
        [55, 0, 8, 100],
      ])
        k.box(w * s, 6, d * s, '#7fae5a', dx * s, 0, dz * s);
      for (const [dx, dz] of [
        [-55, -50],
        [55, -50],
        [-55, 50],
        [55, 50],
      ])
        k.put(G.pyr, '#6f9d50', dx * s, 0, dz * s, 30 * s, 8, 30 * s, 0);
      k.box(46 * s, 9, 14 * s, brick, 0, 0, 0);
      k.put(G.pyr, '#5d5750', 0, 9, 0, 33 * s, 5, 10.5 * s, Math.PI / 4);
      if (!l.small) {
        for (const [dx, dz] of [
          [-28, -22],
          [-10, -24],
          [14, -22],
          [30, 22],
          [-24, 24],
          [4, 26],
        ]) {
          k.box(11, 7, 9, dz < 0 ? '#e9dfc8' : brick, dx, 0, dz);
          k.put(G.pyr, '#bf7555', dx, 7, dz, 8.2, 4, 6.8, Math.PI / 4);
        }
        k.box(6, 22, 6, '#e9dfc8', 34, 0, -24).pyr(6.4, 10, 6.4, '#5d5f66', 34, 22, -24);
      }
      top = l.small ? 22 : 44;
    } else if (l.kind === 'castle') {
      k.box(44, 16, 28, '#8e8a80', 0, 0, 0).box(20, 12, 18, '#9a958a', -4, 16, 0);
      k.pyr(20, 9, 18, '#3d4652', -4, 28, 0);
      for (const [dx, dz] of [
        [-20, -12],
        [20, -12],
        [20, 12],
        [-20, 12],
      ])
        k.cyl(4.5, 24, '#9a958a', dx, 0, dz).cone(5.5, 9, '#3d4652', dx, 24, dz);
      top = 48;
    } else if (l.kind === 'cathedral') {
      // Nave, transept, the tall north tower with its spire: 123 m above Antwerp.
      k.box(30, 30, 76, '#b8ab90', 0, 0, -f * 46);
      k.put(G.pyr, '#6d6a66', 0, 30, -f * 46, 23, 14, 55, Math.PI / 4);
      k.box(66, 26, 18, '#b8ab90', 0, 0, -f * 60);
      k.box(15, 76, 15, '#c3b699', -9, 0, 0);
      for (let y = 20; y < 76; y += 18) k.box(15.6, 1.4, 15.6, '#e9dfc8', -9, y, 0);
      k.cyl(8, 22, '#b3a68b', -9, 76, 0, 0.62, 8).cone(5, 30, '#9c917a', -9, 98, 0);
      k.box(15, 62, 15, '#c3b699', 9, 0, 0).ball(7, '#6f8d84', 9, 62, 0, 0.8);
      beacon(-9, 129, 0);
      top = 142;
    } else if (l.kind === 'boerentoren') {
      k.box(40, 28, 30, '#d9cdb0', 0, 0, 0);
      k.tower(22, 62, 22, '#e3d8bd', 0, 28, 0, '#8a9aa2', 5);
      k.tower(15, 14, 15, '#e3d8bd', 0, 90, 0, '#8a9aa2', 5).box(8, 8, 8, '#cdbf9e', 0, 104, 0);
      k.box(1, 10, 1, '#8d969b', 0, 112, 0);
      beacon(0, 123, 0);
      top = 134;
    } else if (l.kind === 'slabs') {
      for (const [dx, dz, h] of [
        [-50, 0, 52],
        [0, -20, 64],
        [52, 6, 46],
      ])
        k.tower(46, h, 13, '#e9e4d8', dx, 0, dz, '#7fa3b4', 4);
      k.box(170, 0.5, 26, '#ecd9a0', 0, 0, f * 62); // Sint-Anna beach
      top = 78;
    } else if (l.kind === 'mas') {
      // Stacked red sandstone boxes, a glass band climbing round the corners.
      for (let i = 0; i < 6; i++) {
        k.box(30, 10.4, 30, i % 2 ? '#a8513a' : '#b55f45', 0, i * 10.4, 0);
        const q = i % 4,
          dx = q === 0 || q === 3 ? -9 : 9,
          dz = q < 2 ? -9 : 9;
        k.box(13, 8, 13, '#a9d4e2', dx * 1.02, i * 10.4 + 1.2, dz * 1.02);
      }
      top = 76;
    } else if (l.kind === 'havenhuis') {
      // Port House: the old fire station with a faceted glass ship on top.
      k.box(64, 18, 30, '#b9a07e', 0, 0, 0).box(64.6, 1.4, 30.6, '#e9dfc8', 0, 12, 0);
      k.put(G.pyr, '#5d5750', 0, 18, 0, 45.5, 7, 21.5, Math.PI / 4);
      k.beam([14, 0, 0], [6, 34, 0], 2.6, '#d9e2e6');
      k.put(G.oct, '#bfe3ee', -8, 42, 0, 54, 10, 15, 0, 0, 0.06, true);
      k.put(G.oct, '#e3f3f8', -8, 43, 0, 50, 7, 13, 0.5, 0, 0.06, true);
      top = 66;
    } else if (l.kind === 'barrier') {
      // Maeslantkering: two white gate arms parked in their docks, each braced back
      // to its ball joint by a lattice of tubes.
      const RH = MAP.riverHalf;
      for (const side of [-1, 1]) {
        const gz = side * (RH + 22),
          jz = side * (RH + 230);
        k.box(240, 22, 7, '#f2f2ee', 0, -4, gz).box(240, 2.4, 7.4, '#e0a42b', 0, 15, gz);
        k.ball(9, '#d9dad6', 120, 6, jz);
        k.box(26, 6, 26, '#b9b6a6', 120, -4, jz);
        for (const ex of [-120, -40, 40, 120])
          for (const ey of [-1, 16]) k.beam([ex, ey, gz], [120, 6, jz], 1.5, '#f2f2ee');
        for (const t of [0.35, 0.7])
          k.beam(
            [-120 + 240 * t, 8, gz + (jz - gz) * t],
            [120, 8, gz + (jz - gz) * t],
            1.1,
            '#f2f2ee',
          );
        beacon(120, 18, jz);
      }
      label(l.name, x, 60, -RH - 120);
      top = 0;
    }
    if (k.n) k.mesh(root, x, GROUND, z);
    if (top) label(l.name, x, top, z);
    stats.count++;
    stats.parts += k.n;
  }
  return {
    root,
    stats,
    update(time, wind = { x: 0.35, z: 0.12 }) {
      for (const sp of spinners) sp.o.rotation[sp.axis] = time * sp.speed + sp.ph;
      for (const p of puffs) {
        const t = (time * 0.07 + p.off) % 1,
          s = p.size * (0.55 + t * 1.5) * Math.min(1, (1 - t) * 4);
        p.m.position.set(p.x + wind.x * p.rise * t, p.y + p.rise * t, p.z + wind.z * p.rise * t);
        p.m.scale.set(s, s * 0.8, s);
      }
      for (const fl of flames) {
        const s = fl.size * (0.8 + 0.25 * Math.sin(time * 9 + fl.ph) + 0.1 * Math.sin(time * 23));
        fl.m.scale.set(s * 0.55, s * 2, s * 0.55);
        fl.m.position.y = fl.y + s;
      }
    },
    onLand: () => landmarkSpots().every((p) => landAt(p.x, p.z)),
  };
}
