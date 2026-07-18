# 🌊 Sea of Stars — Engineering Blueprint

> **Status:** Canonical architecture (Part 2). This document is the single
> source of truth for how the project is built. All future implementation
> must remain consistent with it. When a decision here needs to change,
> change it here first (and record it in `docs/adr/`), then in code.
>
> **Scope:** Architecture only. No feature implementation is authorized by
> this document — implementation begins when the next specification part
> arrives, and proceeds milestone by milestone (§19).

---

## Table of contents

1. [Guiding principles & vision integration](#1-guiding-principles--vision-integration)
2. [Current state (Part 1) & migration strategy](#2-current-state-part-1--migration-strategy)
3. [Rendering architecture](#3-rendering-architecture)
4. [Scene system](#4-scene-system)
5. [Folder structure](#5-folder-structure)
6. [State management](#6-state-management)
7. [Asset loading & pipeline](#7-asset-loading--pipeline)
8. [Rendering performance strategy](#8-rendering-performance-strategy)
9. [Animation system](#9-animation-system)
10. [Audio system](#10-audio-system)
11. [Mubi — AI system (preparation)](#11-mubi--ai-system-preparation)
12. [Memory & save system](#12-memory--save-system)
13. [Performance budget](#13-performance-budget)
14. [Accessibility](#14-accessibility)
15. [Error handling & graceful degradation](#15-error-handling--graceful-degradation)
16. [PWA & offline](#16-pwa--offline)
17. [Device capability tiers](#17-device-capability-tiers)
18. [Testing strategy](#18-testing-strategy)
19. [Development milestones](#19-development-milestones)
20. [Module boundaries & conventions](#20-module-boundaries--conventions)
21. [Deferred decisions / open questions](#21-deferred-decisions--open-questions)

> Code snippets below are **design contracts** (interfaces, types, store
> shapes, folder trees) that define boundaries. They are not implementation
> and must not be treated as finished code.

---

## 1. Guiding principles & vision integration

The product is a **living, magical world**, not a website. Every engineering
decision is subordinate to one emotional through-line from Part 1:

> **"You are deeply loved."**

Architecture principles, in priority order:

1. **Emotion first, performance always.** A dropped frame breaks the spell as
   badly as a wrong color. We hold **60 FPS on modern Android** as a hard
   budget (§13) and treat it as a feature, not an optimization afterthought.
2. **Feature-first & modular.** Each feature (scene, interactive object, Mubi,
   memory, celebration) is an isolated module with a clean public interface.
   Adding a scene must not require editing another scene.
3. **Separation of concerns — the three layers.** Every feature is split into:
   - **UI layer** (DOM/React/Tailwind/Framer Motion) — accessible, testable.
   - **Logic layer** (stores, services, hooks, AI, save) — framework-light,
     unit-testable, runnable outside React.
   - **Render layer** (R3F components + GLSL) — the WebGL world.
   These layers communicate only through **stores and typed events**, never by
   reaching into each other's internals.
4. **The world persists; scenes come and go.** One WebGL context lives for the
   whole session. Scenes mount and unmount inside it (§4).
5. **Strong typing & clean interfaces.** No `any` in committed code. Public
   module surfaces are `interface`/`type` contracts.
6. **Mobile-first.** Design for the phone; scale *up* to desktop. Never the
   reverse.
7. **Graceful degradation.** WebGL missing, audio blocked, slow GPU, offline —
   each has a defined fallback (§15). The experience bends; it never breaks.
8. **Replaceable subsystems.** Mubi's brain, the audio backend, and the asset
   source can each be swapped without touching callers.

---

## 2. Current state (Part 1) & migration strategy

**Part 1 (shipped)** is an imperative, vanilla-Three.js experience:

```
app/            layout.tsx, page.tsx (dynamic import, ssr:false), globals.css
components/      Experience.tsx, StartGate.tsx, StoryOverlay.tsx  (inline styles)
lib/three/       World.ts (orchestrator), Ocean.ts, Sky.ts, Particles.ts,
                 Life.ts, glsl.ts
lib/             audio.ts (procedural Web Audio), story.ts
```

It delivers: the bioluminescent ocean shader, starfield, moon + reflection,
aurora, shooting stars, particle name-formation, fireflies, lanterns,
jellyfish, creature leaps, cinematic camera, procedural score, and a
glassmorphism gate. **This is the asset we migrate, not discard.**

### The migration decision (ADR-0001)

Part 2 mandates **React Three Fiber**. We adopt it. Rationale:

- Declarative scene graph makes **per-scene mount/unmount** and **Suspense
  asset loading** natural — the backbone of §4 and §7.
- `drei` removes boilerplate (loaders, controls, instancing, `Detailed`/LOD,
  `AdaptiveDpr`, `PerformanceMonitor`).
- `@react-three/postprocessing` gives us **selective bloom** (Part 1 currently
  blooms the whole frame, which caused the white-out we hand-tuned around).

**Cost:** Part 1's `World.ts` render loop and system classes are re-expressed
as R3F components. **We preserve every GLSL string verbatim** — the shaders in
`Ocean.ts`, `Sky.ts`, `Particles.ts` move into `shaderMaterial` definitions and
`glsl.ts` is reused untouched. Performance-critical systems keep an imperative
core inside `useFrame` (R3F fully supports this), so we get declarative
structure *and* hand-tuned frame loops.

**Migration is Milestone 1.** It is mechanical and behavior-preserving; the
Playwright screenshot harness (already in use) is the regression gate — the
migrated Shore scene must match Part 1 frame-for-frame before we build on it.

Escape hatch: any system that is genuinely better imperative (e.g. a GPU
particle FBO simulation) stays imperative behind a thin R3F wrapper
component. R3F does not forbid imperative Three; it hosts it.

---

## 3. Rendering architecture

### One canvas, persistent context

A single `<Canvas>` mounts once at the root and never unmounts for the session.
Losing/recreating the WebGL context between scenes would stutter and risk
context-loss on mobile. Structure:

```
<RootLayout>
  <WebGLErrorBoundary>            // §15 — falls back to poster experience
    <Canvas frameloop="always">   // living world never idles
      <AdaptiveDpr />             // §8 dynamic resolution
      <PerformanceMonitor>       // §17 tier escalation/regression
        <WorldLayer />           // persistent: ocean, sky, weather, audio-reactive
        <SceneManager />         // mounts exactly one active scene subtree
        <CameraRig />            // camera director target
        <PostFX />               // selective bloom, vignette, tone mapping
      </PerformanceMonitor>
    </Canvas>
  </WebGLErrorBoundary>
  <UILayer />                     // DOM overlay: HUD, dialogue, menus (Tailwind)
</RootLayout>
```

- **`WorldLayer`** holds systems shared by most scenes (ocean, sky, ambient
  particles). Scenes *toggle and parametrize* these rather than re-creating
  them — the ocean is the same ocean everywhere; a scene changes its mood.
- **`SceneManager`** renders the one active scene from the registry (§4),
  wrapped in `<Suspense>` and a per-scene error boundary.
- **`UILayer`** is DOM, not WebGL. It is where accessibility lives (§14).

### Frameloop policy

`frameloop="always"` — the world breathes constantly (waves, stars, particles).
We do **not** use `"demand"`. We *do* throttle when the tab is hidden (Part 1
already pauses on `visibilitychange`) and cap `dt` for physics while driving
narrative timing off a wall-clock (Part 1 pattern — keep it).

### Rendering paradigm rules

- React drives **structure** (what exists). `useFrame` drives **motion**
  (uniforms, positions). **Never `setState` per frame** — mutate refs/uniforms
  and, if the DOM must reflect a value, use a transient Zustand subscription
  (§6) or write to a ref-backed DOM node (Part 1's `StoryOverlay` already does
  this).
- Materials and geometries are created once and reused; disposal is owned by
  the component that created them (`useEffect` cleanup) — enforced by §13 rules.

---

## 4. Scene system

The world is a set of **independent, self-loading scenes**:

`Intro → Shore → Open Ocean → Lantern Sea → Memory Islands → Moon Garden →
Secret Cave → Birthday Celebration → Ending`

### Scene contract

```ts
// design contract — not implementation
export type SceneId =
  | 'intro' | 'shore' | 'open-ocean' | 'lantern-sea' | 'memory-islands'
  | 'moon-garden' | 'secret-cave' | 'birthday' | 'ending';

export interface SceneDefinition {
  id: SceneId;
  /** Lazily-loaded R3F subtree for the scene's unique content. */
  Component: React.LazyExoticComponent<React.ComponentType>;
  /** Assets to fetch before the scene is considered ready (blocks entry). */
  criticalAssets: AssetRef[];
  /** Assets to warm in the background once entered. */
  deferredAssets: AssetRef[];
  /** Neighbours to preload while this scene is active. */
  adjacent: SceneId[];
  /** How the shared WorldLayer should be tuned for this scene. */
  worldProfile: WorldProfile;   // ocean mood, sky, fog, palette, weather
  /** Audio profile (layer targets, music cue) — see §10. */
  audioProfile: AudioProfileId;
  /** Camera intro/outro timelines — see §9. */
  transitions: { enter: TimelineId; exit: TimelineId };
  /** Gate: is the player allowed here yet? (progression, §11/§12) */
  requires?: (progress: ProgressState) => boolean;
}
```

### Registry, transitions, lifecycle

- **`SceneRegistry`** maps `SceneId → SceneDefinition`. Adding a scene = adding
  one registry entry + one lazy module. Nothing else changes. This satisfies
  "every feature isolated."
- **`SceneManager`** owns the state machine: `idle → preloading → entering →
  active → exiting`. Only the **active** scene's `Component` is mounted;
  **adjacent** scenes are *preloaded* (assets warmed) but not mounted.
- **Transitions** are handled by the animation director (§9): exit timeline of
  the old scene overlaps the enter timeline of the new one (camera + fog +
  audio crossfade), never a hard cut.
- **Memory discipline:** on exit, the scene component unmounts and disposes its
  own GPU resources; the `AssetManager` releases assets not referenced by the
  new active scene or its adjacents (§7).

### Scene ↔ vision mapping

| Scene | Emotional beat (Part 1 lineage) |
| --- | --- |
| Intro | Darkness → the single light → the name → poetry |
| Shore | Part 1's arrival: gentle waves, moon, fireflies |
| Open Ocean | Vastness; the sea "recognizes" her (ripples, bio) |
| Lantern Sea | Floating lanterns carrying messages |
| Memory Islands | Photo/message memories unlocked as collectibles |
| Moon Garden | Calm interlude; glowing flora, butterflies |
| Secret Cave | Hidden surprise; concentrated bioluminescence |
| Birthday | The one loud, joyful moment; celebration FX |
| Ending | "You are deeply loved." Resolution & credits |

---

## 5. Folder structure

Feature-first, with clear layer separation. Aliased `@/*`.

```
sea-of-stars/
├─ app/                          # Next 16 App Router — thin route shells only
│  ├─ layout.tsx
│  ├─ page.tsx                   # mounts <Experience/> (ssr:false)
│  ├─ manifest.ts                # PWA manifest (§16)
│  └─ globals.css                # Tailwind entry + tokens
│
├─ src/
│  ├─ app-shell/                 # top-level composition (Canvas, layers, boundaries)
│  │  ├─ Experience.tsx
│  │  ├─ WorldCanvas.tsx
│  │  ├─ UILayer.tsx
│  │  └─ boundaries/             # WebGLErrorBoundary, SceneErrorBoundary
│  │
│  ├─ scenes/                    # ONE folder per scene — fully isolated feature
│  │  ├─ registry.ts
│  │  ├─ SceneManager.tsx
│  │  ├─ intro/                  # scene.ts (SceneDefinition) + components + local shaders
│  │  ├─ shore/
│  │  ├─ open-ocean/
│  │  ├─ lantern-sea/
│  │  ├─ memory-islands/
│  │  ├─ moon-garden/
│  │  ├─ secret-cave/
│  │  ├─ birthday/
│  │  └─ ending/
│  │
│  ├─ world/                     # persistent shared render systems
│  │  ├─ ocean/                  # Ocean.tsx + ocean.glsl.ts (ported Part 1)
│  │  ├─ sky/                    # stars, moon, aurora, shooting stars
│  │  ├─ particles/              # GPU particle systems, motes, fireflies
│  │  ├─ life/                   # lanterns, jellyfish, leaps, birds
│  │  ├─ weather/                # wind, fog, meteor showers
│  │  ├─ camera/                 # CameraRig + CameraDirector
│  │  └─ postfx/                 # selective bloom, vignette, tone map
│  │
│  ├─ shaders/                   # shared GLSL only (feature-local shaders live in-feature)
│  │  ├─ lib/                    # simplex, fbm, easing, sdf  (Part 1 glsl.ts)
│  │  └─ chunks/                 # reusable fragments (fresnel, foam, dither)
│  │
│  ├─ ui/                        # reusable, presentational DOM components (Tailwind)
│  │  ├─ primitives/             # Button, GlassPanel, Icon, Text
│  │  ├─ hud/                    # progress, collectibles, audio toggle
│  │  ├─ dialogue/               # Mubi dialogue box, choices
│  │  └─ overlays/               # StartGate, StoryOverlay, menus, loaders
│  │
│  ├─ features/                  # cross-cutting interactive features
│  │  ├─ interactions/           # tap-to-ripple, pickups, look controls
│  │  ├─ collectibles/           # hearts, lanterns opened
│  │  ├─ memories/               # memory unlock feature (UI + logic)
│  │  └─ celebration/            # birthday sequence orchestration
│  │
│  ├─ ai/                        # Mubi — replaceable brain (§11)
│  │  ├─ mubi/                   # MubiProvider, controller
│  │  ├─ dialogue/               # engine, selectors, content packs
│  │  ├─ story/                  # story graph, progression
│  │  ├─ context/               # context aggregation
│  │  └─ hints/                  # hint system
│  │
│  ├─ audio/                     # AudioEngine, buses, profiles (§10)
│  ├─ memory/                    # save system, schema, migrations (§12)
│  │
│  ├─ stores/                    # Zustand slices — one per domain (§6)
│  ├─ services/                  # AssetManager, StorageService, Analytics, Capability
│  ├─ hooks/                     # reusable React hooks (useReducedMotion, useTier…)
│  ├─ animation/                 # GSAP timelines, Framer variants, easing, director
│  ├─ lib/                       # framework-agnostic utils (math, rng, color, dispose)
│  ├─ constants/                 # tunables, budgets, palettes, timings
│  └─ types/                     # shared TypeScript types & contracts
│
├─ public/
│  ├─ models/                    # .glb (Draco/meshopt) — lazy
│  ├─ textures/                  # .ktx2 (compressed) — lazy
│  ├─ audio/                     # ambient/music/sfx stems — lazy
│  ├─ images/                    # memory photos — lazy, per scene
│  └─ icons/                     # PWA icons
│
├─ tests/                        # unit, component, e2e/visual (§18)
├─ docs/                         # this blueprint + ADRs
└─ tooling/                      # asset compression scripts, screenshot harness
```

Rule: **feature-local code stays in the feature.** A shader used only by
`secret-cave` lives in `scenes/secret-cave/`, not in `shaders/`. Only genuinely
shared code is promoted to `world/`, `shaders/`, `ui/primitives`, or `lib/`.

---

## 6. State management

**Zustand**, split into **domain slices**, never one monolith. Justification
over alternatives:

- Runs **outside React** — essential because `useFrame`, the AudioEngine, and
  the AI controller must read/write state without hooks.
- **Transient subscriptions** (`store.subscribe`) update the DOM/imperative
  code without triggering React re-renders — critical for 60 FPS.
- Minimal bundle; `persist` + `subscribeWithSelector` middleware cover save
  (§12) and selective reactivity. No provider tree, no boilerplate.

React Query is **not** adopted yet — there is no server state. It is
introduced only if/when networked features appear (§21).

### Store domains

Each is an independent store (or a slice composed via the slices pattern),
selected narrowly to avoid over-rendering:

```ts
// design contract — shapes, not implementation
useWorldStore      // time-of-day, weather, palette, ocean mood, global reveal
useSceneStore      // activeScene, phase (idle|preloading|entering|active|exiting), transition progress
useProgressStore   // visited scenes, story flags, act/beat (persisted)
useAchievementsStore // unlocked achievements (persisted)
useCollectiblesStore // hearts, lanterns opened, memories found (persisted)
useMubiStore       // mood, presence, current dialogue node, cooldowns
useAudioStore      // master/bus volumes, muted, current music cue (persisted: prefs)
useCountdownStore  // birthday countdown target + derived remaining
useSettingsStore   // reducedMotion, quality tier override, captions, contrast (persisted)
useLoadStore       // asset progress per tier, ready flags (transient, not persisted)
```

Boundaries:

- **High-frequency values** (camera, ripple positions, per-frame reveal) do
  **not** live in stores — they live in refs and uniforms. Stores hold
  *discrete, meaningful* state (which scene, which flags, which volumes).
- Persistence is opt-in per store via `persist` and routes through the
  versioned `StorageService` (§12), never `localStorage` directly.

---

## 7. Asset loading & pipeline

### Priority tiers (load order)

1. **Critical UI** — shell, gate, fonts subset, first paint. Ships in the
   initial bundle.
2. **Ocean** — the world's protagonist; blocks "world ready."
3. **Sky** — stars/moon; blocks "world ready."
4. **Mubi** — presence assets (light, later model/voice).
5. **Active scene assets** — `criticalAssets` block scene entry.
6. **Decorative / deferred** — `deferredAssets`, warmed after entry.

"World ready" (tiers 1–3) gates the Intro → Shore reveal. Everything else
streams in without blocking.

### Mechanisms

- **`AssetManager` service** wraps a Three `LoadingManager` + drei `useGLTF` /
  `useTexture` / `useKTX2`, exposing typed `AssetRef`s with ref-counting.
  Ref-count drops to zero on scene exit → GPU dispose.
- **Suspense** boundaries per scene surface load progress to `useLoadStore`
  which drives the loader UI (§9 UI animation).
- **Lazy loading** (`React.lazy` + dynamic import) for: heavy models, audio
  stems, particle systems, **photo galleries** (memory images), and all
  **celebration** assets (only the Birthday scene pays their cost).
- **Preloading** of adjacent scenes happens at low priority (idle callback)
  once the current scene is active.

### Asset formats (build-time tooling in `tooling/`)

- Models: **glTF `.glb`** with **Draco** or **meshopt** compression + LOD
  variants where meaningful.
- Textures: **KTX2 (Basis)** GPU-compressed; power-of-two; mipmapped. No raw
  PNG/JPEG in the render path except memory photos (which are UI-layer,
  progressively loaded and `sizes`-optimized).
- Audio: streamed stems; short SFX preloaded per scene profile (§10).

---

## 8. Rendering performance strategy

Target: **60 FPS on modern Android** (§13). Techniques, each with an owner:

- **Dynamic resolution** — drei `AdaptiveDpr` + `PerformanceMonitor`: DPR
  scales down under load, back up when headroom returns. Bounded per tier
  (§17).
- **Instancing** — `InstancedMesh` for repeated geometry (lanterns, rocks,
  flora, birds). No per-object draw calls for crowds.
- **GPU particles** — large particle systems (stars, motes, bio plankton,
  celebration) run as **shader-driven `Points`** or **FBO/ping-pong
  simulations**; positions animate on the GPU, never per-frame JS loops. Point
  sizes are **clamped** (Part 1 lesson) to avoid fill-rate blowups.
- **Frustum culling** — on by default; large custom systems set correct bounds
  (Part 1 disables culling on sky/ocean deliberately — documented exceptions).
- **LOD** — drei `<Detailed>` for models; particle counts and shader octaves
  scale by tier and distance.
- **Compressed textures** — KTX2 everywhere (§7).
- **Efficient shaders** — shared GLSL chunks; avoid dynamic loops; precompute
  in vertex where possible; keep fragment cost bounded on mobile.
- **Reduced draw calls** — merge static geometry; instancing; a single ocean;
  atlas small textures.
- **Selective bloom** — `@react-three/postprocessing` bloom driven by an
  emissive/luminance threshold and a bloom layer, so only true highlights
  (stars, moon, glints, bio crests) bloom — fixes Part 1's global-bloom
  white-out at its root.

Discipline: **profile before optimizing**, but never ship a system without a
mobile frame-time measurement.

---

## 9. Animation system

A **layered** architecture, each layer with one owner tool. Mixing tools within
a layer is prohibited.

| Layer | Tool | Notes |
| --- | --- | --- |
| UI micro-interactions & transitions | **Framer Motion** | buttons, panels, dialogue, HUD; respects reduced-motion |
| Page/section smooth scroll (where scenes use scroll) | **Lenis** | synced to `useFrame` clock; disabled under reduced-motion |
| Camera & scripted timelines (scene enter/exit, celebration) | **GSAP** | `CameraDirector` owns a single timeline authority |
| World/shader/ambient motion | **`useFrame` + uniforms** | waves, stars, particles, fog — never GSAP per-frame |
| Ocean reactions (ripples, recognition) | **event → uniform** | interactions push ripple data into ocean uniforms (Part 1 pattern) |
| Character (Mubi) motion | **useFrame + light state machine** | mood-driven; later skeletal |

Principles:

- **One director for the camera.** All camera motion flows through
  `CameraDirector`, which exposes named timelines (`TimelineId`) referenced by
  `SceneDefinition.transitions`. No scene manipulates the camera directly.
- **Reusable utilities** in `animation/`: easing curves, spring presets,
  shared Framer `variants`, timeline factories. Scenes compose these; they do
  not hand-roll easing.
- **Reduced motion** (§14) is a first-class branch: timelines have a
  `reduced` variant (cross-fade instead of fly-through); Framer reads
  `useReducedMotion`; Lenis is bypassed.
- GSAP is used **only where a scripted, multi-property, seekable timeline is
  needed** (per the spec's "only where necessary"). Ambient loops never use it.

---

## 10. Audio system

Built on the **Web Audio API** as a **layered bus graph**, extending Part 1's
procedural engine (which stays as the fallback/ambient generator when no stems
are loaded).

```
                      ┌─ ambience (ocean)
                      ├─ wind
   master ── ducking ─┼─ wildlife
     │                ├─ music
     │                ├─ sfx (interactions)
     │                ├─ celebration
     └─ (compressor)  └─ voice (Mubi, future)
```

- **`AudioEngine`** owns the `AudioContext` and one `GainNode` **bus** per
  layer, each with independent volume, mute, and crossfade. It is a plain
  service, driven by `useAudioStore` and by scene/AI events — usable outside
  React.
- **Audio profiles** (`AudioProfileId`) per scene declare target bus levels and
  a music cue; scene transitions **crossfade** buses (smooth fades are a hard
  requirement).
- **Ducking:** when Mubi speaks or a key SFX plays, music/ambience duck via the
  ducking node, then restore.
- **Unlock on gesture:** the Start Gate tap resumes the context (Part 1
  pattern). Before that, the world runs silent with a visible affordance.
- **Interaction sounds** are short, preloaded per scene profile; **music** and
  **celebration** stems are lazy-loaded (§7).
- **Voice (future):** a `voice` bus is reserved now so Mubi audio drops in
  without re-architecting.

All audio obeys `useSettingsStore` (master volume, mute, per-bus controls in
the settings UI — §14).

---

## 11. Mubi — AI system (preparation)

Mubi is the emotional core of the next parts. We build the **module boundary
now** so the brain is **replaceable** (local rule-engine today → richer or
LLM-backed later) without touching callers.

### Responsibilities & interfaces

```ts
// design contract — not implementation
export interface MubiBrain {                 // the replaceable unit
  respond(input: MubiInput, ctx: MubiContext): Promise<MubiResponse>;
  greet(ctx: MubiContext): MubiResponse;
  hint(ctx: MubiContext): MubiResponse | null;
}

export interface MubiContext {               // aggregated, read-only
  scene: SceneId;
  progress: ProgressSnapshot;
  collectibles: CollectiblesSnapshot;
  memories: MemorySnapshot;
  timeOfSession: number;
  countdown: CountdownSnapshot;
  recentEvents: WorldEvent[];                // last N events for reactivity
  history: DialogueTurn[];                   // conversation memory
}

export interface MubiResponse {
  lines: DialogueLine[];                     // text (+ optional voice cue, emotion)
  mood: MubiMood;
  actions?: MubiAction[];                    // e.g. reveal hint marker, unlock
  persist?: Partial<MubiMemory>;             // what to remember
}
```

### Sub-systems (in `src/ai/`)

- **DialogueEngine** — selects lines from **content packs** (data, not code) by
  scene/mood/context; supports **weighted randomization** with **no-repeat**
  windows so Mubi never feels canned.
- **Story / ProgressionManager** — a **story graph**: nodes (beats) with
  guards and effects; advances progress flags consumed by scene `requires`
  gates and by dialogue selection.
- **MemoryTracker** — what Mubi knows/remembers about the session; persisted
  via the save system (§12) under its own versioned slice.
- **ContextProvider** — assembles `MubiContext` from the stores each turn.
- **HintSystem** — surfaces gentle, escalating hints when the player is stuck
  (idle timers + progression state), always in-character.
- **EventReactor** — subscribes to `WorldEvent`s (ripple, pickup, scene enter)
  and lets Mubi react opportunistically.

### Design rules

- The brain is behind `MubiBrain`. Swapping local→LLM is one implementation
  change; `MubiProvider` and UI are untouched.
- **All dialogue content is data** (typed content packs), authored separately
  from logic — writers can edit story without touching TypeScript.
- Mubi logic runs outside the render loop; only its *presence* (a light,
  particles, later a model) lives in `world/` and reads `useMubiStore`.
- **Local persistence** of conversation/memory is mandatory and versioned.

---

## 12. Memory & save system

A single **versioned, migratable** local save, owned by `StorageService`.

```ts
// design contract — not implementation
export interface SaveStateV1 {
  version: 1;
  visitedScenes: SceneId[];
  hearts: string[];             // collectible ids
  lanternsOpened: string[];
  messagesRead: string[];
  memoriesUnlocked: string[];
  achievements: string[];
  progress: ProgressState;      // story flags, act/beat
  mubi: MubiMemory;             // conversation memory
  settings: PersistedSettings;  // volume, reduced-motion override, captions, contrast
  updatedAt: number;
}
export type SaveState = SaveStateV1; // union grows: SaveStateV1 | SaveStateV2 …
```

- **Backend:** `localStorage` (IndexedDB only if size demands it later — the
  service abstracts this so callers don't care).
- **Versioning & migrations:** every write stamps `version`; on load, a
  migration chain (`v1→v2→…`) upgrades old saves. Unknown/newer versions fail
  **safe** (start fresh, never crash, never corrupt).
- **Access path:** Zustand `persist` middleware for the persisted stores routes
  through `StorageService`, giving one serialization point, one schema, one
  migration path. No component calls `localStorage` directly.
- **Autosave** on meaningful state change (debounced); **export/import** JSON
  for backup/transfer (nice for a gift you might move between devices).
- **Reset** available in settings (with confirmation).

---

## 13. Performance budget

Hard rules (violations block merge in QA milestones):

**Frame budget**
- 60 FPS (16.6 ms) on a modern Android (target: recent mid-to-high Snapdragon).
- ≤ ~10 ms GPU on that class of device to leave headroom; degrade via tiers
  (§17) rather than dropping frames.

**Load budget**
- Initial JS (shell + critical UI) target **≤ 200 KB gzip**; the world engine
  and scenes are code-split and streamed.
- Time-to-interactive gate ("tap to begin") before heavy assets load.

**Scene GPU budget (per active scene, mid-tier)**
- Draw calls: keep low via instancing/merging (target low hundreds, not
  thousands).
- Particles: tier-scaled; **point sizes clamped**; celebration bursts pooled.
- Textures: KTX2; total resident texture memory bounded per tier.

**Engineering rules (always)**
1. Lazy-load everything non-critical.
2. Keep the initial bundle minimal; code-split per scene.
3. Never block the main thread (no heavy sync work in the loop; use workers for
   generation where needed).
4. **Dispose** unused Three resources (geometry/material/texture/RT) on
   unmount — ownership = creator.
5. **Reuse** materials/geometries; share via `world/` and `shaders/chunks`.
6. Optimize particle counts and shader octaves for mobile; desktop scales up.
7. No `setState` in `useFrame`; mutate uniforms/refs.

Every milestone ends with a **frame-time + bundle-size** measurement recorded
in the PR.

---

## 14. Accessibility

The **UI layer is DOM**, which is what makes this achievable over a WebGL world:

- **Reduced motion** — `useReducedMotion` (media query + settings override)
  branches every animation layer (§9): camera fly-throughs become fades,
  parallax/scroll damping off, particle intensity reduced. This is a core
  requirement, not a toggle we bolt on.
- **Keyboard navigation** — all interactive UI (gate, menus, dialogue choices,
  settings, scene navigation where relevant) is reachable and operable by
  keyboard with visible focus. Space/Enter begin (Part 1 already supports this).
- **Screen readers** — standard UI is semantic HTML with ARIA; the poetry and
  Mubi dialogue are exposed as live regions so the story is *readable*, not
  trapped in a canvas. A text/"story" mode narrates key beats.
- **Audio controls** — master + per-bus volume and mute in settings; nothing is
  audio-only-critical.
- **High-contrast text** — story/dialogue text sits on a scrim/glass backing
  with a contrast-safe variant; a high-contrast setting increases scrim opacity
  and text weight. Never rely on color alone.
- **Captions** — all Mubi voice (future) and meaningful SFX have text
  equivalents; captions setting persisted.
- **Skip / pause** — the intro sequence is skippable; the experience is
  pausable.

---

## 15. Error handling & graceful degradation

Every failure mode has a defined, gentle fallback. The world **degrades, never
breaks.**

| Failure | Behavior |
| --- | --- |
| **No WebGL / context creation fails** | `WebGLErrorBoundary` renders a static "poster" experience: a beautiful still/gradient of the Sea of Stars with the poetry and birthday message in DOM. The gift still lands. |
| **WebGL context lost mid-session** | Listen for `webglcontextlost`; pause, show a soft "the stars are realigning…" state; attempt restore; fall back to poster if unrecoverable. |
| **Audio unsupported / blocked** | Silent mode with a clear unmute affordance; procedural fallback if stems fail; never block visuals on audio. |
| **Slow device** | Capability tiering (§17) drops to `low`/`potato` automatically; if still under budget, reduce to a calm, low-particle mode. |
| **Asset load failure** | Per-asset retry with backoff; then a defined placeholder (e.g. untextured material, skipped decorative asset). Critical-asset failure blocks only its scene, with a retry UI — other scenes remain reachable. |
| **Offline** | PWA service worker serves the shell + cached assets (§16); uncached heavy scenes show an "available when online" state. |
| **Unknown/corrupt save** | Save system fails safe to a fresh state (§12); never crashes. |
| **Unexpected React error** | Scene-level `SceneErrorBoundary` isolates the blast radius to one scene with a "return to shore" recovery, not a white screen. |

Boundaries are layered: **WebGL** (whole world) → **Scene** (one scene) →
**Feature** (one widget). A failure is caught at the narrowest layer that can
recover.

---

## 16. PWA & offline

- **Installable**: `app/manifest.ts` (name, icons, theme `#03050f`, standalone,
  portrait) — a full-screen, app-like gift on Android home screen.
- **Service worker**: precache the shell + tier-1/2/3 assets (UI, ocean, sky)
  so the core experience is **offline-capable**; runtime-cache scene assets
  with a stale-while-revalidate / cache-first-for-immutable strategy.
- **Update flow**: versioned SW; on new deploy, prompt or silently update on
  next launch; never serve a half-updated asset set.
- **Offline fallback**: cached poster experience if the world can't load.
- Tooling choice (custom SW vs `@ducanh2912/next-pwa`-style) is decided in
  Milestone 8; the manifest and caching *contract* is fixed here.

---

## 17. Device capability tiers

A `CapabilityService` classifies the device once at boot (GPU renderer string,
`deviceMemory`, `hardwareConcurrency`, DPR, coarse pointer, a short runtime
frame probe) into a tier, overridable in settings:

| Tier | Particles | DPR cap | Bloom / PostFX | LOD | Shadows |
| --- | --- | --- | --- | --- | --- |
| `high` (desktop / flagship) | full | ≤ 2 | full selective bloom + vignette | high | soft (if used) |
| `mid` (modern Android) | scaled | ≤ 1.6 | bloom on, cheaper | med | off/baked |
| `low` (older mobile) | reduced | ≤ 1.25 | bloom minimal | low | off |
| `potato` (very weak / fallback) | minimal | 1 | off | lowest | off |

`PerformanceMonitor` can **demote** live if frame time degrades, and cautiously
**promote** if headroom returns. All tunables live in `constants/` so tiers are
data, not scattered magic numbers. This formalizes and extends Part 1's
`mobile` branch.

---

## 18. Testing strategy

Each milestone is independently testable (§19). Layers map to test types:

- **Unit (Vitest)** — logic layer: stores, save/migrations, AI dialogue
  selection & story graph, audio bus math, math/rng/color utils, capability
  classifier. This is where most confidence lives; it's fast and deterministic.
- **Component (React Testing Library)** — UI layer: gate, dialogue box, HUD,
  settings, menus — including keyboard and reduced-motion branches (§14).
- **E2E / visual (Playwright)** — the existing screenshot harness is promoted
  to `tooling/` and formalized: per-scene captures at scripted journey times
  (the `?jump=` debug hook stays), asserted against baselines. This is the
  **migration regression gate** (§2) and the reveal-quality gate.
- **Shader smoke tests** — headless WebGL (swiftshader) render of each material
  to catch compile errors and NaN/white-out regressions (the class of bug we
  hit in Part 1).
- **Performance regression** — scripted frame-time + bundle-size checks per
  milestone, recorded in the PR (§13).

Debug affordances retained from Part 1: `?jump=<t>`, `?noocean`, `?nosky`,
`?noparticles`, plus new `?scene=<id>` and `?tier=<tier>` for isolating any
layer/scene/tier during development and testing.

---

## 19. Development milestones

Independent, each with an exit criterion (its own test gate). No milestone
starts until its predecessor's gate is green.

| # | Milestone | Delivers | Exit criterion |
| --- | --- | --- | --- |
| 1 | **Foundation** | Repo restructure (§5), Tailwind, stores scaffold, Canvas shell, boundaries, capability tiers, **Part 1 → R3F migration** | Shore scene matches Part 1 baselines (visual harness green) |
| 2 | **World rendering** | `WorldLayer` (sky, weather), scene system + registry + transitions, selective bloom/postfx | Two scenes load/unload independently at 60 FPS mid-tier |
| 3 | **Ocean simulation** | Ocean ported + upgraded (GPU, LOD, ripples, moods per scene) | Ocean holds budget across all `worldProfile`s |
| 4 | **Mubi AI** | AI module (§11), local brain, dialogue packs, story graph, hints, presence in world | Mubi converses & progresses story from data; unit-tested |
| 5 | **Interactive objects** | Interactions, collectibles, lanterns, pickups, instanced crowds | Collect/open/ripple loops work + persist |
| 6 | **Memory system** | Save/migrations (§12), memory islands, photo galleries (lazy), unlocks | Memories persist across reload; versioned save proven |
| 7 | **Birthday experience** | Celebration scene, GPU celebration FX, music swell, the one loud joyful beat | Full journey Intro→Ending playable end-to-end |
| 8 | **Optimization** | Dynamic res, instancing/LOD pass, texture compression, PWA/offline, code-split audit | Meets §13 budgets on target Android; installable & offline-capable |
| 9 | **Polish** | Motion/audio detailing, accessibility pass (§14), reduced-motion & high-contrast, copy | A11y checklist green; reduced-motion journey complete |
| 10 | **Final QA** | Cross-device matrix, error-path verification (§15), save-migration tests, regression sweep | All gates green on device matrix; graceful degradation proven |

---

## 20. Module boundaries & conventions

- **Import direction (enforced):** `ui` and `world` and `scenes` may depend on
  `stores`, `services`, `hooks`, `lib`, `constants`, `types`, `animation`,
  `audio`, `ai`. Those lower layers **must not** import from `scenes`/`ui`.
  `lib` depends on nothing project-specific. (Consider an ESLint boundary rule.)
- **No cross-scene imports.** Scenes communicate only through stores/events.
- **Public surface only.** Each feature exposes a small `index.ts`; deep imports
  into a feature's internals are disallowed.
- **Typing.** `strict` TS; no `any` in committed code; public APIs are
  `interface`/`type`. Shared contracts live in `types/`.
- **GLSL.** Shared chunks in `shaders/`; feature-local shaders stay in-feature;
  `glsl.ts` (Part 1 simplex/fbm) is promoted to `shaders/lib/`.
- **Constants over magic numbers.** All tunables (budgets, counts, timings,
  palettes, tier tables) live in `constants/`.
- **Disposal ownership.** Whoever creates a GPU resource disposes it.
- **Commits/PRs** record the frame-time + bundle-size measurement for any
  change touching the render path (§13).

---

## 21. Deferred decisions / open questions

Recorded so we don't silently drift:

1. **React Query** — deferred until real server state exists (none today). If
   memories/messages ever come from a backend or the countdown syncs remotely,
   introduce it then, scoped to `services/`.
2. **Save backend** — `localStorage` now; escalate to IndexedDB only if photo
   memories are cached client-side at size. `StorageService` hides the choice.
3. **Mubi brain** — local rule-engine first; LLM/remote later behind
   `MubiBrain`. If remote, revisit privacy for a personal gift (likely
   on-device only).
4. **PWA tooling** — custom SW vs library; decided in Milestone 8. Contract
   (§16) is fixed regardless.
5. **Content authoring** — dialogue/story packs are data; a lightweight
   authoring format (typed TS vs JSON/MDX) to be chosen in Milestone 4.
6. **Scroll usage** — Lenis is in the stack, but the world is primarily
   free-look/interaction, not scroll. Which scenes (if any) are scroll-driven
   is a per-scene decision; Lenis stays optional per scene.

---

_This blueprint integrates the Part 1 vision — the Sea of Stars, its
bioluminescence, the silent love story, and Mubi as its beating heart — with a
modular, testable, mobile-first engineering foundation. Implementation waits for
the next specification part and proceeds milestone by milestone, consistent with
everything above._
