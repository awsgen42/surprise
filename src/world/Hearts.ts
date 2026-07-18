import * as THREE from "three";

// Floating, collectible glowing hearts drifting over the sea. Tapping one
// "collects" it (it pulses and rises away) and delivers a love message. Kept as
// a small group of billboarded meshes for easy, reliable raycasting.

type HeartItem = {
  mesh: THREE.Mesh;
  phase: number;
  speed: number;
  collected: boolean;
};

const vert = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
`;

const frag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uAlpha;
  void main(){
    // classic heart implicit: (x^2 + y^2 - 1)^3 - x^2 y^3 = 0
    vec2 p = (vUv - 0.5) * 2.6;
    p.y += 0.35;
    float xx = p.x * p.x;
    float yy = p.y * p.y;
    float f = pow(xx + yy - 1.0, 3.0) - xx * p.y * yy;
    float inside = smoothstep(0.06, -0.06, f);
    float d = length(p);
    float glow = smoothstep(1.6, 0.0, d) * 0.5;
    float pulse = 0.85 + 0.15 * sin(uTime * 3.0);
    vec3 col = mix(vec3(1.0,0.55,0.75), vec3(1.0,0.8,0.9), inside);
    float a = (inside * pulse + glow) * uAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(col, a);
  }
`;

export class Hearts {
  group: THREE.Group;
  private items: HeartItem[] = [];
  private mats: THREE.ShaderMaterial[] = [];

  constructor(count: number) {
    this.group = new THREE.Group();
    const geo = new THREE.PlaneGeometry(3.2, 3.2);
    for (let i = 0; i < count; i++) {
      const mat = new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uAlpha: { value: 0 } },
      });
      this.mats.push(mat);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData.heartId = `heart-${i + 1}`;
      const x = (Math.random() - 0.5) * 70;
      const z = 6 - Math.random() * 55;
      mesh.position.set(x, 2 + Math.random() * 4, z);
      this.group.add(mesh);
      this.items.push({
        mesh,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.5,
        collected: false,
      });
    }
  }

  getTapTargets(): THREE.Object3D[] {
    return this.items.filter((i) => !i.collected).map((i) => i.mesh);
  }
  resolveHeartId(obj: THREE.Object3D | null): string | null {
    let o: THREE.Object3D | null = obj;
    while (o) {
      if (o.userData?.heartId) return o.userData.heartId as string;
      o = o.parent;
    }
    return null;
  }
  isCollected(id: string) {
    return !!this.items.find((i) => i.mesh.userData.heartId === id)?.collected;
  }
  markCollected(id: string) {
    const it = this.items.find((i) => i.mesh.userData.heartId === id);
    if (it) it.collected = true;
  }
  get total() {
    return this.items.length;
  }

  update(t: number, reveal: number, camera: THREE.Camera) {
    this.group.visible = reveal > 0.3;
    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i];
      const m = it.mesh;
      const mat = this.mats[i];
      mat.uniforms.uTime.value = t;
      if (it.collected) {
        m.position.y += 0.08;
        mat.uniforms.uAlpha.value = Math.max(0, mat.uniforms.uAlpha.value - 0.02);
        if (mat.uniforms.uAlpha.value <= 0) m.visible = false;
      } else {
        m.position.y += Math.sin(t * it.speed + it.phase) * 0.004;
        m.position.x += Math.sin(t * 0.15 + it.phase) * 0.004;
        mat.uniforms.uAlpha.value = Math.min(
          0.9,
          mat.uniforms.uAlpha.value + 0.01
        );
      }
      m.lookAt(camera.position);
    }
  }

  dispose() {
    this.group.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
    });
    this.mats.forEach((m) => m.dispose());
  }
}
