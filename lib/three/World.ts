import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

import { Ocean } from "./Ocean";
import { Sky } from "./Sky";
import { IntroParticles, AirMotes, Fireflies } from "./Particles";
import { Lanterns, Jellyfish, Leaps } from "./Life";

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}
function smooth(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export type WorldOptions = {
  name: string;
  onTick?: (journeyTime: number) => void;
  onArrive?: () => void;
};

export class World {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private clock = new THREE.Clock();

  private ocean: Ocean;
  private sky: Sky;
  private intro: IntroParticles;
  private motes: AirMotes;
  private fireflies: Fireflies;
  private lanterns: Lanterns;
  private jellyfish: Jellyfish;
  private leaps: Leaps;

  private raf = 0;
  private running = false;
  private started = false;
  private journeyTime = 0;
  private journeyStart = 0; // performance.now() when the journey began
  private jumpTo = 0; // debug: start the journey at this time offset
  private mobile: boolean;

  // input
  private pointer = new THREE.Vector2(0, 0);
  private pointerTarget = new THREE.Vector2(0, 0);
  private tilt = new THREE.Vector2(0, 0);
  private raycaster = new THREE.Raycaster();

  private opts: WorldOptions;
  private arrived = false;
  private container: HTMLElement;

  constructor(container: HTMLElement, opts: WorldOptions) {
    this.container = container;
    this.opts = opts;
    this.mobile =
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
      window.innerWidth < 820;

    const w = container.clientWidth;
    const h = container.clientHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.mobile,
      powerPreference: "high-performance",
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.mobile ? 1.6 : 2));
    this.renderer.setSize(w, h);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.92;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x03040c);
    this.scene.fog = new THREE.FogExp2(0x04060f, 0.0038);

    this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1200);
    this.camera.position.set(0, 5, 46);
    this.camera.lookAt(0, 8, 20);

    // world systems
    this.ocean = new Ocean(this.mobile);
    this.sky = new Sky(this.mobile);
    this.intro = new IntroParticles(opts.name, this.mobile);
    this.motes = new AirMotes(this.mobile ? 180 : 320);
    this.fireflies = new Fireflies(this.mobile ? 40 : 70);
    this.lanterns = new Lanterns(this.mobile ? 6 : 10);
    this.jellyfish = new Jellyfish(this.mobile ? 18 : 32);
    this.leaps = new Leaps(this.mobile ? 3 : 4);
    this.leaps.onSplash = (x, z) => this.rippleAtWorld(x, z, 1.2);

    this.scene.add(
      this.ocean.mesh,
      this.sky.group,
      this.intro.points,
      this.motes.points,
      this.fireflies.points,
      this.lanterns.group,
      this.jellyfish.points,
      this.leaps.group
    );

    this.ocean.setMoon(this.sky.moon.dir, this.sky.moon.color);

    // debug hooks (only active via query params) for isolating layers
    const dbg = new URLSearchParams(window.location.search);
    if (dbg.has("noocean")) this.ocean.mesh.visible = false;
    if (dbg.has("nosky")) this.sky.group.visible = false;
    if (dbg.has("noparticles")) this.intro.points.visible = false;
    this.jumpTo = dbg.has("jump") ? parseFloat(dbg.get("jump")!) : 0;

    // postprocessing
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(w, h),
      this.mobile ? 0.45 : 0.55, // strength
      0.55, // radius
      0.65 // threshold — only genuine highlights (stars, glints) bloom
    );
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.bindEvents();
  }

  /* ------------------------------ input ---------------------------------- */

  private onPointerMove = (e: PointerEvent) => {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    this.pointerTarget.set(nx, ny);
  };

  private onPointerDown = (e: PointerEvent) => {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = -((e.clientY / window.innerHeight) * 2 - 1);
    this.raycaster.setFromCamera(new THREE.Vector2(nx, ny), this.camera);
    const hit = this.raycaster.intersectObject(this.ocean.mesh, false)[0];
    if (hit) {
      const local = this.ocean.mesh.worldToLocal(hit.point.clone());
      this.ocean.addRipple(local.x, local.y, 1.4);
    }
  };

  private onOrientation = (e: DeviceOrientationEvent) => {
    if (e.gamma == null || e.beta == null) return;
    // gentle parallax from phone tilt
    this.tilt.set(
      THREE.MathUtils.clamp(e.gamma / 45, -1, 1),
      THREE.MathUtils.clamp((e.beta - 45) / 45, -1, 1)
    );
  };

  private onResize = () => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
  };

  private onVisibility = () => {
    if (document.hidden) this.pause();
    else this.resume();
  };

  private bindEvents() {
    window.addEventListener("pointermove", this.onPointerMove, {
      passive: true,
    });
    window.addEventListener("pointerdown", this.onPointerDown, {
      passive: true,
    });
    window.addEventListener("deviceorientation", this.onOrientation);
    window.addEventListener("resize", this.onResize);
    document.addEventListener("visibilitychange", this.onVisibility);
  }

  private rippleAtWorld(x: number, z: number, strength: number) {
    this.ocean.mesh.updateMatrixWorld();
    const local = this.ocean.mesh.worldToLocal(new THREE.Vector3(x, 0, z));
    this.ocean.addRipple(local.x, local.y, strength);
  }

  /* --------------------------- choreography ------------------------------- */

  private updateCamera(t: number, dt: number) {
    // Keyframed cinematic path, all eased.
    // Phase 1 (0..24): hold near the forming word with a slow push-in.
    // Phase 2 (24..28): glide forward and down toward the shore.
    // Phase 3 (28+): settle at the shore, gently bobbing, free look.
    const push = smooth(2, 24, t); // 0..1 slow drift toward word
    const voyage = smooth(24, 28.5, t); // move to shore

    const startPos = new THREE.Vector3(0, 5, 46);
    const wordPos = new THREE.Vector3(0, 5.4, 40);
    const shorePos = new THREE.Vector3(0, 4.6, 30);

    const pos = new THREE.Vector3();
    pos.lerpVectors(startPos, wordPos, push);
    pos.lerpVectors(pos, shorePos, voyage);

    // gentle bob once at the sea
    const bob = Math.sin(t * 0.6) * 0.18 * voyage;
    pos.y += bob;

    this.camera.position.lerp(pos, 1 - Math.pow(0.001, dt));

    // look target: from the word toward the open sea/horizon
    const lookWord = new THREE.Vector3(0, 6, 20);
    const lookSea = new THREE.Vector3(0, 1.4, -90);
    const look = new THREE.Vector3().lerpVectors(lookWord, lookSea, voyage);

    // add gentle parallax from pointer + device tilt (only once at sea)
    const freedom = voyage;
    const lookOffX = (this.pointer.x * 6 + this.tilt.x * 8) * freedom;
    const lookOffY = (-this.pointer.y * 3 - this.tilt.y * 5) * freedom;
    look.x += lookOffX;
    look.y += lookOffY;

    this.camera.lookAt(look);
  }

  private updateStory(t: number) {
    // Particle name: forms early, holds, then dissolves into the sky.
    const form = smooth(3, 8, t);
    const disperse = smooth(12, 17.5, t);
    this.intro.form = form;
    this.intro.disperse = disperse;

    // Two reveals: the sky wakes first, the sea awakens during the voyage.
    const skyReveal = smooth(2, 9, t);
    const seaReveal = smooth(21, 30, t);

    this.sky.update(t, this.dt, skyReveal);
    this.motes.update(t, skyReveal);
    this.ocean.update(t, this.camera.position, seaReveal);
    this.fireflies.update(t, seaReveal);
    this.lanterns.update(t, seaReveal, this.camera);
    this.jellyfish.update(t, seaReveal);
    this.leaps.update(this.dt, seaReveal);

    // bloom eases up gently as the world brightens
    this.bloom.strength = lerp(
      0.3,
      this.mobile ? 0.45 : 0.55,
      Math.max(skyReveal * 0.6, seaReveal)
    );

    if (!this.arrived && t > 27.5) {
      this.arrived = true;
      this.opts.onArrive?.();
    }
  }

  private dt = 0;

  private loop = () => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.dt = dt;
    // The story follows wall-clock time so the narration keeps its intended
    // pace even on low-end phones that dip below 60 FPS (frame dt is capped
    // separately for stable physics/lerps).
    if (this.started)
      this.journeyTime =
        (performance.now() - this.journeyStart) / 1000 + this.jumpTo;
    const t = this.journeyTime;

    // smooth the pointer
    this.pointer.lerp(this.pointerTarget, 1 - Math.pow(0.01, dt));

    this.intro.update(t);
    this.updateStory(t);
    this.updateCamera(t, dt);

    this.opts.onTick?.(t);
    this.composer.render();
  };

  /* ------------------------------- API ----------------------------------- */

  /** Begin rendering (idle preview before the journey starts). */
  mount() {
    if (this.running) return;
    this.running = true;
    this.clock.start();
    this.loop();
  }

  /** Start the story clock (called on the visitor's first tap). */
  begin() {
    this.started = true;
    this.journeyStart = performance.now();
    this.journeyTime = 0;
  }

  /** Request device-orientation permission on iOS if needed. */
  async enableTilt() {
    const D = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    if (D && typeof D.requestPermission === "function") {
      try {
        await D.requestPermission();
      } catch {
        /* denied — parallax simply falls back to pointer */
      }
    }
  }

  pause() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  resume() {
    if (this.running) return;
    this.running = true;
    this.clock.start();
    this.loop();
  }

  dispose() {
    this.pause();
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("deviceorientation", this.onOrientation);
    window.removeEventListener("resize", this.onResize);
    document.removeEventListener("visibilitychange", this.onVisibility);

    this.ocean.dispose();
    this.sky.dispose();
    this.intro.dispose();
    this.motes.dispose();
    this.fireflies.dispose();
    this.lanterns.dispose();
    this.jellyfish.dispose();
    this.leaps.dispose();
    this.composer.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container)
      this.container.removeChild(this.renderer.domElement);
  }
}
