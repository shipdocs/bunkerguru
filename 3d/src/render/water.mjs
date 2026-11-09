import * as T from '../../vendor/three.js';
import { MAP, land } from '../maps/index.mjs';
// Distance to the nearest shore, baked once into a small texture (metres, signed:
// negative under the land). The shader reads it for the shallows, the dark foot of
// the quay wall and the foam that laps against it.
const REACH = 56,
  UNDER = 8;
function shoreField(cell) {
  const x0 = -MAP.halfWidth - 64,
    z0 = MAP.zMin - 64,
    w = Math.ceil((MAP.halfWidth * 2 + 128) / cell),
    h = Math.ceil((MAP.zMax - MAP.zMin + 128) / cell),
    out = new Float32Array(w * h).fill(REACH),
    inside = new Float32Array(w * h).fill(-1);
  const wet = (x, z) => !land.some((l) => x > l.x0 && x < l.x1 && z > l.z0 && z < l.z1);
  for (const l of land) {
    const i0 = Math.max(0, Math.floor((l.x0 - REACH - x0) / cell)),
      i1 = Math.min(w - 1, Math.ceil((l.x1 + REACH - x0) / cell)),
      j0 = Math.max(0, Math.floor((l.z0 - REACH - z0) / cell)),
      j1 = Math.min(h - 1, Math.ceil((l.z1 + REACH - z0) / cell));
    for (let j = j0; j <= j1; j++)
      for (let i = i0; i <= i1; i++) {
        const x = x0 + (i + 0.5) * cell,
          z = z0 + (j + 0.5) * cell,
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
export function createWater(mesh, map, quality = { light: false }) {
  // Stylised water: analytic waves, a single plane, no reflection render pass.
  const shore = shoreField(quality.light ? 8 : 4);
  const waterMat = new T.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      night: { value: 0 },
      fogCol: { value: new T.Vector3(0.68, 0.8, 0.77) },
      sun: { value: new T.Vector3(-0.4, 0.8, 0.3).normalize() },
      shore: { value: shore.tex },
      shoreMin: { value: shore.min },
      shoreSize: { value: shore.size },
      fogDensity: { value: 0.00026 },
    },
    vertexShader: `varying vec3 wp;void main(){vec4 w=modelMatrix*vec4(position,1.);wp=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader: `varying vec3 wp;uniform float time;uniform vec3 sun;uniform float night;uniform vec3 fogCol;
uniform sampler2D shore;uniform vec2 shoreMin;uniform vec2 shoreSize;uniform float fogDensity;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
void main(){vec2 p=wp.xz;float dist=distance(cameraPosition,wp);
// distance to the shore in metres
vec2 uv=(p-shoreMin)/shoreSize;float d=${REACH}.;
if(uv.x>0.&&uv.x<1.&&uv.y>0.&&uv.y<1.)d=texture2D(shore,uv).r*${REACH + UNDER}.-${UNDER}.;
// waves: a few crossing swells, and wind patches that roughen or calm the surface
float gust=vnoise(p*.006+vec2(time*.02,0.));float calm=mix(.55,1.25,gust);
float a=p.x*.18+p.y*.09+time*.6;float b=p.x*.07-p.y*.23-time*.45;float c=p.x*.43+p.y*.3+time*.8;
float e=p.x*.31-p.y*.52+time*1.1;float g=-p.x*.83+p.y*.61+time*1.5;
float h=sin(a)*.5+sin(b)*.3+sin(c)*.15+sin(e)*.1;
float fade=1./(1.+dist*.0016);
vec3 n=normalize(vec3((-cos(a)*.1-cos(b)*.021-cos(c)*.0645-cos(e)*.05+cos(g)*.06)*calm*fade,1.,
(-cos(a)*.0495+cos(b)*.069-cos(c)*.045+cos(e)*.08-cos(g)*.045)*calm*fade));
vec3 v=normalize(cameraPosition-wp);float fres=pow(1.-max(dot(n,v),0.),3.);
// colour: deep channel, greener shallows near the bank, the sky mirrored at low angles
float deepness=smoothstep(2.,46.,d);
vec3 color=mix(vec3(.07,.40,.44),vec3(.016,.19,.36),deepness);
color=mix(color,vec3(.03,.27,.42),.35+.3*gust);
vec3 skyc=mix(vec3(.36,.66,.86),fogCol,.45);
color=mix(color,skyc,fres*.72);color+=h*.014*calm;
// drawn wave crests, more of them where the wind blows
float ripple=smoothstep(.93,1.,sin(a+sin(b)*.35))*smoothstep(.4,.9,sin(b*.6+gust*4.));
color+=vec3(.2,.26,.24)*ripple*.22*fade*calm;
// the quay: a dark foot under the wall, then foam washing against it
color*=mix(.62,1.,smoothstep(.0,7.,d));
float wob=sin(p.x*.37+time*.9)*sin(p.y*.33-time*.7);
float lap=smoothstep(.55,1.,sin(d*.95-time*1.3+wob*1.1))*(1.-smoothstep(2.,12.,d))*.26;
float edge=(1.-smoothstep(.5,1.7+wob*.5,d))*.85;
float foam=max(lap,edge)*step(-.4,d);
color=mix(color,vec3(.86,.95,.94),foam*(.75+.25*vnoise(p*1.7+time*.3)));
color*=mix(1.,.26,night);
// sun: a broad sheen and sharp glitter
vec3 r=reflect(-sun,n);float sd=max(dot(r,v),0.);
float spark=step(.72,vnoise(p*.9+vec2(time*.7,-time*.5)));
color+=vec3(1.,.88,.62)*(pow(sd,180.)*1.1*(.4+spark)+pow(sd,22.)*.1)*(1.-night*.85);
float fog=1.-exp(-dist*dist*fogDensity*fogDensity);color=mix(color,fogCol,fog);gl_FragColor=vec4(color,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`,
  });
  const water = mesh(new T.PlaneGeometry(14000, 14000), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.castShadow = false;
  waterMat.userData.mesh = water; // tide moves it up and down

  return waterMat;
}
