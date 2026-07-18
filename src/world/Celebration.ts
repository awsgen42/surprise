import * as THREE from "three";

// The birthday celebration FX (Emotional Systems §6): floating balloons, drifting
// confetti, gentle (photosensitivity-safe) fireworks, and a final constellation
// that settles into a heart. Everything is dormant until trigger() and scales /
// calms under reduced motion.

const confettiVert = /* glsl */ `
  uniform float uTime; uniform float uSize; uniform float uActive;
  attribute vec3 aVel; attribute float aRand; attribute vec3 aColor;
  varying vec3 vColor; varying float vA;
  void main(){
    vColor = aColor;
    float life = mod(uTime * 0.25 + aRand, 1.0);
    vec3 p = position;
    p.y -= life * 60.0;                 // fall
    p.x += sin(uTime * 2.0 + aRand * 30.0) * 3.0; // flutter
    p.z += cos(uTime * 1.5 + aRand * 20.0) * 2.0;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vA = uActive * (1.0 - life);
    gl_PointSize = min(uSize * (0.5 + aRand) * (300.0 / -mv.z), 14.0);
    gl_Position = projectionMatrix * mv;
  }
`;
const confettiFrag = /* glsl */ `
  varying vec3 vColor; varying float vA;
  void main(){
    vec2 uv = gl_PointCoord - 0.5;
    if (length(uv) > 0.5) discard;
    gl_FragColor = vec4(vColor, vA);
  }
`;

const glowFrag = /* glsl */ `
  varying vec2 vUv; uniform vec3 uColor; uniform float uA;
  void main(){
    float d = length(vUv - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor, pow(a,1.6) * uA);
  }
`;
const glowVert = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
`;

// parametric heart point (x,y) roughly in [-1,1]
function heartPoint(t: number): [number, number] {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y =
    13 * Math.cos(t) -
    5 * Math.cos(2 * t) -
    2 * Math.cos(3 * t) -
    Math.cos(4 * t);
  return [x / 17, y / 17];
}

export class Celebration {
  group: THREE.Group;
  private active = false;
  private reduced = false;
  private t0 = 0;
  private mobile: boolean;

  private confetti: THREE.Points;
  private confettiMat: THREE.ShaderMaterial;
  private balloons: { mesh: THREE.Group; speed: number; phase: number }[] = [];
  private balloonHalo: THREE.ShaderMaterial;
  private constellation: THREE.Points;
  private constellationMat: THREE.ShaderMaterial;

  constructor(mobile: boolean) {
    this.mobile = mobile;
    this.group = new THREE.Group();
    this.group.visible = false;

    /* confetti */
    const n = mobile ? 160 : 320;
    const pos = new Float32Array(n * 3);
    const vel = new Float32Array(n * 3);
    const rand = new Float32Array(n);
    const col = new Float32Array(n * 3);
    const palette = [
      new THREE.Color(0xffd07a),
      new THREE.Color(0xff8fbf),
      new THREE.Color(0x8fe0ff),
      new THREE.Color(0xaeffc7),
      new THREE.Color(0xffffff),
    ];
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 120;
      pos[i * 3 + 1] = 20 + Math.random() * 50;
      pos[i * 3 + 2] = -20 - Math.random() * 100;
      rand[i] = Math.random();
      const c = palette[(Math.random() * palette.length) | 0];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    const cgeo = new THREE.BufferGeometry();
    cgeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    cgeo.setAttribute("aVel", new THREE.BufferAttribute(vel, 3));
    cgeo.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));
    cgeo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    this.confettiMat = new THREE.ShaderMaterial({
      vertexShader: confettiVert,
      fragmentShader: confettiFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 8 },
        uActive: { value: 0 },
      },
    });
    this.confetti = new THREE.Points(cgeo, this.confettiMat);
    this.confetti.frustumCulled = false;
    this.group.add(this.confetti);

    /* balloons */
    this.balloonHalo = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: new THREE.Color(0xff9ecb) }, uA: { value: 1 } },
      vertexShader: glowVert,
      fragmentShader: glowFrag,
    });
    const bodyGeo = new THREE.SphereGeometry(0.9, 16, 12);
    const balloonColors = [0xff8fbf, 0xffd07a, 0x8fe0ff, 0xaeffc7];
    const bn = mobile ? 6 : 10;
    for (let i = 0; i < bn; i++) {
      const g = new THREE.Group();
      const color = balloonColors[i % balloonColors.length];
      const body = new THREE.Mesh(
        bodyGeo,
        new THREE.MeshBasicMaterial({ color })
      );
      body.scale.y = 1.25;
      g.add(body);
      const halo = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), this.balloonHalo);
      g.add(halo);
      g.userData.halo = halo;
      g.position.set((Math.random() - 0.5) * 80, -5 - Math.random() * 20, -20 - Math.random() * 60);
      g.visible = false;
      this.group.add(g);
      this.balloons.push({
        mesh: g,
        speed: 3 + Math.random() * 3,
        phase: Math.random() * Math.PI * 2,
      });
    }

    /* constellation heart (in the sky) */
    const hn = 120;
    const hpos = new Float32Array(hn * 3);
    for (let i = 0; i < hn; i++) {
      const [hx, hy] = heartPoint((i / hn) * Math.PI * 2);
      const jitter = 0.06;
      hpos[i * 3] = hx * 34 + (Math.random() - 0.5) * jitter * 34;
      hpos[i * 3 + 1] = 120 + hy * 34 + (Math.random() - 0.5) * jitter * 34;
      hpos[i * 3 + 2] = -260;
    }
    const hgeo = new THREE.BufferGeometry();
    hgeo.setAttribute("position", new THREE.BufferAttribute(hpos, 3));
    this.constellationMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uA: { value: 0 } },
      vertexShader: /* glsl */ `
        uniform float uTime; varying float vTw;
        void main(){
          vTw = 0.6 + 0.4 * sin(uTime * 2.0 + position.x * 0.5);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 6.0 * vTw;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uA; varying float vTw;
        void main(){
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          float c = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(vec3(1.0, 0.85, 0.95), c * uA * vTw);
        }`,
    });
    this.constellation = new THREE.Points(hgeo, this.constellationMat);
    this.constellation.frustumCulled = false;
    this.group.add(this.constellation);
  }

  setReduced(v: boolean) {
    this.reduced = v;
  }

  trigger(elapsed: number) {
    this.active = true;
    this.t0 = elapsed;
    this.group.visible = true;
    for (const b of this.balloons) b.mesh.visible = true;
  }

  update(elapsed: number, dt: number, camera: THREE.Camera) {
    if (!this.active) return;
    const since = elapsed - this.t0;
    this.confettiMat.uniforms.uTime.value = elapsed;
    this.confettiMat.uniforms.uActive.value = Math.min(1, since * 0.5);
    this.constellationMat.uniforms.uTime.value = elapsed;
    // constellation fades in gently a couple of seconds after the reveal
    this.constellationMat.uniforms.uA.value = THREE.MathUtils.clamp(
      (since - 2) / 4,
      0,
      1
    );

    const rise = (this.reduced ? 0.4 : 1) * dt;
    for (const b of this.balloons) {
      const m = b.mesh;
      m.position.y += b.speed * rise;
      m.position.x += Math.sin(elapsed * 0.4 + b.phase) * 0.01;
      if (m.position.y > 70) m.position.y = -5;
      (m.userData.halo as THREE.Mesh).lookAt(camera.position);
    }
  }

  dispose() {
    this.group.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      if (Array.isArray(m.material)) m.material.forEach((x) => x.dispose());
      else if (m.material) (m.material as THREE.Material).dispose();
    });
    this.confettiMat.dispose();
    this.balloonHalo.dispose();
    this.constellationMat.dispose();
  }
}
