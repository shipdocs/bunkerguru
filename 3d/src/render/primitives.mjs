import * as T from '../../vendor/three.js';
// Labels in the wheelhouse view: at eye level a 40–90 m wide name board right ahead
// fills the window. There they keep a modest, distance-based size instead.
export const labelView = { bridge: false };
// On-screen width ≈ 0.12 rad (about 1/8 of the view), never wider than the label's
// own size, at least 3 m; beyond 1.2 km they fade out.
export function bridgeLabelScale(scale, d) {
  return Math.min(scale, Math.max(3, d * 0.12));
}
export function createPrimitives(scene) {
  const mats = new Map();
  function material(c) {
    if (!mats.has(c))
      mats.set(c, new T.MeshStandardMaterial({ color: c, roughness: 0.76, metalness: 0.1 }));
    return mats.get(c);
  }
  function mesh(g, c, x = 0, y = 0, z = 0, parent = scene) {
    const m = new T.Mesh(g, typeof c === 'string' || typeof c === 'number' ? material(c) : c);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function box(w, h, d, c, x, y, z, p = scene) {
    return mesh(new T.BoxGeometry(w, h, d), c, x, y, z, p);
  }
  function cyl(r, h, c, x, y, z, p = scene) {
    return mesh(new T.CylinderGeometry(r, r, h, 20), c, x, y, z, p);
  }
  function beam(a, b, width, c, p = scene) {
    const A = new T.Vector3(...a),
      B = new T.Vector3(...b);
    let m = mesh(new T.CylinderGeometry(width, width, A.distanceTo(B), 6), c, 0, 0, 0, p);
    m.position.copy(A).add(B).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), B.sub(A).normalize());
    return m;
  }
  // Text with a dark outline so it reads on water, land and sky. grow > 0 keeps a
  // minimum on-screen size: the sprite never gets smaller than grow × camera distance.
  function textSprite(text, x, y, z, scale = 25, color = '#e9edda', p = scene, grow = 0) {
    const cv = document.createElement('canvas');
    cv.width = 512;
    cv.height = 96;
    let c = cv.getContext('2d');
    c.font = 'bold 38px sans-serif';
    c.textAlign = 'center';
    c.lineJoin = 'round';
    c.lineWidth = 9;
    c.strokeStyle = 'rgba(12, 34, 42, 0.85)';
    c.strokeText(text, 256, 59);
    c.fillStyle = color;
    c.fillText(text, 256, 59);
    const sprite = new T.Sprite(
      new T.SpriteMaterial({ map: new T.CanvasTexture(cv), depthTest: true, transparent: true }),
    );
    sprite.position.set(x, y, z);
    sprite.scale.set(scale, (scale * 96) / 512, 1);
    const world = new T.Vector3();
    sprite.onBeforeRender = (renderer, sc, camera) => {
      sprite.getWorldPosition(world);
      const d = world.distanceTo(camera.position);
      let s = scale,
        o = 1;
      if (labelView.bridge) {
        s = bridgeLabelScale(scale, d);
        o = Math.max(0, Math.min(1, (1200 - d) / 300));
      } else if (grow > 0) {
        // Readable nearby and at mid range; far labels fade out instead of
        // cluttering the horizon behind the instruments.
        s = Math.min(Math.max(scale, d * grow), scale * 3);
        o = Math.max(0, Math.min(1, (1700 - d) / 400));
      }
      if (sprite.scale.x !== s) sprite.scale.set(s, (s * 96) / 512, 1);
      sprite.material.opacity = o;
    };
    p.add(sprite);
    return sprite;
  }

  return { mesh, box, cyl, beam, textSprite };
}
