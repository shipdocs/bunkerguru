import * as T from '../../vendor/three.js';
import { shoreSegments, SHAPE, toWorld } from '../maps/index.mjs';
// Life on the quays: lamp posts along every quay that light up at dusk and throw a warm
// pool on the water below, Dutch flags that flutter on ships and buildings, and people
// strolling along the waterfront at the busy spots. Cheap: two point clouds for all the
// lamps, one waving material for every flag, one instanced mesh for all the people.
const LAMP_GAP = 70; // metres of quay between two lamp posts

function glowTexture() {
  if (typeof document === 'undefined') return null;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const c = cv.getContext('2d'),
    g = c?.createRadialGradient?.(32, 32, 1, 32, 32, 31);
  if (!g) return null;
  g.addColorStop(0, 'rgba(255,236,190,1)');
  g.addColorStop(0.3, 'rgba(255,200,120,0.5)');
  g.addColorStop(1, 'rgba(255,170,80,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 64, 64);
  return new T.CanvasTexture(cv);
}

// Where the lamp posts stand: on the quay a few metres from the wall, one every LAMP_GAP
// metres of quay, and the spot on the water their light falls on. World coordinates.
export function lampSpots(segments = shoreSegments) {
  const posts = [],
    pools = [];
  let run = LAMP_GAP / 2;
  for (const g of segments) {
    run += g.length || Math.max(g.width || 0, g.depth || 0) || 30;
    if (run < LAMP_GAP) continue;
    run = 0;
    const post = SHAPE
        ? { x: g.x - g.nx * 3, z: g.z - g.nz * 3 }
        : toWorld(g.x - g.nx * 3, g.z - g.nz * 3),
      pool = SHAPE
        ? { x: g.x + g.nx * 14, z: g.z + g.nz * 14 }
        : toWorld(g.x + g.nx * 14, g.z + g.nz * 14);
    posts.push(post.x, 11, post.z);
    pools.push(pool.x, 0, pool.z);
  }
  return { posts, pools };
}

// A Dutch flag that waves: the cloth bends along its length, more towards the free end.
const flagMaterial = (() => {
  const m = new T.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    side: T.DoubleSide,
    vertexShader: `uniform float time;varying vec2 vUv;varying float shade;
void main(){vUv=uv;vec3 p=position;float w=sin(uv.x*7.0-time*6.0+position.y*0.3);
p.z+=w*0.22*uv.x;shade=0.85+0.15*w;
gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
    fragmentShader: `varying vec2 vUv;varying float shade;
void main(){vec3 c=vUv.y>0.667?vec3(0.68,0.11,0.16):vUv.y>0.333?vec3(0.96,0.96,0.95):vec3(0.13,0.27,0.55);
gl_FragColor=vec4(c*shade,1.0);}`,
  });
  return m;
})();
const flagGeo = new T.PlaneGeometry(1, 0.66, 8, 2).translate(0.5, 0, 0);
const poleMat = new T.MeshLambertMaterial({ color: '#d9dcdf' });
const poleGeo = new T.CylinderGeometry(0.08, 0.08, 1, 5).translate(0, 0.5, 0);
// A flag on its pole, `size` metres long, standing on (x, y, z) of `parent`.
export function flag(parent, x, y, z, size = 3, height = size * 1.4) {
  const pole = new T.Mesh(poleGeo, poleMat);
  pole.scale.set(size / 3, height, size / 3);
  pole.position.set(x, y, z);
  const cloth = new T.Mesh(flagGeo, flagMaterial);
  cloth.scale.set(size, size, 1);
  cloth.position.set(x, y + height - size * 0.33, z);
  cloth.userData.flag = true;
  parent.add(pole, cloth);
  return cloth;
}

export function createQuayLife(scene, { strollers = [], light = false } = {}) {
  const tex = glowTexture();
  const { posts, pools } = lampSpots();
  const pointCloud = (pts, size, opacity) => {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pts, 3));
    const m = new T.PointsMaterial({
      map: tex,
      size,
      sizeAttenuation: true,
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      opacity: 0,
      color: '#ffd9a0',
    });
    const p = new T.Points(g, m);
    p.frustumCulled = false;
    p.visible = false;
    scene.add(p);
    return p;
  };
  const lamps = pointCloud(posts, 16, 1),
    poolsOnWater = pointCloud(pools, 34, 0.5);
  lamps.name = 'quay lamp posts';
  poolsOnWater.name = 'lamp light on the water';
  // People: a few strolling to and fro along the water at each busy spot.
  const per = light ? 6 : 12,
    people = [];
  for (const s of strollers)
    for (let i = 0; i < per; i++)
      people.push({
        x: s.x,
        z: s.z,
        tx: s.tx,
        tz: s.tz,
        nx: s.nx, // into the water: they walk on the other side
        nz: s.nz,
        off: (Math.random() - 0.5) * 60,
        side: 2 + Math.random() * 6,
        speed: (Math.random() < 0.5 ? -1 : 1) * (0.9 + Math.random() * 0.6),
      });
  const crowd = new T.InstancedMesh(
    new T.CylinderGeometry(0.32, 0.32, 1.75, 5).translate(0, 0.88, 0),
    new T.MeshLambertMaterial(),
    Math.max(1, people.length),
  );
  crowd.name = 'people on the quay';
  crowd.count = people.length;
  crowd.frustumCulled = false;
  crowd.instanceMatrix.setUsage(T.DynamicDrawUsage);
  const coats = [
    '#c0392b',
    '#2c3e50',
    '#f1c40f',
    '#2980b9',
    '#ecf0f1',
    '#27ae60',
    '#8e44ad',
    '#d35400',
  ];
  people.forEach((p, i) => crowd.setColorAt(i, new T.Color(coats[i % coats.length])));
  scene.add(crowd);
  const m = new T.Matrix4();
  return {
    lampCount: posts.length / 3,
    people: people.length,
    update(time, dt, night, level) {
      flagMaterial.uniforms.time.value = time;
      const a = Math.max(0, (night - 0.25) / 0.75);
      lamps.material.opacity = a;
      poolsOnWater.material.opacity = a * 0.45;
      lamps.visible = poolsOnWater.visible = a > 0.01;
      poolsOnWater.position.y = level + 0.4;
      for (let i = 0; i < people.length; i++) {
        const p = people[i];
        p.off += p.speed * dt;
        if (Math.abs(p.off) > 30) p.speed = -p.speed;
        m.makeTranslation(
          p.x + p.tx * p.off - p.nx * p.side,
          4 + Math.abs(Math.sin(time * 6 + i)) * 0.06,
          p.z + p.tz * p.off - p.nz * p.side,
        );
        crowd.setMatrixAt(i, m);
      }
      crowd.instanceMatrix.needsUpdate = true;
    },
  };
}
