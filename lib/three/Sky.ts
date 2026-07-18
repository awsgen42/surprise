import * as THREE from "three";
import { SIMPLEX } from "./glsl";

/* ---------------------------------- Stars --------------------------------- */

const starVert = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uReveal;
attribute float aScale;
attribute float aTwinkle;
attribute vec3 aColor;
varying vec3 vColor;
varying float vAlpha;
void main(){
  vColor = aColor;
  // slow, gentle drift so the sky is never truly static
  vec3 p = position;
  float sway = sin(uTime * 0.03 + aTwinkle * 6.28) * 0.6;
  p.x += sway;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float tw = 0.55 + 0.45 * sin(uTime * (0.6 + aTwinkle) + aTwinkle * 30.0);
  vAlpha = tw * uReveal;
  gl_PointSize = min(uSize * aScale * (300.0 / -mv.z) * (0.7 + 0.3 * tw), 6.0);
  gl_Position = projectionMatrix * mv;
}
`;

const starFrag = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main(){
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float core = smoothstep(0.5, 0.0, d);
  float glow = smoothstep(0.5, 0.15, d);
  float a = core * 0.9 + glow * 0.4;
  gl_FragColor = vec4(vColor, a * vAlpha);
}
`;

class Stars {
  points: THREE.Points;
  private mat: THREE.ShaderMaterial;

  constructor(count: number) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const scale = new Float32Array(count);
    const twinkle = new Float32Array(count);
    const color = new Float32Array(count * 3);
    const palette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0xbcd4ff),
      new THREE.Color(0xfff2d6),
      new THREE.Color(0x9fe8ff),
    ];
    for (let i = 0; i < count; i++) {
      // distribute on a large dome (upper hemisphere biased)
      const r = 380 + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.95 + 0.02); // keep above horizon
      const y = Math.abs(Math.cos(phi)) * r;
      pos[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      pos[i * 3 + 1] = y * 0.9 + 8;
      pos[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r;
      scale[i] = 0.4 + Math.random() * 1.8;
      twinkle[i] = Math.random();
      const c = palette[(Math.random() * palette.length) | 0];
      color[i * 3] = c.r;
      color[i * 3 + 1] = c.g;
      color[i * 3 + 2] = c.b;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aScale", new THREE.BufferAttribute(scale, 1));
    geo.setAttribute("aTwinkle", new THREE.BufferAttribute(twinkle, 1));
    geo.setAttribute("aColor", new THREE.BufferAttribute(color, 3));

    this.mat = new THREE.ShaderMaterial({
      vertexShader: starVert,
      fragmentShader: starFrag,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 2.6 },
        uReveal: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
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

/* ---------------------------------- Moon ---------------------------------- */

class Moon {
  group: THREE.Group;
  dir: THREE.Vector3;
  color: THREE.Color;
  private haloMat: THREE.ShaderMaterial;

  constructor() {
    this.group = new THREE.Group();
    this.color = new THREE.Color(0xeaf1ff);
    this.dir = new THREE.Vector3(0.25, 0.42, -1).normalize();

    const dist = 300;
    const pos = this.dir.clone().multiplyScalar(dist);

    // moon disc
    const moonGeo = new THREE.SphereGeometry(16, 48, 48);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xf4f7ff, fog: false });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.copy(pos);
    this.group.add(moon);

    // soft halo billboard
    this.haloMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: new THREE.Color(0xbcd8ff) } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
      `,
      fragmentShader: /* glsl */ `
        varying vec2 vUv; uniform vec3 uColor;
        void main(){
          float d = length(vUv - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          a = pow(a, 2.2);
          gl_FragColor = vec4(uColor, a * 0.9);
        }
      `,
    });
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), this.haloMat);
    halo.position.copy(pos);
    halo.lookAt(0, pos.y * 0.2, 0);
    this.group.add(halo);
    this.group.renderOrder = -1;
  }

  update(_t: number) {
    /* moon holds steady; halo already faces the shore */
  }

  dispose() {
    this.group.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      if (Array.isArray(m.material)) m.material.forEach((x) => x.dispose());
      else m.material?.dispose();
    });
  }
}

/* --------------------------------- Aurora --------------------------------- */

class Aurora {
  mesh: THREE.Mesh;
  private mat: THREE.ShaderMaterial;
  constructor() {
    const geo = new THREE.PlaneGeometry(360, 80, 64, 12);
    this.mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uReveal: { value: 0 },
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        varying vec2 vUv;
        ${SIMPLEX}
        void main(){
          vUv = uv;
          vec3 p = position;
          p.z += snoise(vec2(p.x * 0.008, uTime * 0.05)) * 12.0;
          p.y += snoise(vec2(p.x * 0.015 + 5.0, uTime * 0.04)) * 8.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform float uReveal;
        varying vec2 vUv;
        ${SIMPLEX}
        void main(){
          // soft, low-frequency curtains — no harsh stripes
          float c1 = snoise(vec2(vUv.x * 2.2, uTime * 0.12)) * 0.5 + 0.5;
          float c2 = snoise(vec2(vUv.x * 4.5 + 9.0, uTime * 0.08)) * 0.5 + 0.5;
          float curtain = mix(c1, c2, 0.4);
          float vertical = smoothstep(0.0, 0.45, vUv.y) * smoothstep(1.0, 0.5, vUv.y);
          float ray = smoothstep(0.35, 1.0, curtain);
          vec3 green = vec3(0.15, 0.7, 0.5);
          vec3 violet = vec3(0.35, 0.4, 0.85);
          vec3 col = mix(green, violet, vUv.y + 0.15 * sin(uTime * 0.25 + vUv.x * 6.0));
          float a = vertical * ray * 0.05 * uReveal;
          gl_FragColor = vec4(col, a);
        }
      `,
    });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.position.set(-20, 200, -480);
    this.mesh.rotation.x = 0.5;
    this.mesh.frustumCulled = false;
  }
  update(t: number, reveal: number) {
    this.mat.uniforms.uTime.value = t;
    this.mat.uniforms.uReveal.value = reveal;
  }
  dispose() {
    this.mesh.geometry.dispose();
    this.mat.dispose();
  }
}

/* ------------------------------ Shooting stars ---------------------------- */

type Shot = {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  active: boolean;
};

class ShootingStars {
  group: THREE.Group;
  private pool: Shot[] = [];
  private timer = 3;
  private mat: THREE.MeshBasicMaterial;

  constructor(poolSize = 6) {
    this.group = new THREE.Group();
    this.mat = new THREE.MeshBasicMaterial({
      color: 0xdfefff,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const geo = new THREE.PlaneGeometry(1, 0.12);
    // fade the trail along its length via vertex colors
    for (let i = 0; i < poolSize; i++) {
      const mesh = new THREE.Mesh(geo, this.mat.clone());
      mesh.visible = false;
      this.group.add(mesh);
      this.pool.push({
        mesh,
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
        active: false,
      });
    }
  }

  private launch(meteor = false) {
    const shot = this.pool.find((s) => !s.active);
    if (!shot) return;
    const startX = (Math.random() - 0.5) * 400;
    const startY = 160 + Math.random() * 120;
    const startZ = -200 - Math.random() * 100;
    shot.mesh.position.set(startX, startY, startZ);
    const speed = meteor ? 260 : 150 + Math.random() * 80;
    const dir = new THREE.Vector3(
      -0.6 - Math.random() * 0.5,
      -0.5 - Math.random() * 0.3,
      0.2 + Math.random() * 0.3
    ).normalize();
    shot.vel.copy(dir).multiplyScalar(speed);
    const len = meteor ? 26 : 14 + Math.random() * 10;
    shot.mesh.scale.set(len, 1 + Math.random() * 1.5, 1);
    // orient trail along velocity
    const angle = Math.atan2(dir.y, dir.x);
    shot.mesh.rotation.z = angle;
    shot.maxLife = meteor ? 1.6 : 1.1 + Math.random() * 0.6;
    shot.life = 0;
    shot.active = true;
    shot.mesh.visible = true;
    (shot.mesh.material as THREE.MeshBasicMaterial).opacity = 0;
  }

  private showerCountdown = 40 + Math.random() * 40;

  update(dt: number, reveal: number) {
    if (reveal < 0.2) return;
    this.timer -= dt;
    if (this.timer <= 0) {
      this.launch(false);
      this.timer = 2.5 + Math.random() * 6;
    }
    // rare meteor shower: a quick burst
    this.showerCountdown -= dt;
    if (this.showerCountdown <= 0) {
      for (let i = 0; i < 5; i++)
        setTimeout(() => this.launch(true), i * 180);
      this.showerCountdown = 70 + Math.random() * 60;
    }

    for (const s of this.pool) {
      if (!s.active) continue;
      s.life += dt;
      s.mesh.position.addScaledVector(s.vel, dt);
      const p = s.life / s.maxLife;
      const opacity = Math.sin(Math.min(p, 1) * Math.PI) * 0.9;
      (s.mesh.material as THREE.MeshBasicMaterial).opacity = opacity * reveal;
      if (s.life >= s.maxLife) {
        s.active = false;
        s.mesh.visible = false;
      }
    }
  }

  dispose() {
    this.pool.forEach((s) => {
      s.mesh.geometry.dispose();
      (s.mesh.material as THREE.Material).dispose();
    });
    this.mat.dispose();
  }
}

/* --------------------------------- Sky ------------------------------------ */

export class Sky {
  group: THREE.Group;
  moon: Moon;
  private stars: Stars;
  private aurora: Aurora;
  private shooting: ShootingStars;

  constructor(mobile: boolean) {
    this.group = new THREE.Group();
    this.stars = new Stars(mobile ? 9000 : 18000);
    this.moon = new Moon();
    this.aurora = new Aurora();
    this.shooting = new ShootingStars(mobile ? 4 : 6);
    this.group.add(
      this.stars.points,
      this.moon.group,
      this.aurora.mesh,
      this.shooting.group
    );
  }

  update(elapsed: number, dt: number, reveal: number) {
    this.stars.update(elapsed, reveal);
    this.moon.update(elapsed);
    this.aurora.update(elapsed, reveal);
    this.shooting.update(dt, reveal);
    // very slow sky rotation so constellations drift over the night
    this.stars.points.rotation.y = elapsed * 0.004;
  }

  dispose() {
    this.stars.dispose();
    this.moon.dispose();
    this.aurora.dispose();
    this.shooting.dispose();
  }
}
