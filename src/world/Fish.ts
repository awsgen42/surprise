import * as THREE from "three";

// Shimmering schools of small fish just beneath the surface. They drift and
// school gently, and briefly gather around the glowing ripple the visitor makes
// (Emotional Systems §3), then disperse. Pure GPU points — no models, near-zero
// CPU cost.

const vert = /* glsl */ `
  uniform float uTime;
  uniform float uReveal;
  uniform float uSize;
  uniform vec3  uTarget;
  uniform float uTargetTime;
  attribute vec3 aHome;
  attribute float aRand;
  varying float vA;
  void main(){
    vec3 p = aHome;
    // gentle schooling drift
    p.x += sin(uTime * 0.5 + aRand * 6.28) * 4.0;
    p.z += cos(uTime * 0.4 + aRand * 6.28) * 4.0;
    p.y += sin(uTime * 1.2 + aRand * 10.0) * 0.25;

    // gather toward a recent ripple, fading over a few seconds
    float age = uTime - uTargetTime;
    float pull = clamp(1.0 - age / 4.5, 0.0, 1.0);
    vec3 toT = uTarget - p;
    float d = length(toT.xz);
    float near = smoothstep(24.0, 3.0, d); // only fish nearby respond
    p += normalize(toT + vec3(0.0001)) * pull * near * min(d, 16.0) * 0.45;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float tw = 0.45 + 0.55 * sin(uTime * 3.0 + aRand * 30.0); // scales catch light
    vA = tw * uReveal;
    gl_PointSize = min(uSize * (0.5 + aRand) * (200.0 / -mv.z), 9.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const frag = /* glsl */ `
  varying float vA;
  void main(){
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float c = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vec3(0.75, 0.92, 1.0), c * vA * 0.8);
  }
`;

export class Fish {
  points: THREE.Points;
  private mat: THREE.ShaderMaterial;

  constructor(count: number) {
    const home = new Float32Array(count * 3);
    const rand = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      home[i * 3] = (Math.random() - 0.5) * 160;
      home[i * 3 + 1] = -0.4 + Math.random() * 1.0; // just under/at the surface
      home[i * 3 + 2] = 10 - Math.random() * 120;
      rand[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    // position is required by three; mirror the home buffer
    geo.setAttribute("position", new THREE.BufferAttribute(home.slice(), 3));
    geo.setAttribute("aHome", new THREE.BufferAttribute(home, 3));
    geo.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));

    this.mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uReveal: { value: 0 },
        uSize: { value: 5 },
        uTarget: { value: new THREE.Vector3(0, 0, -40) },
        uTargetTime: { value: -100 },
      },
    });
    this.points = new THREE.Points(geo, this.mat);
    this.points.frustumCulled = false;
  }

  /** Draw the nearby school toward a world point (a ripple). */
  gatherAt(world: THREE.Vector3, time: number) {
    this.mat.uniforms.uTarget.value.copy(world);
    this.mat.uniforms.uTargetTime.value = time;
  }

  update(t: number, reveal: number) {
    this.mat.uniforms.uTime.value = t;
    this.mat.uniforms.uReveal.value = reveal;
  }

  dispose() {
    this.points.geometry.dispose();
    this.mat.dispose();
  }
}
