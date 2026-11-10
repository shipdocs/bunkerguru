import * as T from '../../vendor/three.js';
// Tilt-shift: the miniature look. The scene is drawn into a texture, then shown with
// a sharp band across the ship and a growing blur above and below it, plus a touch
// more colour. One extra full-screen pass: it costs a little, it does not save
// drawing by itself. Off in the light graphics mode (phones) and in the wheelhouse.
// strength(focusY) is pure, so the band can be tested: 0 inside it, 1 at the edges.
export const TILT = { band: 0.16, reach: 0.42, maxBlur: 7 };
export function blurAt(y, focusY = 0.5, t = TILT) {
  const d = Math.max(0, Math.abs(y - focusY) - t.band) / t.reach;
  const k = Math.min(1, d);
  return k * k * (3 - 2 * k);
}
export function createTiltShift(renderer) {
  if (!renderer?.getDrawingBufferSize || !renderer.setRenderTarget) return null; // tests
  const size = new T.Vector2();
  let target = null;
  const material = new T.ShaderMaterial({
    uniforms: {
      map: { value: null },
      px: { value: new T.Vector2(1, 1) },
      focus: { value: 0.5 },
      band: { value: TILT.band },
      reach: { value: TILT.reach },
      maxBlur: { value: TILT.maxBlur },
    },
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader: `varying vec2 vUv;uniform sampler2D map;uniform vec2 px;uniform float focus;uniform float band;uniform float reach;uniform float maxBlur;
void main(){float d=clamp(max(0.,abs(vUv.y-focus)-band)/reach,0.,1.);float k=d*d*(3.-2.*d);vec3 c=texture2D(map,vUv).rgb;
if(k>.01){vec2 r=px*maxBlur*k;vec3 s=c;
s+=texture2D(map,vUv+r*vec2(.0,1.)).rgb;s+=texture2D(map,vUv+r*vec2(.87,.5)).rgb;s+=texture2D(map,vUv+r*vec2(.87,-.5)).rgb;
s+=texture2D(map,vUv+r*vec2(.0,-1.)).rgb;s+=texture2D(map,vUv+r*vec2(-.87,-.5)).rgb;s+=texture2D(map,vUv+r*vec2(-.87,.5)).rgb;
s+=texture2D(map,vUv+r*vec2(.5,.0)).rgb;s+=texture2D(map,vUv+r*vec2(-.25,.43)).rgb;s+=texture2D(map,vUv+r*vec2(-.25,-.43)).rgb;
c=s/10.;}
float l=dot(c,vec3(.299,.587,.114));c=mix(vec3(l),c,1.18);gl_FragColor=vec4(c,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`,
    depthTest: false,
    depthWrite: false,
  });
  const quad = new T.Mesh(new T.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  const quadScene = new T.Scene(),
    quadCamera = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  quadScene.add(quad);
  return {
    // focusY: screen height (0 bottom … 1 top) that stays sharp.
    render(scene, camera, focusY = 0.5) {
      renderer.getDrawingBufferSize(size);
      if (!target || target.width !== size.x || target.height !== size.y) {
        target?.dispose();
        target = new T.WebGLRenderTarget(size.x, size.y, {
          type: T.HalfFloatType,
          samples: 4,
          depthBuffer: true,
        });
        material.uniforms.map.value = target.texture;
        material.uniforms.px.value.set(1 / size.x, 1 / size.y);
      }
      material.uniforms.focus.value = focusY;
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(quadScene, quadCamera);
    },
  };
}
