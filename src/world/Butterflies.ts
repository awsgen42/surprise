import * as THREE from "three";

// Softly glowing butterflies that flutter near the shore (World Design §7).
// Billboarded shader shapes with flapping wings and gentle Lissajous flight —
// above the surface so they read clearly. No models.

const vert = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
`;

const frag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uSeed;
  uniform float uA;
  uniform vec3 uColor;

  float ellipse(vec2 p, vec2 c, vec2 r){
    vec2 d = (p - c) / r;
    return dot(d, d);
  }

  void main(){
    vec2 p = (vUv - 0.5) * 2.2;
    float flap = 0.30 + 0.16 * sin(uTime * 9.0 + uSeed * 6.28);
    // two wings + a slim body
    float wL = ellipse(p, vec2(-flap, 0.05), vec2(0.34, 0.5));
    float wR = ellipse(p, vec2( flap, 0.05), vec2(0.34, 0.5));
    float body = ellipse(p, vec2(0.0, 0.0), vec2(0.05, 0.42));
    float m = min(min(wL, wR), body);
    float inside = smoothstep(1.05, 0.6, m);
    float glow = smoothstep(1.8, 0.0, m) * 0.35;
    float a = (inside + glow) * uA;
    if (a < 0.01) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;

type Item = {
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  cx: number;
  cz: number;
  ax: number;
  az: number;
  sx: number;
  sz: number;
  phase: number;
};

export class Butterflies {
  group: THREE.Group;
  private items: Item[] = [];

  constructor(count: number) {
    this.group = new THREE.Group();
    const geo = new THREE.PlaneGeometry(2.4, 2.4);
    const palette = [
      new THREE.Color(0xffc7e6),
      new THREE.Color(0xfff0c0),
      new THREE.Color(0xbfe6ff),
    ];
    for (let i = 0; i < count; i++) {
      const mat = new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uSeed: { value: Math.random() },
          uA: { value: 0 },
          uColor: { value: palette[i % palette.length] },
        },
      });
      const mesh = new THREE.Mesh(geo, mat);
      const cx = (Math.random() - 0.5) * 50;
      const cz = 22 - Math.random() * 24;
      mesh.position.set(cx, 3 + Math.random() * 3, cz);
      this.group.add(mesh);
      this.items.push({
        mesh,
        mat,
        cx,
        cz,
        ax: 6 + Math.random() * 8,
        az: 4 + Math.random() * 6,
        sx: 0.3 + Math.random() * 0.3,
        sz: 0.25 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  update(t: number, reveal: number, camera: THREE.Camera) {
    this.group.visible = reveal > 0.35;
    for (const it of this.items) {
      const m = it.mesh;
      m.position.x = it.cx + Math.sin(t * it.sx + it.phase) * it.ax;
      m.position.z = it.cz + Math.cos(t * it.sz + it.phase) * it.az;
      m.position.y = 3.2 + Math.sin(t * 0.8 + it.phase) * 1.2;
      it.mat.uniforms.uTime.value = t;
      it.mat.uniforms.uA.value = Math.min(0.8, it.mat.uniforms.uA.value + 0.01);
      m.lookAt(camera.position);
    }
  }

  dispose() {
    this.items.forEach((it) => {
      it.mesh.geometry.dispose();
      it.mat.dispose();
    });
  }
}
