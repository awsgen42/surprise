import * as THREE from "three";

/* ------------------------------- Lanterns --------------------------------- */
// Warm paper lanterns drifting on the waves — a soft counterpoint to the cool
// bioluminescence.

export class Lanterns {
  group: THREE.Group;
  private items: { mesh: THREE.Group; phase: number; speed: number }[] = [];
  private haloMat: THREE.ShaderMaterial;

  constructor(count: number) {
    this.group = new THREE.Group();
    this.haloMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: new THREE.Color(0xffb15a) } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: /* glsl */ `
        varying vec2 vUv; uniform vec3 uColor;
        void main(){
          float d = length(vUv - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(uColor, pow(a,1.6));
        }`,
    });

    const bodyGeo = new THREE.SphereGeometry(0.55, 16, 12);
    const bodyMat = new THREE.MeshBasicMaterial({ color: 0xffcaa0 });

    for (let i = 0; i < count; i++) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.scale.y = 1.3;
      g.add(body);
      const halo = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), this.haloMat);
      g.add(halo);
      g.userData.halo = halo;

      const x = (Math.random() - 0.5) * 90;
      const z = 5 - Math.random() * 90;
      g.position.set(x, 1.2, z);
      this.group.add(g);
      this.items.push({
        mesh: g,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.4,
      });
    }
  }

  update(t: number, reveal: number, camera: THREE.Camera) {
    this.group.visible = reveal > 0.25;
    for (const it of this.items) {
      const m = it.mesh;
      m.position.y = 1.0 + Math.sin(t * it.speed + it.phase) * 0.35;
      m.position.x += Math.sin(t * 0.1 + it.phase) * 0.006;
      m.position.z -= 0.006 * it.speed; // slow drift outward
      if (m.position.z < -95) m.position.z = 8;
      (m.userData.halo as THREE.Mesh).lookAt(camera.position);
    }
  }

  dispose() {
    this.group.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
    });
    this.haloMat.dispose();
  }
}

/* ------------------------------- Jellyfish -------------------------------- */
// Soft glowing bells pulsing just beneath the surface.

export class Jellyfish {
  points: THREE.Points;
  private mat: THREE.ShaderMaterial;
  constructor(count: number) {
    const pos = new Float32Array(count * 3);
    const rand = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 120;
      pos[i * 3 + 1] = -1.5 - Math.random() * 3;
      pos[i * 3 + 2] = -20 - Math.random() * 120;
      rand[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));
    this.mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uReveal: { value: 0 },
        uSize: { value: 34.0 },
      },
      vertexShader: /* glsl */ `
        uniform float uTime; uniform float uSize; uniform float uReveal;
        attribute float aRand; varying float vA;
        void main(){
          vec3 p = position;
          p.y += sin(uTime * 0.5 + aRand * 6.28) * 0.8;
          p.x += sin(uTime * 0.2 + aRand * 3.0) * 2.0;
          vec4 mv = modelViewMatrix * vec4(p,1.0);
          float pulse = 0.55 + 0.45 * sin(uTime * (0.8 + aRand) + aRand * 10.0);
          vA = pulse * uReveal * 0.5;
          gl_PointSize = min(uSize * (0.5 + aRand) * pulse * (200.0 / -mv.z), 90.0);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        varying float vA;
        void main(){
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          float glow = smoothstep(0.5, 0.0, d);
          vec3 col = mix(vec3(0.4,0.7,1.0), vec3(0.6,1.0,0.9), 0.5);
          gl_FragColor = vec4(col, glow * glow * vA);
        }`,
    });
    this.points = new THREE.Points(geo, this.mat);
    this.points.frustumCulled = false;
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

/* --------------------------------- Leaps ---------------------------------- */
// Occasional glowing creature leaps in the distance (dolphins / fish),
// leaving a bioluminescent arc and a ripple on the water.

type Leap = {
  mesh: THREE.Mesh;
  origin: THREE.Vector3;
  vel: THREE.Vector3;
  t: number;
  dur: number;
  active: boolean;
  splashed: boolean;
};

export class Leaps {
  group: THREE.Group;
  private pool: Leap[] = [];
  private timer = 8;
  onSplash?: (x: number, z: number) => void;

  constructor(poolSize = 4) {
    this.group = new THREE.Group();
    const geo = new THREE.SphereGeometry(0.5, 10, 8);
    for (let i = 0; i < poolSize; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0x8ff0ff,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      mesh.scale.set(1.4, 1.0, 3.0);
      this.group.add(mesh);
      this.pool.push({
        mesh,
        origin: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        t: 0,
        dur: 1.5,
        active: false,
        splashed: false,
      });
    }
  }

  private launch() {
    const leap = this.pool.find((l) => !l.active);
    if (!leap) return;
    const x = (Math.random() - 0.5) * 120;
    const z = -30 - Math.random() * 90;
    leap.origin.set(x, 0, z);
    const up = 6 + Math.random() * 5;
    const fwd = (Math.random() - 0.5) * 6;
    leap.vel.set(fwd, up, (Math.random() - 0.5) * 4);
    leap.dur = 1.4 + Math.random() * 0.6;
    leap.t = 0;
    leap.active = true;
    leap.splashed = false;
    leap.mesh.visible = true;
    this.onSplash?.(x, z);
  }

  update(dt: number, reveal: number) {
    if (reveal < 0.4) return;
    this.timer -= dt;
    if (this.timer <= 0) {
      this.launch();
      this.timer = 9 + Math.random() * 14;
    }
    const g = -9.8 * 0.55;
    for (const l of this.pool) {
      if (!l.active) continue;
      l.t += dt;
      const p = l.t;
      const x = l.origin.x + l.vel.x * p;
      const y = l.origin.y + l.vel.y * p + 0.5 * g * p * p;
      const z = l.origin.z + l.vel.z * p;
      l.mesh.position.set(x, y, z);
      // orient along velocity (approx)
      const vy = l.vel.y + g * p;
      l.mesh.rotation.z = Math.atan2(vy, l.vel.x || 0.001) - Math.PI / 2;
      const mat = l.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.min(1, y > 0 ? 0.9 : 0) * reveal;
      if (y <= 0 && !l.splashed && l.t > 0.1) {
        l.splashed = true;
        this.onSplash?.(x, z);
      }
      if (y <= -0.5 || l.t > l.dur + 1) {
        l.active = false;
        l.mesh.visible = false;
      }
    }
  }

  dispose() {
    this.pool.forEach((l) => {
      l.mesh.geometry.dispose();
      (l.mesh.material as THREE.Material).dispose();
    });
  }
}
