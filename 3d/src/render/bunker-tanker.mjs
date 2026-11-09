import * as T from '../../vendor/three.js';
import { hullOutline } from '../game/ship-profile.mjs';
import { createPrimitives } from './primitives.mjs';
import { batchVessel } from './scene-batch.mjs';

// Arcs of the navigation lights (RPR/BPR art. 3.08, bijlage 3), bearing in degrees from
// right ahead, positive to starboard: masthead 225° (112.5° each side), side lights
// 112.5° from ahead to 22.5° abaft the beam, stern light the remaining 135° aft.
export function navSector(kind, bearing) {
  const a = ((((bearing + 180) % 360) + 360) % 360) - 180;
  if (kind === 'masthead') return Math.abs(a) <= 112.5;
  // Side lights cut off 1–3° across the bow, so right ahead both are seen.
  if (kind === 'starboard') return a >= -2 && a <= 112.5;
  if (kind === 'port') return a <= 2 && a >= -112.5;
  if (kind === 'stern') return Math.abs(a) >= 112.5;
  return true;
}
let glowTexture = null;
// Soft additive glow; only in a browser (the GLB export and tests run without a DOM).
function glowSprite(color, x, y, z, parent, size) {
  if (typeof document === 'undefined') return null;
  if (!glowTexture) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    const c = cv.getContext('2d'),
      g = c?.createRadialGradient?.(32, 32, 1, 32, 32, 31);
    if (g) {
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.18, 'rgba(255,255,255,0.85)');
      g.addColorStop(0.45, 'rgba(255,255,255,0.25)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, 64, 64);
    }
    glowTexture = new T.CanvasTexture(cv);
  }
  const sp = new T.Sprite(
    new T.SpriteMaterial({
      map: glowTexture,
      color,
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
    }),
  );
  sp.position.set(x, y, z);
  sp.scale.set(size, size, 1);
  parent.add(sp);
  return sp;
}

// Leonore-inspired tanker. Metres, waterline y=0, bow -z, port -x.
// Batch each rigid assembly BEFORE parenting/posing it: moving parts stay movable.
export function createBunkerTanker(profile, { editable = false } = {}) {
  const { length: L, beam: B } = profile;
  const root = new T.Group();
  root.name = 'Bunkerguru-tanker';
  root.userData.dimensions = { length: L, beam: B };
  const fixed = new T.Group();
  fixed.name = 'Hull-and-deck';
  root.add(fixed);
  const { mesh, box, beam } = createPrimitives(fixed);
  const C = {
    hull: '#202b30',
    blue: '#247dc5',
    white: '#eef2ed',
    deck: '#8b8c7a', // steengrijs (RAL 7030)
    cap: '#ffa500', // pet van de stuurhut
    steel: '#657679',
    glass: '#183b4b',
    pipe: '#b2b7ad',
    rubber: '#172125',
  };
  const tube = (r, h, c, x, y, z, p = fixed) =>
    mesh(new T.CylinderGeometry(r, r, h, 10), c, x, y, z, p);
  const rod = (a, b, r = 0.06, c = C.white, p = fixed) => beam(a, b, r, c, p);
  const finish = (group) => {
    if (!editable) batchVessel(group);
    return group;
  };
  const shape = new T.Shape();
  for (const [method, ...args] of hullOutline(profile)) shape[method](...args);
  shape.closePath();
  const outline = shape.getPoints(18);
  // A chine below water, rounded bow and full, softly rounded transom above it.
  const vertices = [],
    indices = [];
  const levels = [
    [-2.8, 0.7, 0.93],
    [-1.3, 0.91, 0.98],
    [0.15, 1, 1],
    [2.65, 1, 1],
  ];
  for (const [y, sx, sz] of levels) for (const p of outline) vertices.push(p.x * sx, y, p.y * sz);
  const n = outline.length;
  for (let k = 0; k < levels.length - 1; k++)
    for (let i = 0; i < n - 1; i++) {
      const a = k * n + i,
        b = a + n;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  const hullGeometry = new T.BufferGeometry();
  hullGeometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
  hullGeometry.setIndex(indices);
  hullGeometry.computeVertexNormals();
  const hull = mesh(hullGeometry, C.hull);
  hull.name = 'Hull';
  const deck = mesh(new T.ShapeGeometry(shape), C.deck, 0, 2.66, 0);
  deck.rotation.x = Math.PI / 2;
  deck.material.side = T.DoubleSide;
  const bottom = mesh(new T.ShapeGeometry(shape), C.hull, 0, -2.8, 0);
  bottom.scale.set(0.7, 0.93, 1);
  bottom.rotation.x = Math.PI / 2;
  // White end bulwarks (buitenboeiing) fore and aft with a broad blue capping rail
  // (potdeksel) on top, following the actual outline.
  for (let i = 0; i < n - 1; i++) {
    const a = outline[i],
      b = outline[i + 1];
    if ((a.y + b.y) / 2 < -L * 0.34 || (a.y + b.y) / 2 > L * 0.37) {
      const wall = box(a.distanceTo(b), 0.95, 0.16, C.white, (a.x + b.x) / 2, 2.9, (a.y + b.y) / 2);
      wall.rotation.y = -Math.atan2(b.y - a.y, b.x - a.x);
      const capRail = box(
        a.distanceTo(b) + 0.08,
        0.1,
        0.32,
        C.blue,
        (a.x + b.x) / 2,
        3.42,
        (a.y + b.y) / 2,
      );
      capRail.rotation.y = wall.rotation.y;
    }
  }
  const rail = (x, z0, z1, y = 2.7) => {
    for (const h of [0.55, 1.05]) rod([x, y + h, z0], [x, y + h, z1], 0.035);
    const count = Math.ceil((z1 - z0) / 2.8);
    for (let i = 0; i <= count; i++) {
      const z = z0 + ((z1 - z0) * i) / count;
      rod([x, y, z], [x, y + 1.08, z], 0.045);
    }
  };
  for (const side of [-1, 1]) rail(side * B * 0.465, -L * 0.34, L * 0.24);

  // Accommodation, aft sun deck and broad wheelhouse. Eye position stays clear.
  box(B * 0.83, 3.1, L * 0.225, C.white, 0, 4.25, L * 0.355);
  box(B * 0.86, 0.18, L * 0.23, C.blue, 0, 5.85, L * 0.355);
  box(B * 0.77, 2.3, L * 0.085, C.white, 0, 7.1, L * 0.285);
  // Wheelhouse cap (pet): orange roof overhanging the house all round.
  box(B * 0.81, 0.2, L * 0.095, C.cap, 0, 8.35, L * 0.285);
  box(B * 0.8, 0.07, L * 0.094, C.cap, 0, 8.48, L * 0.285);
  box(B * 0.71, 1.28, 0.06, C.glass, 0, 7.45, L * 0.242 - 0.03);
  box(B * 0.7, 1.18, 0.06, C.glass, 0, 7.45, L * 0.328 + 0.03);
  for (let i = -2; i <= 2; i++) box(0.08, 1.4, 0.11, C.white, i * B * 0.14, 7.45, L * 0.242 - 0.06);
  for (const side of [-1, 1]) {
    box(0.06, 1.25, L * 0.07, C.glass, side * B * 0.388, 7.45, L * 0.285);
    for (let i = 0; i < 5; i++) {
      const z = L * (0.27 + i * 0.039);
      box(0.08, 1.15, 1.3, C.steel, side * B * 0.418, 4.65, z);
      box(0.09, 0.93, 1.08, C.glass, side * B * 0.423, 4.65, z);
    }
    rail(side * B * 0.42, L * 0.34, L * 0.455, 5.95);
    // Fender tyres and lifebuoys.
    for (let z = -L * 0.25; z < L * 0.39; z += L * 0.16) {
      const tyre = mesh(new T.TorusGeometry(0.42, 0.17, 6, 12), C.rubber, side * B * 0.503, 1.4, z);
      tyre.rotation.y = Math.PI / 2;
      rod([side * B * 0.48, 2.7, z], [side * B * 0.51, 1.7, z], 0.035, C.steel);
    }
    const ring = mesh(
      new T.TorusGeometry(0.4, 0.105, 6, 16),
      '#ef572d',
      side * B * 0.425,
      4.8,
      L * 0.345,
    );
    ring.rotation.y = Math.PI / 2;
  }
  // Engine-room ventilation and two modest exhausts, instead of a sea-ship funnel.
  box(B * 0.27, 2.3, 0.15, C.steel, 0, 4.1, L * 0.469);
  for (let i = 0; i < 8; i++) box(B * 0.26, 0.07, 0.2, C.hull, 0, 3.2 + i * 0.26, L * 0.47);
  for (const x of [-B * 0.3, B * 0.3]) tube(0.17, 1.5, C.hull, x, 6.65, L * 0.425);
  box(1.9, 0.15, 1.05, '#bd9967', 0, 6.8, L * 0.39);
  for (const z of [L * 0.38, L * 0.4]) box(1.9, 0.15, 0.28, '#bd9967', 0, 6.35, z);
  // Ladder onto the aft deck.
  for (const x of [-B * 0.28 - 0.28, -B * 0.28 + 0.28])
    rod([x, 2.8, L * 0.475], [x, 6.25, L * 0.475], 0.045);
  for (let y = 3; y < 6.2; y += 0.32)
    rod([-B * 0.28 - 0.28, y, L * 0.475], [-B * 0.28 + 0.28, y, L * 0.475], 0.04);

  // Repeated tank fittings; no above-deck cylindrical cargo tanks.
  const bays = Math.max(4, Math.round(L / 16));
  for (let i = 0; i < bays; i++) {
    const z = -L * 0.28 + (i * (L * 0.46)) / (bays - 1);
    for (const side of [-1, 1]) {
      const x = side * B * 0.24;
      tube(0.62, 0.22, C.steel, x, 2.83, z);
      tube(0.53, 0.16, C.white, x, 3.02, z);
      rod([x - 0.2, 3.16, z], [x + 0.2, 3.16, z], 0.04, C.hull);
      tube(0.18, 0.5, C.blue, side * B * 0.13, 3.1, z + 1.1);
      const valve = mesh(
        new T.TorusGeometry(0.25, 0.045, 5, 10),
        C.blue,
        side * B * 0.13,
        3.5,
        z + 1.1,
      );
      valve.rotation.x = Math.PI / 2;
      rod([side * B * 0.13, 3, z], [x, 3, z], 0.1, C.pipe);
    }
  }
  for (const x of [-0.95, -0.45, 0.45, 0.95])
    rod([x, 3.12, -L * 0.33], [x, 3.12, L * 0.205], 0.1, C.pipe);
  box(1.15, 0.14, L * 0.54, C.steel, 0, 3.75, -L * 0.065);
  for (let z = -L * 0.31; z < L * 0.21; z += 4) {
    box(1.8, 0.1, 0.18, C.white, 0, 3.7, z);
    rod([-0.48, 2.7, z], [-0.48, 3.7, z], 0.05, C.steel);
  }
  rail(-0.57, -L * 0.32, L * 0.2, 3.8);
  // Cross-deck bunker manifold and blue flanged outlets.
  for (const z of [-L * 0.1, L * 0.08]) {
    rod([-B * 0.37, 3.15, z], [B * 0.37, 3.15, z], 0.18, C.pipe);
    for (const side of [-1, 1]) {
      const flange = tube(0.32, 0.15, C.blue, side * B * 0.37, 3.15, z);
      flange.rotation.z = Math.PI / 2;
      const reel = mesh(
        new T.TorusGeometry(0.7, 0.2, 6, 16),
        C.rubber,
        side * B * 0.31,
        3.55,
        z + 2,
      );
      reel.rotation.y = Math.PI / 2;
      box(0.6, 0.3, 1.8, C.blue, side * B * 0.31, 2.9, z + 2);
    }
  }
  for (const z of [-L * 0.42, L * 0.445])
    for (const side of [-1, 1]) {
      const x = side * B * 0.28;
      box(1.5, 0.15, 1.2, C.steel, x, 2.8, z);
      for (const dx of [-0.4, 0.4]) {
        tube(0.15, 0.55, C.hull, x + dx, 3.1, z);
        tube(0.22, 0.09, C.hull, x + dx, 3.4, z);
      }
    }
  // Anchor windlass and foremast.
  box(B * 0.38, 0.4, 1.4, C.blue, 0, 2.95, -L * 0.41);
  rod([-B * 0.18, 3.5, -L * 0.41], [B * 0.18, 3.5, -L * 0.41], 0.18, C.steel);
  // Foremast carries the masthead light at least 1 m above the side lights (RPR/BPR 3.08).
  rod([0, 2.8, -L * 0.435], [0, 8.4, -L * 0.435], 0.1);
  rod([-1.8, 7.2, -L * 0.435], [1.8, 7.2, -L * 0.435], 0.06);
  rod([0, 8.5, L * 0.3], [0, 11.1, L * 0.3], 0.09);
  for (const x of [-B * 0.32, B * 0.32]) rod([x, 8.5, L * 0.3], [x, 10.9, L * 0.3], 0.025);
  for (const z of [-L * 0.23, L * 0.13]) rod([0, 3.8, z], [0, 5.1, z], 0.055);
  finish(fixed);

  const radar = new T.Group();
  radar.name = 'Radar-rotor';
  box(3.0, 0.18, 0.28, C.white, 0, 0.12, 0, radar);
  box(0.5, 0.3, 0.45, C.blue, 0, -0.05, 0, radar);
  finish(radar);
  radar.position.set(0, 10.5, L * 0.3);
  root.add(radar);

  const slew = new T.Group(),
    lift = new T.Group();
  slew.name = 'Bunker-boom-slew';
  lift.name = 'Bunker-boom-lift';
  const boomLength = Math.min(25, L * 0.255);
  tube(0.85, 0.4, C.blue, B * 0.15, 2.9, -L * 0.3, root);
  tube(0.48, 1.7, C.white, B * 0.15, 3.7, -L * 0.3, root);
  const boom = new T.Group();
  boom.name = 'Bunker-boom-truss';
  for (const x of [-0.45, 0.45])
    for (const y of [-0.32, 0.32]) rod([x, y, 0], [x, y, boomLength], 0.065, C.steel, boom);
  const sections = Math.ceil(boomLength / 1.7);
  for (let i = 0; i < sections; i++) {
    const z0 = (i * boomLength) / sections,
      z1 = ((i + 1) * boomLength) / sections;
    for (const x of [-0.45, 0.45])
      rod([x, i % 2 ? 0.32 : -0.32, z0], [x, i % 2 ? -0.32 : 0.32, z1], 0.04, C.white, boom);
    rod([-0.45, 0.32, z0], [0.45, 0.32, z0], 0.04, C.white, boom);
  }
  rod([0, -0.05, 0], [0, -0.05, boomLength], 0.15, C.rubber, boom);
  finish(boom);
  lift.add(boom);
  slew.add(lift);
  slew.position.set(B * 0.15, 4.6, -L * 0.3);
  root.add(slew);
  // A hanging hose follows the tip, but stays vertical when the boom raises.
  const hose = new T.Group();
  hose.name = 'Bunker-hose';
  const hoseCurve = new T.CatmullRomCurve3([
    new T.Vector3(),
    new T.Vector3(0.15, -1.4, 0.1),
    new T.Vector3(0.45, -3.2, 0.3),
    new T.Vector3(0.8, -4, 0.1),
  ]);
  mesh(new T.TubeGeometry(hoseCurve, 10, 0.16, 6, false), C.rubber, 0, 0, 0, hose);
  tube(0.25, 0.22, C.blue, 0.8, -4, 0.1, hose);
  finish(hose);
  slew.add(hose);

  const nav = new T.Group(),
    deckLights = new T.Group(),
    cabin = new T.Group();
  nav.name = 'Navigation-lights';
  deckLights.name = 'Deck-lights';
  cabin.name = 'Wheelhouse-lights';
  root.add(nav, deckLights, cabin);
  const glow = (color) =>
    new T.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2.5 });
  const red = glow('#ff3026'),
    green = glow('#29ed80'),
    white = glow('#fff2cc');
  const lamp = (x, y, z, material, group, radius = 0.14) =>
    mesh(new T.SphereGeometry(radius, 8, 6), material, x, y, z, group);
  // Navigation lights of a motor vessel under way (RPR/BPR art. 3.08), each with the
  // arc it may be seen in (see navSector). The lamp bodies are tiny at game distance,
  // so every light also gets a glow sprite that shows only inside its own arc.
  const navLights = [
    ['masthead', 0, 8.45, -L * 0.435, white, '#fff4d6'],
    ['masthead', 0, 11.15, L * 0.3, white, '#fff4d6'], // second, higher masthead light aft
    ['port', -B * 0.4, 7.2, L * 0.255, red, '#ff3b2f'],
    ['starboard', B * 0.4, 7.2, L * 0.255, green, '#2bff7a'],
    ['stern', 0, 3.4, L * 0.49, white, '#fff4d6'],
  ].map(([kind, x, y, z, material, color]) => ({
    kind,
    lamp: lamp(x, y, z, material, nav),
    glow: glowSprite(color, x, y, z, nav, kind === 'stern' ? 9 : 11),
  }));
  // Moored (BPR 3.20): navigation lights off, one white all-round light instead
  // (simplified: on the wheelhouse mast rather than on the fairway side).
  const mooring = new T.Group();
  mooring.name = 'Mooring-light';
  root.add(mooring);
  lamp(0, 11.15, L * 0.3, white, mooring);
  const mooringGlow = glowSprite('#fff4d6', 0, 11.15, L * 0.3, mooring, 11);
  for (const z of [-L * 0.23, L * 0.13]) {
    lamp(0, 5.1, z, white, deckLights, 0.19);
    // Two bounded lights only; no shadow maps on mobile.
    const spot = new T.SpotLight('#fff1cd', 300, L * 0.45, Math.PI / 2.8, 0.6, 2);
    spot.position.set(0, 5.1, z);
    spot.quaternion.setFromUnitVectors(
      new T.Vector3(0, 0, -1),
      new T.Vector3(0, -2.5, -L * 0.08).normalize(),
    );
    spot.target.position.set(0, 0, -1);
    spot.add(spot.target);
    deckLights.add(spot);
  }
  const cabinMat = glow('#ffc776');
  box(B * 0.68, 0.16, 0.04, cabinMat, 0, 6.93, L * 0.242 - 0.08, cabin);
  for (const side of [-1, 1])
    box(0.07, 0.17, L * 0.065, cabinMat, side * B * 0.392, 6.93, L * 0.285, cabin);

  const controls = {
    radar: true,
    navigation: true,
    deck: false,
    cabin: false,
    boomSide: 0,
    boomRaised: false,
  };
  let yaw = 0,
    elevation = 0;
  function update(dt, settings = controls) {
    const delta = Math.max(0, Math.min(0.25, Number.isFinite(dt) ? dt : 0));
    if (settings.radar !== false)
      radar.rotation.y = (radar.rotation.y + delta * Math.PI * 0.8) % (Math.PI * 2);
    const side = [-1, 0, 1].includes(settings.boomSide) ? settings.boomSide : 0;
    const targetYaw = (side * Math.PI) / 2;
    // Raise before slewing; centre before lowering back onto the support.
    const desiredElevation = side || settings.boomRaised || Math.abs(yaw) > 0.01 ? 0.65 : 0;
    // boomRate > 1 while delivering: bunkering takes only a few seconds.
    const rate = delta * (settings.boomRate > 0 ? settings.boomRate : 1);
    elevation += T.MathUtils.clamp(desiredElevation - elevation, -rate * 0.22, rate * 0.22);
    if (elevation > 0.5 || side === 0)
      yaw += T.MathUtils.clamp(targetYaw - yaw, -rate * 0.35, rate * 0.35);
    slew.rotation.y = yaw;
    lift.rotation.x = -elevation;
    hose.position.set(0, Math.sin(elevation) * boomLength, Math.cos(elevation) * boomLength);
    hose.visible = elevation > 0.5;
    nav.visible = settings.navigation !== false && !settings.moored;
    mooring.visible = settings.navigation !== false && settings.moored === true;
    deckLights.visible = settings.deck === true;
    cabin.visible = settings.cabin === true;
  }
  update(0);
  // Per frame: each glow only inside its arc as seen from the camera, brighter at night.
  const eye = new T.Vector3();
  function lights(cameraWorld, night = 1) {
    const strength = 0.35 + 0.65 * Math.min(1, Math.max(0, night));
    for (const n of navLights) {
      if (!n.glow) continue;
      eye.copy(cameraWorld);
      n.lamp.parent.worldToLocal(eye).sub(n.lamp.position);
      // 0° = right ahead (−z), positive towards starboard (+x).
      const bearing = (Math.atan2(eye.x, -eye.z) * 180) / Math.PI;
      // Lamp body and glow alike: the colour is never seen outside its arc.
      n.glow.visible = n.lamp.visible = navSector(n.kind, bearing);
      n.glow.material.opacity = strength;
    }
    if (mooringGlow) mooringGlow.material.opacity = strength;
  }
  root.userData.tanker = {
    controls,
    update,
    lights,
    radar,
    slew,
    lift,
    hose,
    nav,
    navLights,
    mooring,
    deckLights,
    cabin,
  };
  return root;
}
