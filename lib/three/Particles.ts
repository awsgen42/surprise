import * as THREE from "three";

/**
 * Sample target points from rendered text so the intro particles can gather
 * into a word. Returns points in a centered plane (units roughly -w/2..w/2).
 */
function sampleText(text: string, maxPoints: number): THREE.Vector3[] {
  const canvas = document.createElement("canvas");
  const W = 1024;
  const H = 256;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font =
    "600 150px 'Cormorant Garamond', Georgia, 'Times New Roman', serif";
  ctx.fillText(text, W / 2, H / 2 + 8);

  const img = ctx.getImageData(0, 0, W, H).data;
  const candidates: THREE.Vector3[] = [];
  const step = 3;
  const scale = 0.045; // world units per pixel
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      const a = img[(y * W + x) * 4]; // red channel
      if (a > 128) {
        candidates.push(
          new THREE.Vector3(
            (x - W / 2) * scale,
            -(y - H / 2) * scale,
            (Math.random() - 0.5) * 1.5
          )
        );
      }
    }
  }
  // shuffle + trim
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return candidates.slice(0, maxPoints);
}

const vert = /* glsl */ `
uniform float uForm;      // 0 scatter -> 1 formed word
uniform float uDisperse;  // 0 word -> 1 dispersed into air
uniform float uTime;
uniform float uSize;
attribute vec3 aScatter;
attribute vec3 aTarget;
attribute vec3 aDisperse;
attribute float aRand;
varying float vAlpha;
varying vec3 vColor;
void main(){
  vec3 formed = mix(aScatter, aTarget, smoothstep(0.0,1.0,uForm));
  vec3 pos = mix(formed, aDisperse, smoothstep(0.0,1.0,uDisperse));
  // gentle floating drift
  pos.x += sin(uTime * 0.5 + aRand * 6.28) * (0.15 + uDisperse * 0.8);
  pos.y += cos(uTime * 0.4 + aRand * 6.28) * (0.12 + uDisperse * 0.6);

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  float twinkle = 0.6 + 0.4 * sin(uTime * 2.0 + aRand * 20.0);
  // fade in during formation, stay soft after dispersal
  float formAlpha = smoothstep(0.0, 0.4, uForm);
  float disperseAlpha = mix(1.0, 0.5, uDisperse);
  vAlpha = twinkle * formAlpha * disperseAlpha;
  vColor = mix(vec3(0.35,0.85,1.0), vec3(0.5,1.0,0.9), aRand);
  gl_PointSize = min(uSize * (0.6 + 0.8 * twinkle) * (260.0 / -mv.z), 34.0);
  gl_Position = projectionMatrix * mv;
}
`;

const frag = /* glsl */ `
varying float vAlpha;
varying vec3 vColor;
void main(){
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float core = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vColor, core * vAlpha);
}
`;

export class IntroParticles {
  points: THREE.Points;
  private mat: THREE.ShaderMaterial;

  constructor(name: string, mobile: boolean) {
    const targets = sampleText(name, mobile ? 900 : 1600);
    const extra = mobile ? 250 : 500;
    const count = targets.length + extra;

    const scatter = new Float32Array(count * 3);
    const target = new Float32Array(count * 3);
    const disperse = new Float32Array(count * 3);
    const rand = new Float32Array(count);

    // place the word in front of the initial camera
    const wordZ = 20;
    const wordY = 6;

    for (let i = 0; i < count; i++) {
      // scatter: from a soft dark cloud around the word (kept well ahead of
      // the camera so gathering particles read as distant sparks, not blobs)
      const sr = 14 + Math.random() * 22;
      const sa = Math.random() * Math.PI * 2;
      scatter[i * 3] = Math.cos(sa) * sr;
      scatter[i * 3 + 1] = wordY + (Math.random() - 0.5) * 22;
      scatter[i * 3 + 2] = wordZ - 4 - Math.random() * 16;

      if (i < targets.length) {
        target[i * 3] = targets[i].x;
        target[i * 3 + 1] = targets[i].y + wordY;
        target[i * 3 + 2] = targets[i].z + wordZ;
      } else {
        // extra particles hover softly around the word
        const rr = 12 + Math.random() * 16;
        const ra = Math.random() * Math.PI * 2;
        target[i * 3] = Math.cos(ra) * rr;
        target[i * 3 + 1] = wordY + (Math.random() - 0.5) * 14;
        target[i * 3 + 2] = wordZ + (Math.random() - 0.5) * 10;
      }

      // disperse: rise and spread across the sky/air over the sea
      disperse[i * 3] = (Math.random() - 0.5) * 120;
      disperse[i * 3 + 1] = 4 + Math.random() * 60;
      disperse[i * 3 + 2] = -40 - Math.random() * 120;

      rand[i] = Math.random();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(scatter.slice(), 3)
    );
    geo.setAttribute("aScatter", new THREE.BufferAttribute(scatter, 3));
    geo.setAttribute("aTarget", new THREE.BufferAttribute(target, 3));
    geo.setAttribute("aDisperse", new THREE.BufferAttribute(disperse, 3));
    geo.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));

    this.mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        uForm: { value: 0 },
        uDisperse: { value: 0 },
        uTime: { value: 0 },
        uSize: { value: 2.8 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(geo, this.mat);
    this.points.frustumCulled = false;
  }

  set form(v: number) {
    this.mat.uniforms.uForm.value = v;
  }
  set disperse(v: number) {
    this.mat.uniforms.uDisperse.value = v;
  }
  update(t: number) {
    this.mat.uniforms.uTime.value = t;
  }
  dispose() {
    this.points.geometry.dispose();
    this.mat.dispose();
  }
}

/* ------------------------------- Air motes -------------------------------- */

export class AirMotes {
  points: THREE.Points;
  private mat: THREE.ShaderMaterial;
  constructor(count: number) {
    const pos = new Float32Array(count * 3);
    const rand = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 160;
      pos[i * 3 + 1] = 1 + Math.random() * 40;
      pos[i * 3 + 2] = 30 - Math.random() * 200;
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
        uSize: { value: 3.2 },
      },
      vertexShader: /* glsl */ `
        uniform float uTime; uniform float uSize; uniform float uReveal;
        attribute float aRand; varying float vA;
        void main(){
          vec3 p = position;
          p.x += sin(uTime * 0.2 + aRand * 6.28) * 4.0;
          p.y += sin(uTime * 0.15 + aRand * 10.0) * 2.0 + sin(uTime*0.5+aRand)*0.4;
          p.z += cos(uTime * 0.12 + aRand * 6.28) * 4.0;
          vec4 mv = modelViewMatrix * vec4(p,1.0);
          float tw = 0.5 + 0.5 * sin(uTime * 1.5 + aRand * 30.0);
          vA = tw * uReveal;
          gl_PointSize = min(uSize * (0.4 + aRand) * (200.0 / -mv.z), 22.0);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vA;
        void main(){
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          float c = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(0.6, 0.95, 1.0, c * vA * 0.7);
        }
      `,
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

/* ------------------------------- Fireflies -------------------------------- */

export class Fireflies {
  points: THREE.Points;
  private mat: THREE.ShaderMaterial;
  constructor(count: number) {
    const pos = new Float32Array(count * 3);
    const rand = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // cluster near the shore (positive z, low)
      pos[i * 3] = (Math.random() - 0.5) * 70;
      pos[i * 3 + 1] = 0.5 + Math.random() * 8;
      pos[i * 3 + 2] = 15 + Math.random() * 25;
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
        uSize: { value: 6.0 },
      },
      vertexShader: /* glsl */ `
        uniform float uTime; uniform float uSize; uniform float uReveal;
        attribute float aRand; varying float vA;
        void main(){
          vec3 p = position;
          float s = aRand * 6.28;
          p.x += sin(uTime * (0.5 + aRand) + s) * 3.0;
          p.y += sin(uTime * (0.8 + aRand) + s * 2.0) * 1.6 + 1.0;
          p.z += cos(uTime * (0.4 + aRand) + s) * 3.0;
          vec4 mv = modelViewMatrix * vec4(p,1.0);
          // slow on/off blink
          float blink = smoothstep(0.3, 1.0, sin(uTime * (1.2 + aRand*1.5) + s*3.0)*0.5+0.5);
          vA = blink * uReveal;
          gl_PointSize = min(uSize * (0.5 + aRand) * (150.0 / -mv.z), 26.0);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vA;
        void main(){
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          float core = smoothstep(0.5, 0.0, d);
          float glow = smoothstep(0.5, 0.1, d);
          vec3 col = vec3(1.0, 0.85, 0.45);
          gl_FragColor = vec4(col, (core + glow*0.4) * vA);
        }
      `,
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
