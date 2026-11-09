import * as T from '../../vendor/three.js';
export function createWater(mesh) {
  // Stylised water: analytic waves, a single plane, no reflection render pass.
  const waterMat = new T.ShaderMaterial({
    uniforms: { time: { value: 0 }, sun: { value: new T.Vector3(-0.4, 0.8, 0.3).normalize() } },
    vertexShader: `varying vec3 wp;void main(){vec4 w=modelMatrix*vec4(position,1.);wp=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader: `varying vec3 wp;uniform float time;uniform vec3 sun;
void main(){vec2 p=wp.xz;float a=p.x*.18+p.y*.09+time*.6;float b=p.x*.07-p.y*.23-time*.45;float c=p.x*.43+p.y*.3+time*.8;
float h=sin(a)*.55+sin(b)*.3+sin(c)*.15;vec3 n=normalize(vec3(-cos(a)*.1-cos(b)*.021-cos(c)*.0645,1.,-cos(a)*.0495+cos(b)*.069-cos(c)*.045));
vec3 v=normalize(cameraPosition-wp);float fres=pow(1.-max(dot(n,v),0.),3.);float light=pow(max(dot(reflect(-sun,n),v),0.),96.);
vec3 color=mix(vec3(.04,.30,.42),vec3(.42,.74,.82),fres*.8);color+=h*.018;float ripple=smoothstep(.94,1.,sin(a+sin(b)*.35))*smoothstep(.5,.9,sin(b*.6));color+=vec3(.16,.22,.18)*ripple*.16;
color+=vec3(1.,.87,.61)*light*.36;float fog=1.-exp(-distance(cameraPosition,wp)*.00065);color=mix(color,vec3(.68,.80,.77),fog);gl_FragColor=vec4(color,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`,
  });
  const water = mesh(new T.PlaneGeometry(14000, 14000), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.castShadow = false;

  return waterMat;
}
