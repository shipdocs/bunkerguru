import * as T from '../../vendor/three.js';
// A typical Rotterdam bunker tanker (inland tanker type C), modelled in code.
// Frame: bow towards −z, port towards −x, waterline at y = 0, metres. The hull is
// lofted from stations along the length (sheer, spoon bow with overhang, rounded
// stern), the rest is boxes and tubes; batchVessel() merges it into one draw.
// The raised wheelhouse holds the wheelhouse camera (camera.mjs bridgeEye):
// front glass at 0.208 L, floor 6.2 m, eye 7.9 m, wings out to beam/2 + 1.2 m.
export const TANKER = { wheelhouseFront: 0.208, wheelhouseAft: 0.29, floor: 6.2 };

const glassMat = new T.MeshStandardMaterial({
  color: '#8fc2d4',
  transparent: true,
  opacity: 0.26,
  roughness: 0.1,
  metalness: 0.2,
  emissive: '#0a1a20', // non-black emissive keeps it out of the batch: it stays see-through
  emissiveIntensity: 0.4,
  side: T.DoubleSide,
  depthWrite: false,
});

export function buildBunkerTanker({ mesh, box, cyl, beam }, profile, opts = {}) {
  const g = new T.Group();
  const L = profile.length,
    B = profile.beam,
    // As on the Rotterdam bunker boats (Burando's Zeeland, Leonore): a black hull,
    // grey deck, silver pipes with blue valves, white bow bulwark and house; the
    // company colour runs as a broad stripe under the sheer and in the bow name.
    company = opts.color || '#ba6539',
    hull = '#24292c',
    name = opts.name || 'BUNKERGURU';
  const C = {
    boot: '#7d2a20',
    deck: '#858d8f',
    walk: '#a3aaab',
    pipe: '#c3c9ca',
    pipe2: '#949ea0',
    flange: '#2f5fae',
    house: '#f1f1ec',
    trim: '#dcdcd4',
    window: '#22323b',
    dark: '#1f2a2e',
    rail: '#f2f2ee',
    crane: '#2a3034',
    black: '#141a1c',
  };
  const zBul = -0.37 * L; // forward of this the hull carries a high white bulwark
  // ---- Hull lines ----
  const zb0 = -L * (0.5 - 16 / 220), // end of the parallel body, bow side
    zs0 = L * (0.5 - 4 / 220); // stern side
  const tipD = { bow: -0.477 * L, stern: 0.4977 * L }, // deck outline (as the collision hull)
    tipW = { bow: -0.452 * L, stern: 0.486 * L }; // waterline: spoon bow overhang, short stern
  const half = (z, tip) => {
    if (z < zb0) {
      const t = (zb0 - z) / (zb0 - tip.bow);
      return t >= 1 ? 0 : (B / 2) * Math.sqrt(1 - t); // the quadratic Bézier of hullOutline
    }
    if (z > zs0) {
      const t = (z - zs0) / (tip.stern - zs0);
      return t >= 1 ? 0 : (B / 2) * Math.sqrt(1 - t); // the quadratic Bézier of hullOutline
    }
    return B / 2;
  };
  // Deck height: 3 m freeboard, sheer rising to the bow and a little to the stern.
  const deckY = (z) =>
    3 +
    1.3 * Math.max(0, (-z - 0.3 * L) / (0.18 * L)) ** 2 +
    0.4 * Math.max(0, (z - 0.4 * L) / (0.1 * L)) ** 2;
  const N = 64,
    stations = Array.from(
      { length: N + 1 },
      (_, i) => tipD.stern + ((tipD.bow - tipD.stern) * i) / N,
    );
  // One colour band of the hull: section points (port to starboard) per station.
  function band(sectionAt, color) {
    const pos = [];
    for (let i = 0; i < N; i++) {
      const a = sectionAt(stations[i]),
        b = sectionAt(stations[i + 1]);
      for (let j = 0; j < a.length - 1; j++) {
        const p = [a[j], a[j + 1], b[j + 1], b[j]];
        pos.push(...p[0], ...p[1], ...p[2], ...p[0], ...p[2], ...p[3]);
      }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.computeVertexNormals();
    const m = mesh(geo, color, 0, 0, 0, g);
    m.castShadow = true;
    return m;
  }
  const side = (z) => {
    const yd = deckY(z),
      hd = half(z, tipD),
      hw = half(z, tipW);
    // Above the boot-top the side flares from the waterline to the deck edge.
    const at = (y) => hw + (hd - hw) * Math.max(0, Math.min(1, y / yd));
    return { yd, hd, hw, at };
  };
  // Black topside from the boot-top (0.6 m) to the company stripe.
  band((z) => {
    const s = side(z);
    return [
      [-s.at(s.yd - 1.0), s.yd - 1.0, z],
      [-s.at(0.6), 0.6, z],
    ];
  }, hull);
  band((z) => {
    const s = side(z);
    return [
      [s.at(0.6), 0.6, z],
      [s.at(s.yd - 1.0), s.yd - 1.0, z],
    ];
  }, hull);
  // The company stripe under the sheer: the rival you see coming, by colour.
  for (const k of [-1, 1])
    band((z) => {
      const s = side(z);
      return [
        [k * s.at(s.yd - 1.0), s.yd - 1.0, z],
        [k * s.at(s.yd - 0.3), s.yd - 0.3, z],
      ];
    }, company);
  // High white bulwark round the bow (forward of zBul), flat to the deck aft of it.
  for (const k of [-1, 1])
    band((z) => {
      const s = side(z),
        h = z < zBul ? 1.3 * Math.min(1, (zBul - z) / 3) : 0;
      return [
        [k * s.hd, s.yd, z],
        [k * s.hd, s.yd + h, z],
      ];
    }, C.rail);
  // White sheer strake along the deck edge.
  for (const k of [-1, 1])
    band((z) => {
      const s = side(z);
      return [
        [k * s.at(s.yd - 0.3), s.yd - 0.3, z],
        [k * s.hd, s.yd, z],
      ];
    }, C.rail);
  // Red boot-top and bottom (mostly under water, it shows when she rolls or rides light).
  band((z) => {
    const s = side(z);
    return [
      [-s.at(0.6), 0.6, z],
      [-s.hw, 0, z],
      [-s.hw * 0.9, -0.7, z],
      [s.hw * 0.9, -0.7, z],
      [s.hw, 0, z],
      [s.at(0.6), 0.6, z],
    ];
  }, C.boot);
  // Deck.
  band((z) => {
    const s = side(z);
    return [
      [-s.hd, s.yd, z],
      [s.hd, s.yd, z],
    ];
  }, C.deck);
  // Low bulwark (rail) along both sides and round the bow.
  for (let i = 0; i < N; i += 2) {
    const z = stations[i];
    const s = side(z);
    if (s.hd < 0.5 || z < zBul) continue;
    for (const k of [-1, 1]) box(0.08, 1.0, 0.08, C.rail, k * (s.hd - 0.12), s.yd + 0.5, z, g);
  }
  for (const k of [-1, 1])
    for (let i = 0; i < N; i++) {
      const z0 = stations[i],
        z1 = stations[i + 1],
        a = side(z0),
        b = side(z1);
      if (a.hd < 0.5 || b.hd < 0.5 || z1 < zBul) continue;
      beam([k * (a.hd - 0.12), a.yd + 1, z0], [k * (b.hd - 0.12), b.yd + 1, z1], 0.05, C.rail, g);
    }
  // ---- Bow: forecastle, anchors, windlass, folding foremast ----
  const zF = -0.43 * L,
    yF = deckY(zF);
  box(B * 0.55, 1.1, 0.07 * L, C.deck, 0, yF + 0.45, -0.445 * L, g); // raised foredeck
  box(1.6, 1.0, 1.4, C.dark, 0, yF + 1.4, -0.43 * L, g); // anchor windlass
  for (const k of [-1, 1]) {
    cyl(0.45, 0.9, C.dark, k * 1.3, yF + 1.4, -0.43 * L, g).rotation.z = Math.PI / 2; // gypsies
    box(0.25, 1.1, 1.4, C.black, k * (side(-0.45 * L).at(1.8) + 0.08), 1.8, -0.45 * L, g); // anchor in its pocket, on the shell
    cyl(0.25, 0.6, C.dark, k * 2.2, yF + 1.2, -0.41 * L, g); // bollards
  }
  cyl(0.18, 9, C.trim, 0, yF + 5.5, -0.415 * L, g); // foremast
  box(2.6, 0.12, 0.12, C.trim, 0, yF + 8.5, -0.415 * L, g);
  // ---- Cargo deck: pipe rack, tank domes, vents, catwalk ----
  const zA = -0.38 * L,
    zB = 0.2 * L;
  // Raised catwalk (loopbrug) on the centre line, white railings both sides.
  box(1.2, 0.12, zB - zA, C.walk, 0, 4.6, (zA + zB) / 2, g);
  for (let z = zA; z <= zB; z += 6) {
    box(0.12, 1.6, 0.12, C.walk, 0, 3.8, z, g);
    for (const k of [-1, 1]) box(0.06, 1.0, 0.06, C.rail, k * 0.6, 5.1, z, g);
  }
  for (const k of [-1, 1]) beam([k * 0.6, 5.6, zA], [k * 0.6, 5.6, zB], 0.04, C.rail, g);
  // Cargo lines beside it, with blue valves at every tank.
  for (const [x, r, c] of [
    [-1.7, 0.22, C.pipe],
    [-1.2, 0.18, C.pipe2],
    [1.25, 0.2, C.pipe],
    [1.75, 0.14, C.pipe2],
  ]) {
    const p = cyl(r, zB - zA, c, x, 3.45, (zA + zB) / 2, g);
    p.rotation.x = Math.PI / 2;
  }
  for (let z = zA + 3; z < zB; z += 7) box(4.2, 0.15, 0.25, C.pipe2, 0, 3.2, z, g); // pipe supports
  for (let z = zA + 6; z < zB; z += 9.5)
    for (const x of [-1.7, 1.25]) box(0.55, 0.5, 0.4, C.flange, x, 3.75, z, g);
  for (let z = zA + 5, i = 0; z < zB - 4; z += 9.5, i++) {
    for (const x of [-B * 0.27, B * 0.27]) {
      cyl(0.65, 0.5, C.trim, x, 3.25, z, g); // tank dome / hatch
      cyl(0.5, 0.12, C.dark, x, 3.55, z, g);
    }
    cyl(0.1, 1.6, C.pipe2, -B * 0.35, 3.8, z + 3, g); // high-velocity vent
    cyl(0.2, 0.25, C.flange, -B * 0.35, 4.65, z + 3, g);
  }
  // ---- Manifold amidships and the hose crane ----
  const zM = -0.06 * L;
  for (const k of [-1, 1]) {
    const pipe = cyl(0.22, B * 0.4, C.pipe, k * B * 0.2, 3.6, zM, g);
    pipe.rotation.z = Math.PI / 2;
    cyl(0.38, 0.15, C.flange, k * B * 0.41, 3.6, zM, g).rotation.z = Math.PI / 2;
    box(1.4, 0.3, 2.2, C.dark, k * B * 0.38, 3.15, zM, g); // drip tray
  }
  // The long dark hose crane that reaches up to a seagoing ship's rail.
  cyl(0.5, 2.8, C.crane, -B * 0.3, 4.4, zM + 3, g); // pedestal
  beam([-B * 0.3, 5.8, zM + 3], [-B * 0.15, 15, zM - 9], 0.26, C.crane, g); // boom
  beam([-B * 0.15, 15, zM - 9], [-B * 0.15, 9.5, zM - 9], 0.04, C.dark, g); // wire
  const hose = new T.TubeGeometry(
    new T.CatmullRomCurve3([
      new T.Vector3(-B * 0.15, 9.5, zM - 9),
      new T.Vector3(-B * 0.25, 6, zM - 4),
      new T.Vector3(-B * 0.38, 3.9, zM),
    ]),
    12,
    0.2,
    6,
  );
  mesh(hose, C.black, 0, 0, 0, g);
  // ---- Aft: accommodation, raised wheelhouse on its column, funnels, car, dinghy ----
  const zH0 = 0.31 * L,
    zH1 = 0.44 * L,
    hw = B * 0.43;
  box(hw * 2, 2.8, zH1 - zH0, C.house, 0, 3 + 1.4, (zH0 + zH1) / 2, g);
  for (const k of [-1, 1])
    box(0.06, 0.8, (zH1 - zH0) * 0.8, C.window, k * hw, 4.7, (zH0 + zH1) / 2, g);
  box(hw * 2 - 0.4, 0.8, 0.06, C.window, 0, 4.7, zH0 - 0.01, g);
  box(hw * 2 + 0.2, 0.2, zH1 - zH0 + 0.2, C.trim, 0, 5.85, (zH0 + zH1) / 2, g);
  // Wheelhouse: frame, roof and glass all round; the camera stands inside it.
  const wf = TANKER.wheelhouseFront * L,
    wa = TANKER.wheelhouseAft * L,
    ww = B * 0.36,
    fl = TANKER.floor;
  cyl(0.9, fl - 3, C.trim, 0, 3 + (fl - 3) / 2, (wf + wa) / 2 + 1, g); // hydraulic column
  box(ww * 2, 0.35, wa - wf, C.house, 0, fl - 0.17, (wf + wa) / 2, g); // floor
  box(ww * 2, 0.8, wa - wf, C.house, 0, fl + 0.4, (wf + wa) / 2, g); // lower panels
  box(ww * 2 + 0.6, 0.3, wa - wf + 0.6, C.trim, 0, fl + 2.75, (wf + wa) / 2, g); // roof
  box(ww * 2 + 0.6, 0.12, wa - wf + 0.6, '#bdb7a6', 0, fl + 2.95, (wf + wa) / 2, g);
  for (const x of [-ww, -ww * 0.55, ww * 0.55, ww]) // no post dead ahead: the view over the bow stays clear
    box(0.12, 1.8, 0.12, C.trim, x, fl + 1.7, wf, g); // window posts
  for (const k of [-1, 1])
    for (const z of [wf, (wf + wa) / 2, wa]) box(0.12, 1.8, 0.12, C.trim, k * ww, fl + 1.7, z, g);
  const glass = (w, h, d, x, y, z) => mesh(new T.BoxGeometry(w, h, d), glassMat, x, y, z, g);
  glass(ww * 2, 1.8, 0.05, 0, fl + 1.7, wf);
  for (const k of [-1, 1]) glass(0.05, 1.8, wa - wf, k * ww, fl + 1.7, (wf + wa) / 2);
  box(ww * 2, 1.8, 0.1, C.house, 0, fl + 1.7, wa, g); // back wall
  box(ww * 1.6, 0.9, 0.6, C.dark, 0, fl + 0.85, wf + 0.6, g); // console under the windows
  // Bridge wings with railing, out over the side for docking.
  for (const k of [-1, 1]) {
    box(
      B * 0.5 + 1.2 - ww,
      0.2,
      wa - wf,
      C.house,
      k * (ww + (B * 0.5 + 1.2 - ww) / 2),
      fl - 0.1,
      (wf + wa) / 2,
      g,
    );
    box(0.08, 1, wa - wf, C.rail, k * (B * 0.5 + 1.2), fl + 0.5, (wf + wa) / 2, g);
  }
  // Radar mast on the wheelhouse roof.
  cyl(0.1, 2.4, C.trim, 0, fl + 4.1, (wf + wa) / 2 + 1, g);
  box(3.2, 0.15, 0.35, C.dark, 0, fl + 5.3, (wf + wa) / 2 + 1, g);
  // Two exhaust stacks behind the house.
  for (const k of [-1, 1]) {
    cyl(0.32, 3.6, C.house, k * 1.3, 5.95 + 1.8, zH1 - 1.2, g); // standing on the roof
    cyl(0.34, 0.5, C.black, k * 1.3, 5.95 + 3.8, zH1 - 1.2, g);
  }
  // The car on the aft deck, with its little crane: every Dutch skipper's.
  const zC = 0.47 * L;
  box(1.7, 0.7, 3.8, '#2e5e8c', 1.2, deckY(zC) + 0.6, zC, g);
  box(1.5, 0.6, 2.0, '#2e5e8c', 1.2, deckY(zC) + 1.2, zC + 0.2, g);
  box(1.52, 0.4, 1.8, C.window, 1.2, deckY(zC) + 1.2, zC + 0.2, g);
  for (const dx of [-0.85, 0.85])
    for (const dz of [-1.2, 1.2])
      cyl(0.32, 0.25, C.black, 1.2 + dx, deckY(zC) + 0.3, zC + dz, g).rotation.z = Math.PI / 2;
  cyl(0.18, 2.5, C.crane, -1.8, deckY(zC) + 1.25, zC, g);
  beam([-1.8, deckY(zC) + 2.5, zC], [0.4, deckY(zC) + 3.0, zC], 0.1, C.crane, g);
  // Dinghy on davits over the stern.
  box(1.4, 0.6, 3.2, '#f2f0e8', -2.6, deckY(zC) + 1.6, zC + 1.4, g);
  for (const dz of [0.4, 2.4])
    beam([-1.6, deckY(zC), zC + dz], [-2.6, deckY(zC) + 2.3, zC + dz], 0.06, C.trim, g);
  // Dutch flag at the stern.
  const zFl = tipD.stern - 0.6;
  cyl(0.05, 3.2, C.trim, 0, deckY(zFl) + 1.6, zFl, g);
  for (const [i, c] of ['#ae1c28', '#f4f4f4', '#21468b'].entries())
    box(0.04, 0.33, 1.4, c, 0, deckY(zFl) + 3 - i * 0.33, zFl + 0.7, g);
  // Big fenders hanging along both sides.
  for (const k of [-1, 1])
    for (let z = -0.3 * L; z <= 0.3 * L; z += 0.15 * L) {
      const f = cyl(0.65, 1.3, C.black, k * (B / 2 + 0.55), 1.4, z, g);
      f.rotation.x = Math.PI / 2;
    }
  // Life rings on the house front.
  for (const k of [-1, 1]) {
    const ring = mesh(
      new T.TorusGeometry(0.4, 0.12, 6, 12),
      '#e6894d',
      k * hw * 0.7,
      4.6,
      zH0 - 0.08,
      g,
    );
    ring.rotation.y = 0;
  }
  // Name on the white bow bulwark, in the company colour (as LEONORE, ZEELAND).
  const cv = document.createElement('canvas');
  cv.width = 512;
  cv.height = 80;
  const cx = cv.getContext('2d');
  if (cx) {
    cx.fillStyle = company;
    cx.font = 'bold 56px sans-serif';
    cx.textAlign = 'center';
    cx.textBaseline = 'middle';
    cx.fillText(name, 256, 42);
  }
  const tex = new T.CanvasTexture(cv);
  const nameMat = new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
  const zFwd = -0.445 * L,
    zAft = -0.395 * L;
  for (const k of [-1, 1]) {
    // Follow the curving bow: from aft to fore on starboard, fore to aft on port,
    // so the name reads left to right from either side.
    const a = { x: k * (side(zAft).hd + 0.06), z: zAft },
      f = { x: k * (side(zFwd).hd + 0.06), z: zFwd },
      [p0, p1] = k > 0 ? [a, f] : [f, a];
    const len = Math.hypot(p1.x - p0.x, p1.z - p0.z);
    const plate = new T.Mesh(new T.PlaneGeometry(len, len / 6.4), nameMat);
    const y = Math.max(side(zAft).yd, side(zFwd).yd) + 0.65;
    plate.position.set((p0.x + p1.x) / 2, y, (p0.z + p1.z) / 2);
    plate.rotation.y = Math.atan2(-(p1.z - p0.z), p1.x - p0.x);
    g.add(plate);
  }
  return g;
}
