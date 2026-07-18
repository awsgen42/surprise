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
  /** Fired when the visitor touches the water (after the ripple is spawned). */
  onRipple?: (first: boolean) => void;
  /** Fired when a memory-carrying lantern is tapped. */
  onLanternTap?: (id: string) => void;
};

/**
 * The rendering context provided by React Three Fiber. The engine no longer
 * owns the renderer, canvas, camera, or the RAF loop — R3F owns those (M2).
 * The engine hosts the world systems, the post-processing composer, the story
 * choreography and input, and is driven once per frame from `useFrame`.
 */
export type WorldContext = {
  gl: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  width: number;
  height: number;
};

export class WorldEngine {
  private gl: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;

  private ocean: Ocean;
  private sky: Sky;
  private intro: IntroParticles;
  private motes: AirMotes;
  private fireflies: Fireflies;
  private lanterns: Lanterns;
  private jellyfish: Jellyfish;
  private leaps: Leaps;

  private started = false;
  private paused = false;
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
  private celebrating = false;
  private celebrateRippleT = 0;

  constructor(ctx: WorldContext, opts: WorldOptions) {
    this.opts = opts;
    this.mobile =
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
      window.innerWidth < 820;

    // R3F owns the renderer/canvas/camera; we adopt them and match Part 1's
    // colour/tone pipeline exactly so the post-processing output is identical.
    this.gl = ctx.gl;
    this.gl.toneMapping = THREE.ACESFilmicToneMapping;
    this.gl.toneMappingExposure = 0.92;
    this.gl.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = ctx.scene;
    this.scene.background = new THREE.Color(0x03040c);
    this.scene.fog = new THREE.FogExp2(0x04060f, 0.0038);

    this.camera = ctx.camera;
    this.camera.position.set(0, 5, 46);
    this.camera.lookAt(0, 8, 20);

    const w = ctx.width;
    const h = ctx.height;

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

    // postprocessing — the exact Part 1 pipeline (RenderPass → UnrealBloom →
    // OutputPass), preserved verbatim for identical visuals (ADR-0003).
    this.composer = new EffectComposer(this.gl);
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

  private firstRippleDone = false;

  private onPointerDown = (e: PointerEvent) => {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = -((e.clientY / window.innerHeight) * 2 - 1);
    this.raycaster.setFromCamera(new THREE.Vector2(nx, ny), this.camera);

    // memory lanterns take precedence over the water
    const lanternHits = this.raycaster.intersectObjects(
      this.lanterns.getTapTargets(),
      true
    );
    if (lanternHits.length) {
      const id = this.lanterns.resolveLanternId(lanternHits[0].object);
      if (id && this.lanterns.isCarrier(id) && !this.lanterns.isOpened(id)) {
        this.lanterns.markOpened(id);
        this.opts.onLanternTap?.(id);
        return;
      }
    }

    const hit = this.raycaster.intersectObject(this.ocean.mesh, false)[0];
    if (hit) {
      const local = this.ocean.mesh.worldToLocal(hit.point.clone());
      this.ocean.addRipple(local.x, local.y, 1.4);
      const first = !this.firstRippleDone;
      this.firstRippleDone = true;
      this.opts.onRipple?.(first);
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

  private onVisibility = () => {
    // pause the sim while hidden (parity with Part 1; saves battery on mobile)
    this.paused = document.hidden;
  };

  /** Called by the R3F host when the canvas size changes. */
  resize(w: number, h: number) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.composer.setSize(w, h);
  }

  private bindEvents() {
    window.addEventListener("pointermove", this.onPointerMove, {
      passive: true,
    });
    window.addEventListener("pointerdown", this.onPointerDown, {
      passive: true,
    });
    window.addEventListener("deviceorientation", this.onOrientation);
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

    // celebration: the sea sparkles with rising rings of light
    if (this.celebrating) {
      this.bloom.strength = this.mobile ? 0.62 : 0.78;
      this.celebrateRippleT -= this.dt;
      if (this.celebrateRippleT <= 0) {
        this.ocean.addRipple(
          (Math.random() - 0.5) * 120,
          (Math.random() - 0.5) * 120,
          1.6
        );
        this.celebrateRippleT = 0.25 + Math.random() * 0.3;
      }
    }

    if (!this.arrived && t > 27.5) {
      this.arrived = true;
      this.opts.onArrive?.();
    }
  }

  private dt = 0;

  /**
   * Advance and render one frame. Called by the R3F host from `useFrame` with a
   * render priority, so R3F yields rendering to our post-processing composer.
   * `delta` is R3F's frame delta (seconds); we cap it for stable physics/lerps
   * exactly as Part 1 did, while the story clock stays on wall-time.
   */
  update(delta: number) {
    if (this.paused) return;
    const dt = Math.min(delta, 0.05);
    this.dt = dt;
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
  }

  /* ------------------------------- API ----------------------------------- */

  /** Start the story clock (called on the visitor's first tap). */
  begin() {
    this.started = true;
    this.journeyStart = performance.now();
    this.journeyTime = 0;
  }

  /** Trigger the birthday celebration: rising lanterns + sparkling sea. */
  celebrate() {
    this.celebrating = true;
    this.lanterns.releaseAll();
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

  dispose() {
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("deviceorientation", this.onOrientation);
    document.removeEventListener("visibilitychange", this.onVisibility);

    // remove our systems from the (R3F-owned) scene, then dispose them
    this.scene.remove(
      this.ocean.mesh,
      this.sky.group,
      this.intro.points,
      this.motes.points,
      this.fireflies.points,
      this.lanterns.group,
      this.jellyfish.points,
      this.leaps.group
    );
    this.ocean.dispose();
    this.sky.dispose();
    this.intro.dispose();
    this.motes.dispose();
    this.fireflies.dispose();
    this.lanterns.dispose();
    this.jellyfish.dispose();
    this.leaps.dispose();
    this.composer.dispose();
    // NOTE: the renderer/canvas are owned by R3F and disposed by <Canvas>.
    this.scene.background = null;
    this.scene.fog = null;
  }
}
