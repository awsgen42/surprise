import * as THREE from "three";
import { SIMPLEX } from "@/shaders/lib/glsl";

const MAX_RIPPLES = 14;

const vertex = /* glsl */ `
uniform float uTime;
uniform float uReveal;      // 0..1 how "awake" the sea is
uniform vec4  uRipples[${MAX_RIPPLES}]; // xz = center, z=start time, w=strength

varying vec3 vWorldPos;
varying float vHeight;
varying float vCrest;
varying float vRipple;

${SIMPLEX}

// A single Gerstner wave contribution.
vec3 gerstner(vec2 pos, vec2 dir, float steep, float wl, float speed, float t){
  float k = 6.28318 / wl;
  float c = sqrt(9.8 / k) * speed;
  vec2 d = normalize(dir);
  float f = k * (dot(d, pos) - c * t);
  float a = steep / k;
  return vec3(
    d.x * (a * cos(f)),
    a * sin(f),
    d.y * (a * cos(f))
  );
}

float rippleHeight(vec2 pos){
  float h = 0.0;
  for (int i = 0; i < ${MAX_RIPPLES}; i++){
    vec4 r = uRipples[i];
    if (r.w <= 0.0) continue;
    float age = uTime - r.z;
    if (age < 0.0 || age > 4.0) continue;
    float dist = distance(pos, r.xy);
    float ring = sin(dist * 2.2 - age * 6.0);
    float envelope = exp(-dist * 0.35) * exp(-age * 1.4);
    h += ring * envelope * r.w * 0.6;
  }
  return h;
}

vec3 displace(vec2 pos, float t){
  vec3 g = vec3(0.0);
  g += gerstner(pos, vec2(1.0, 0.3), 0.16, 12.0, 1.0, t);
  g += gerstner(pos, vec2(-0.6, 1.0), 0.13, 7.5, 1.1, t);
  g += gerstner(pos, vec2(0.8, -0.7), 0.10, 4.8, 1.25, t);
  g += gerstner(pos, vec2(-1.0, -0.4), 0.07, 3.0, 1.4, t);
  // fine chop
  g.y += snoise(pos * 0.6 + t * 0.15) * 0.12;
  g.y += rippleHeight(pos);
  return g;
}

void main(){
  vec3 pos = position;
  vec2 p2 = pos.xy; // plane is in XY before rotation via mesh

  float t = uTime;
  vec3 g = displace(p2, t);

  // amplitude scales up as the sea "awakens".
  // The mesh carries a -90deg X rotation (so the base geometry is horizontal
  // and raycasting works), which maps local +Z -> world +Y. So the wave HEIGHT
  // must go into the local Z component to end up as world up.
  float wake = mix(0.15, 1.0, uReveal);
  vec3 displaced = vec3(pos.x + g.x * wake, pos.y + g.z * wake, g.y * wake);

  // crest estimate via neighbouring sample
  float eps = 0.4;
  float hL = displace(p2 - vec2(eps, 0.0), t).y;
  float hR = displace(p2 + vec2(eps, 0.0), t).y;
  float hD = displace(p2 - vec2(0.0, eps), t).y;
  float hU = displace(p2 + vec2(0.0, eps), t).y;
  vHeight = g.y;
  vCrest = clamp((g.y - (hL+hR+hD+hU)*0.25) * 2.5 + 0.5, 0.0, 1.0);
  vRipple = clamp(abs(rippleHeight(p2)) * 3.0, 0.0, 1.0);

  vec4 world = modelMatrix * vec4(displaced, 1.0);
  vWorldPos = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const fragment = /* glsl */ `
precision highp float;
uniform float uTime;
uniform float uReveal;
uniform vec3  uCamPos;
uniform vec3  uMoonDir;
uniform vec3  uMoonColor;
uniform vec3  uDeep;
uniform vec3  uShallow;
uniform vec3  uBio;

varying vec3 vWorldPos;
varying float vHeight;
varying float vCrest;
varying float vRipple;

${SIMPLEX}

void main(){
  vec3 viewDir = normalize(uCamPos - vWorldPos);

  // approximate normal from height gradient in world space is costly;
  // use an up-biased normal perturbed by crest for a soft sheen.
  vec3 normal = normalize(vec3(0.0, 1.0, 0.0));

  // fresnel — water darkens overhead, glows brighter toward the horizon
  float fres = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);

  // base water gradient with depth
  float depthMix = smoothstep(-0.4, 0.6, vHeight);
  vec3 base = mix(uDeep, uShallow, depthMix * 0.6 + fres * 0.5);

  // moon glitter: tight specular glints where the surface faces the moon,
  // concentrated into a soft vertical path — kept restrained so it reads as
  // shimmer, not a floodlight.
  vec3 h = normalize(viewDir + uMoonDir);
  float spec = pow(max(dot(normal, h), 0.0), 120.0);
  float glitter = snoise(vWorldPos.xz * 3.0 + uTime * 0.5);
  spec *= (0.4 + 0.6 * max(glitter, 0.0));
  float moonPath = exp(-pow((vWorldPos.x - uMoonDir.x * 40.0) * 0.02, 2.0));
  vec3 moonGlow = uMoonColor * spec * (0.35 + moonPath * 1.1);

  // bioluminescence: living blue-green light beneath the surface, brightest
  // on wave crests, along ripples, and shimmering with slow noise
  float glowNoise = 0.5 + 0.5 * snoise(vWorldPos.xz * 0.5 + uTime * 0.25);
  float bio = vCrest * 0.5 + vRipple * 1.0 + glowNoise * 0.18;
  bio *= uReveal;
  vec3 bioLight = uBio * bio * 0.55;

  // sparkle: tiny bright pinpricks like plankton catching light
  float sparkleField = snoise(vWorldPos.xz * 8.0 + uTime * 1.2);
  float sparkle = smoothstep(0.9, 1.0, sparkleField) * uReveal;
  bioLight += uBio * sparkle * 0.9;

  // foam on the sharpest crests
  float foam = smoothstep(0.82, 1.0, vCrest) * uReveal;
  vec3 foamCol = vec3(0.7, 0.85, 1.0) * foam * 0.3;

  vec3 color = base * 0.5 + moonGlow + bioLight + foamCol;

  // horizon haze fade toward the deep night
  float dist = length(uCamPos.xz - vWorldPos.xz);
  float haze = smoothstep(50.0, 170.0, dist);
  color = mix(color, uDeep * 0.5, haze * 0.9);

  // keep highlights from running away into the bloom
  color = min(color, vec3(1.6));

  gl_FragColor = vec4(color, 1.0);
}
`;

export class Ocean {
  mesh: THREE.Mesh;
  private mat: THREE.ShaderMaterial;
  private ripples: THREE.Vector4[] = [];
  private rippleIndex = 0;

  constructor(mobile: boolean) {
    const size = 400;
    const seg = mobile ? 140 : 220;
    const geo = new THREE.PlaneGeometry(size, size, seg, seg);

    for (let i = 0; i < MAX_RIPPLES; i++)
      this.ripples.push(new THREE.Vector4(0, 0, -100, 0));

    this.mat = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: {
        uTime: { value: 0 },
        uReveal: { value: 0 },
        uCamPos: { value: new THREE.Vector3() },
        uMoonDir: { value: new THREE.Vector3(0.25, 0.5, -1).normalize() },
        uMoonColor: { value: new THREE.Color(0xdfe9ff) },
        uDeep: { value: new THREE.Color(0x02040f) },
        uShallow: { value: new THREE.Color(0x0a2a55) },
        uBio: { value: new THREE.Color(0x36e0c8) },
        uRipples: { value: this.ripples },
      },
    });

    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = 0;
    this.mesh.frustumCulled = false;
  }

  setMoon(dir: THREE.Vector3, color: THREE.Color) {
    this.mat.uniforms.uMoonDir.value.copy(dir);
    this.mat.uniforms.uMoonColor.value.copy(color);
  }

  /** Add a bioluminescent ripple at a plane coordinate (local XY of the plane). */
  addRipple(x: number, z: number, strength = 1) {
    const r = this.ripples[this.rippleIndex % MAX_RIPPLES];
    // plane local space: x maps to x, world z maps to plane y before rotation
    r.set(x, z, this.mat.uniforms.uTime.value, strength);
    this.rippleIndex++;
  }

  update(elapsed: number, camPos: THREE.Vector3, reveal: number) {
    this.mat.uniforms.uTime.value = elapsed;
    this.mat.uniforms.uReveal.value = reveal;
    this.mat.uniforms.uCamPos.value.copy(camPos);
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mat.dispose();
  }
}
