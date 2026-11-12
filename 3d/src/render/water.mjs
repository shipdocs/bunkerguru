import * as T from '../../vendor/three.js';
import { MAP, WARP, SHAPE, land, worldBounds } from '../maps/index.mjs';
// Distance to the nearest shore, baked once into a small texture (metres, signed:
// negative under the land). The shader reads it for the shallows, the dark foot of
// the quay wall and the foam that laps against it.
const REACH = 56,
  UNDER = 8;
// The texture covers the warped world; every texel is looked up on the straight map
// (maps/warp.mjs), where the land is rectangles. Distances are map metres: within a
// few per cent of the world, plenty for foam and shallows.
// A real outline (maps/shape.mjs): rows filled from the crossings of the outline,
// distances from every stretch of wall to the texels within reach of it.
function shapeField(cell, x0, z0, w, h) {
  const water = new Uint8Array(w * h),
    d = new Float32Array(w * h).fill(Infinity);
  for (let j = 0; j < h; j++) {
    const z = z0 + (j + 0.5) * cell,
      xs = [];
    for (const r of SHAPE.rings)
      for (let i = 0, k = r.length - 1; i < r.length; k = i++) {
        const a = r[i],
          b = r[k];
        if (a.z > z !== b.z > z) xs.push(a.x + ((z - a.z) / (b.z - a.z)) * (b.x - a.x));
      }
    xs.sort((a, b) => a - b);
    for (let q = 0; q + 1 < xs.length; q += 2) {
      const i0 = Math.max(0, Math.ceil((xs[q] - x0) / cell - 0.5)),
        i1 = Math.min(w - 1, Math.floor((xs[q + 1] - x0) / cell - 0.5));
      for (let i = i0; i <= i1; i++) water[j * w + i] = 1;
    }
  }
  const reach = REACH + 4;
  for (const r of SHAPE.rings)
    for (let i = 0, k = r.length - 1; i < r.length; k = i++) {
      const a = r[k],
        b = r[i],
        dx = b.x - a.x,
        dz = b.z - a.z,
        l2 = dx * dx + dz * dz || 1;
      const i0 = Math.max(0, Math.floor((Math.min(a.x, b.x) - reach - x0) / cell)),
        i1 = Math.min(w - 1, Math.ceil((Math.max(a.x, b.x) + reach - x0) / cell)),
        j0 = Math.max(0, Math.floor((Math.min(a.z, b.z) - reach - z0) / cell)),
        j1 = Math.min(h - 1, Math.ceil((Math.max(a.z, b.z) + reach - z0) / cell));
      for (let j = j0; j <= j1; j++)
        for (let ii = i0; ii <= i1; ii++) {
          const x = x0 + (ii + 0.5) * cell,
            z = z0 + (j + 0.5) * cell,
            t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / l2)),
            e = Math.hypot(x - a.x - dx * t, z - a.z - dz * t),
            q = j * w + ii;
          if (e < d[q]) d[q] = e;
        }
    }
  const data = new Uint8Array(w * h * 4);
  for (let q = 0; q < w * h; q++) {
    const sd = water[q] ? Math.min(REACH, d[q]) : -Math.min(UNDER, d[q]);
    data[q * 4] = Math.round(((sd + UNDER) / (REACH + UNDER)) * 255);
  }
  return data;
}
function shoreField(cell) {
  const x0 = worldBounds.x0 - 64,
    z0 = worldBounds.z0 - 64,
    w = Math.ceil((worldBounds.x1 - worldBounds.x0 + 128) / cell),
    h = Math.ceil((worldBounds.z1 - worldBounds.z0 + 128) / cell),
    out = new Float32Array(w * h).fill(REACH),
    inside = new Float32Array(w * h).fill(-1);
  if (SHAPE) {
    const tex = new T.DataTexture(
      shapeField(cell, x0, z0, w, h),
      w,
      h,
      T.RGBAFormat,
      T.UnsignedByteType,
    );
    tex.magFilter = tex.minFilter = T.LinearFilter;
    tex.needsUpdate = true;
    return { tex, min: new T.Vector2(x0, z0), size: new T.Vector2(w * cell, h * cell) };
  }
  const wet = (x, z) => !land.some((l) => x > l.x0 && x < l.x1 && z > l.z0 && z < l.z1);
  // Inverse warp per texel: z = Z − f(X), x = X − g(z); f only depends on the column.
  const fcol = new Float32Array(w);
  for (let i = 0; i < w; i++) fcol[i] = WARP.f(x0 + (i + 0.5) * cell);
  const W = MAP.halfWidth + 64;
  for (const l of land) {
    // The box round the warped rectangle (cut off at the chart edge).
    const c = {
      x0: Math.max(l.x0, -W),
      x1: Math.min(l.x1, W),
      z0: Math.max(l.z0, MAP.zMin - 64),
      z1: Math.min(l.z1, MAP.zMax + 64),
    };
    let bx0 = Infinity,
      bx1 = -Infinity,
      bz0 = Infinity,
      bz1 = -Infinity;
    for (let k = 0; k <= 40; k++)
      for (const [x, z] of [
        [c.x0 + ((c.x1 - c.x0) * k) / 40, c.z0],
        [c.x0 + ((c.x1 - c.x0) * k) / 40, c.z1],
        [c.x0, c.z0 + ((c.z1 - c.z0) * k) / 40],
        [c.x1, c.z0 + ((c.z1 - c.z0) * k) / 40],
      ]) {
        const p = WARP.forward(x, z);
        bx0 = Math.min(bx0, p.x);
        bx1 = Math.max(bx1, p.x);
        bz0 = Math.min(bz0, p.z);
        bz1 = Math.max(bz1, p.z);
      }
    const reach = REACH * 1.2 + 4;
    const i0 = Math.max(0, Math.floor((bx0 - reach - x0) / cell)),
      i1 = Math.min(w - 1, Math.ceil((bx1 + reach - x0) / cell)),
      j0 = Math.max(0, Math.floor((bz0 - reach - z0) / cell)),
      j1 = Math.min(h - 1, Math.ceil((bz1 + reach - z0) / cell));
    for (let j = j0; j <= j1; j++)
      for (let i = i0; i <= i1; i++) {
        const z = z0 + (j + 0.5) * cell - fcol[i],
          x = x0 + (i + 0.5) * cell - WARP.g(z),
          dx = Math.max(l.x0 - x, 0, x - l.x1),
          dz = Math.max(l.z0 - z, 0, z - l.z1),
          k = j * w + i;
        if (dx > 0 || dz > 0) {
          const d = Math.hypot(dx, dz);
          if (d < out[k]) out[k] = d;
          continue;
        }
        // Under the land: how far to open water, looking only at edges that are shore.
        let d = inside[k] < 0 ? UNDER : inside[k];
        if (x - l.x0 < d && wet(l.x0 - 0.5, z)) d = x - l.x0;
        if (l.x1 - x < d && wet(l.x1 + 0.5, z)) d = l.x1 - x;
        if (z - l.z0 < d && wet(x, l.z0 - 0.5)) d = z - l.z0;
        if (l.z1 - z < d && wet(x, l.z1 + 0.5)) d = l.z1 - z;
        inside[k] = d;
      }
  }
  // RGBA bytes: the one format every WebGL version takes without fuss.
  const data = new Uint8Array(w * h * 4);
  for (let k = 0; k < w * h; k++)
    data[k * 4] = Math.round(
      (((inside[k] >= 0 ? -inside[k] : out[k]) + UNDER) / (REACH + UNDER)) * 255,
    );
  const tex = new T.DataTexture(data, w, h, T.RGBAFormat, T.UnsignedByteType);
  tex.magFilter = tex.minFilter = T.LinearFilter;
  tex.needsUpdate = true;
  return { tex, min: new T.Vector2(x0, z0), size: new T.Vector2(w * cell, h * cell) };
}
// A tileable wave normal map, made once: crossing swells of whole wave numbers, so the
// texture repeats without a seam. Two copies scroll across each other in the shader.
function waveNormals(N = 256) {
  const hgt = new Float32Array(N * N),
    waves = [];
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 28; k++) {
    const kx = Math.round((rnd() - 0.5) * 2 * (2 + k)),
      kz = Math.round((rnd() - 0.5) * 2 * (2 + k)) || 1;
    waves.push([kx, kz, rnd() * 6.283, 1 / Math.pow(Math.hypot(kx, kz) + 1, 1.2)]);
  }
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      let v = 0;
      for (const [kx, kz, ph, a] of waves) v += a * Math.sin(((kx * i + kz * j) / N) * 6.283 + ph);
      hgt[j * N + i] = v;
    }
  const data = new Uint8Array(N * N * 4),
    at = (i, j) => hgt[((j + N) % N) * N + ((i + N) % N)];
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const dx = (at(i + 1, j) - at(i - 1, j)) * 2.2,
        dz = (at(i, j + 1) - at(i, j - 1)) * 2.2,
        l = Math.hypot(dx, 1, dz),
        k = (j * N + i) * 4;
      data[k] = Math.round((-dx / l) * 127.5 + 127.5);
      data[k + 1] = Math.round((1 / l) * 127.5 + 127.5);
      data[k + 2] = Math.round((-dz / l) * 127.5 + 127.5);
      data[k + 3] = 255;
    }
  const tex = new T.DataTexture(data, N, N, T.RGBAFormat, T.UnsignedByteType);
  tex.wrapS = tex.wrapT = T.RepeatWrapping;
  tex.magFilter = T.LinearFilter;
  tex.minFilter = T.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}
// Mirror image of the harbour in the water (rich graphics only): the scene seen from
// below the surface, rendered at half size just before the water is drawn. After
// three.js examples/objects/Reflector.js (MIT).
function createMirror(renderer, mesh, uniforms, scale = 0.5) {
  const target = new T.WebGLRenderTarget(256, 256, { type: T.HalfFloatType }),
    cam = new T.PerspectiveCamera(),
    plane = new T.Plane(),
    normal = new T.Vector3(),
    pos = new T.Vector3(),
    camPos = new T.Vector3(),
    rot = new T.Matrix4(),
    look = new T.Vector3(0, 0, -1),
    view = new T.Vector3(),
    tgt = new T.Vector3(),
    clip = new T.Vector4(),
    q = new T.Vector4(),
    size = new T.Vector2();
  uniforms.mirror.value = target.texture;
  uniforms.mirrorOn.value = 1;
  let busy = false,
    sprites = [],
    lastScan = -1;
  mesh.onBeforeRender = (r, scene, camera) => {
    if (busy) return;
    pos.setFromMatrixPosition(mesh.matrixWorld);
    normal.set(0, 1, 0);
    camPos.setFromMatrixPosition(camera.matrixWorld);
    view.subVectors(pos, camPos);
    if (view.dot(normal) > 0) return; // looking at it from below
    r.getDrawingBufferSize(size);
    const w = Math.max(64, Math.round(size.x * scale)),
      h = Math.max(64, Math.round(size.y * scale));
    if (target.width !== w || target.height !== h) target.setSize(w, h);
    view.reflect(normal).negate().add(pos);
    rot.extractRotation(camera.matrixWorld);
    look.set(0, 0, -1).applyMatrix4(rot).add(camPos);
    tgt.subVectors(pos, look).reflect(normal).negate().add(pos);
    cam.position.copy(view);
    cam.up.set(0, 1, 0).applyMatrix4(rot).reflect(normal);
    cam.lookAt(tgt);
    cam.far = camera.far;
    cam.updateMatrixWorld();
    cam.projectionMatrix.copy(camera.projectionMatrix);
    uniforms.mirrorMatrix.value
      .set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1)
      .multiply(cam.projectionMatrix)
      .multiply(cam.matrixWorldInverse);
    // Oblique near plane: nothing below the water ends up in its mirror image.
    plane.setFromNormalAndCoplanarPoint(normal, pos).applyMatrix4(cam.matrixWorldInverse);
    clip.set(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
    const pm = cam.projectionMatrix.elements;
    q.x = (Math.sign(clip.x) + pm[8]) / pm[0];
    q.y = (Math.sign(clip.y) + pm[9]) / pm[5];
    q.z = -1;
    q.w = (1 + pm[10]) / pm[14];
    clip.multiplyScalar(2 / clip.dot(q));
    pm[2] = clip.x;
    pm[6] = clip.y;
    pm[10] = clip.z + 1 - 0.003;
    pm[14] = clip.w;
    // Name labels, rain and clouds stay out of the mirror (a mirrored word reads wrong,
    // a cloud seen from below is a dark blot).
    const now = performance.now();
    if (now - lastScan > 1000) {
      lastScan = now;
      sprites = [];
      scene.traverse(
        (o) =>
          (o.isSprite || o.isPoints || o.name === 'cloud' || o.name === 'rain') && sprites.push(o),
      );
    }
    const shown = sprites.filter((o) => o.visible);
    for (const o of shown) o.visible = false;
    busy = true;
    mesh.visible = false;
    const before = r.getRenderTarget(),
      xr = r.xr.enabled,
      shadows = r.shadowMap.autoUpdate;
    try {
      r.xr.enabled = false;
      r.shadowMap.autoUpdate = false;
      r.setRenderTarget(target);
      r.state.buffers.depth.setMask(true);
      if (r.autoClear === false) r.clear();
      r.render(scene, cam);
    } finally {
      // Whatever happens in the mirror render, the scene is put back as it was.
      r.xr.enabled = xr;
      r.shadowMap.autoUpdate = shadows;
      r.setRenderTarget(before);
      mesh.visible = true;
      busy = false;
      for (const o of shown) o.visible = true;
    }
  };
  return target;
}
export function createWater(mesh, map, quality = { light: false }, renderer = null) {
  // Water: one plane, a wave normal map in two scrolling layers, the sky (and on rich
  // graphics the harbour itself) mirrored by Fresnel, the shore field for shallows,
  // the dark foot of the quay and foam lapping against it.
  const shore = shoreField(quality.light ? 8 : 4);
  const uniforms = {
    time: { value: 0 },
    night: { value: 0 },
    gloom: { value: 0 },
    fogCol: { value: new T.Vector3(0.68, 0.8, 0.77) },
    skyTop: { value: new T.Vector3(0.05, 0.3, 0.75) },
    // Towards the sun, as the scene's light stands: (−220, 220, 160) from the boat.
    sun: { value: new T.Vector3(-220, 220, 160).normalize() },
    shore: { value: shore.tex },
    shoreMin: { value: shore.min },
    shoreSize: { value: shore.size },
    fogDensity: { value: 0.00026 },
    waves: { value: waveNormals(quality.light ? 128 : 256) },
    mirror: { value: null },
    mirrorOn: { value: 0 },
    mirrorMatrix: { value: new T.Matrix4() },
  };
  // The scene's lights, so the water can take the sun's shadow map (ships, cranes and
  // bridges throw their shadow on the water too).
  Object.assign(uniforms, T.UniformsUtils.clone(T.UniformsLib.lights));
  const waterMat = new T.ShaderMaterial({
    uniforms,
    lights: true,
    vertexShader: `varying vec3 wp;varying vec4 mp;uniform mat4 mirrorMatrix;
#include <common>
#include <shadowmap_pars_vertex>
void main(){
#include <beginnormal_vertex>
#include <defaultnormal_vertex>
#include <begin_vertex>
#include <project_vertex>
#include <worldpos_vertex>
#include <shadowmap_vertex>
vec4 w=modelMatrix*vec4(position,1.);wp=w.xyz;mp=mirrorMatrix*w;}`,
    fragmentShader: `#include <common>
#include <packing>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
varying vec3 wp;varying vec4 mp;uniform float time;uniform vec3 sun;uniform float night;uniform float gloom;uniform vec3 fogCol;uniform vec3 skyTop;
uniform sampler2D shore;uniform vec2 shoreMin;uniform vec2 shoreSize;uniform float fogDensity;
uniform sampler2D waves;uniform sampler2D mirror;uniform float mirrorOn;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
void main(){vec2 p=wp.xz;float dist=distance(cameraPosition,wp);
vec2 uv=(p-shoreMin)/shoreSize;float d=${REACH}.;
if(uv.x>0.&&uv.x<1.&&uv.y>0.&&uv.y<1.)d=texture2D(shore,uv).r*${REACH + UNDER}.-${UNDER}.;
// wind patches roughen or calm the surface
float gust=vnoise(p*.006+vec2(time*.02,0.));float calm=mix(.6,1.2,gust);
// two layers of small waves crossing each other, plus a long swell
vec3 n1=texture2D(waves,p/38.+vec2(time*.021,time*.013)).rgb*2.-1.;
vec3 n2=texture2D(waves,p/17.+vec2(-time*.017,time*.027)).rgb*2.-1.;
float sw=p.x*.07-p.y*.05+time*.5;
vec3 n=vec3(n1.x+n2.x*.7+cos(sw)*.08,0.,n1.z+n2.z*.7+sin(sw)*.05);
float fade=1./(1.+dist*.0035);
n=normalize(vec3(n.x*calm*fade*.65,1.,n.z*calm*fade*.65));
vec3 v=normalize(cameraPosition-wp);float cosv=max(dot(n,v),0.);
float fres=.04+.96*pow(1.-cosv,5.);
// the water itself: a dark green-grey river, lighter and greener over the shallows
float deepness=smoothstep(2.,46.,d);
vec3 body=mix(vec3(.05,.2,.19),vec3(.018,.085,.11),deepness);
body=mix(body,body*1.25,.5*gust);
// what it mirrors: the sky by day (horizon to zenith), the harbour on rich graphics
vec3 rd=reflect(-v,n);vec3 sky=mix(fogCol,skyTop,smoothstep(0.,.55,rd.y));
vec3 refl=sky;
if(mirrorOn>.5){vec2 m=mp.xy/mp.w+n.xz*.06;vec4 h=texture2D(mirror,clamp(m,.001,.999));refl=mix(sky,h.rgb,h.a>0.?.92:0.);}
vec3 color=mix(body,refl,clamp(fres*1.15+.06,0.,1.));
// in the shadow of a hull, a crane or a bridge: darker, and no sun on the waves
float shade=getShadowMask();color*=mix(.62,1.,shade);
// the quay: a dark foot under the wall, then foam washing against it
color*=mix(.6,1.,smoothstep(.0,7.,d));
float wob=sin(p.x*.37+time*.9)*sin(p.y*.33-time*.7);
float lap=smoothstep(.55,1.,sin(d*.95-time*1.3+wob*1.1))*(1.-smoothstep(2.,12.,d))*.22;
float edge=(1.-smoothstep(.5,1.7+wob*.5,d))*.8;
float foam=max(lap,edge)*step(-.4,d);
color=mix(color,vec3(.8,.88,.86),foam*(.7+.3*vnoise(p*1.7+time*.3)));
color*=mix(1.,.3,night);
// sun: a broad sheen and sharp glitter where the small waves catch it
vec3 r=reflect(-sun,n);float sd=max(dot(r,v),0.);
color+=shade*vec3(1.,.9,.7)*(pow(sd,300.)*1.3+pow(sd,24.)*.07)*(1.-night*.9)*(1.-gloom*.8)*(.6+.4*calm);
float fog=1.-exp(-dist*dist*fogDensity*fogDensity);color=mix(color,fogCol,fog);gl_FragColor=vec4(color,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`,
  });
  const water = mesh(new T.PlaneGeometry(14000, 14000), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.castShadow = false;
  water.receiveShadow = true;
  waterMat.userData.mesh = water; // tide moves it up and down
  if (renderer && !quality.light) createMirror(renderer, water, uniforms);
  return waterMat;
}
