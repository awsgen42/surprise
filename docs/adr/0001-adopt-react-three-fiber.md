# ADR-0001 — Adopt React Three Fiber; migrate Part 1's vanilla Three.js

- **Status:** Accepted (Part 2 architecture)
- **Date:** 2026-07-18
- **Context:** Part 1 shipped as imperative vanilla Three.js (`lib/three/*`,
  one `World.ts` render loop). Part 2's mandated stack includes React Three
  Fiber, `@react-three/drei`, and `@react-three/postprocessing`.

## Decision

Adopt **React Three Fiber (R3F)** as the rendering paradigm. Re-express Part 1's
system classes as R3F components while **preserving every GLSL string
verbatim**. Keep imperative cores inside `useFrame` for performance-critical
systems (ocean, GPU particles).

## Rationale

- Declarative scene graph enables per-scene **mount/unmount** and **Suspense**
  asset loading — the backbone of the scene and asset-loading architecture.
- `drei` removes loader/instancing/LOD/adaptive-DPR boilerplate.
- `@react-three/postprocessing` provides **selective bloom**, fixing Part 1's
  global-bloom white-out at its root.

## Consequences

- **Cost:** `World.ts` and the system classes are ported (Milestone 1). This is
  mechanical and behavior-preserving.
- **Preserved:** all shaders, `glsl.ts` (→ `shaders/lib/`), the procedural
  audio engine, the wall-clock story timing, DPR/mobile tiering, dispose-on-
  unmount discipline, and the Playwright screenshot harness.
- **Gate:** the migrated Shore scene must match Part 1 visual baselines before
  any new features are built on top.

## Alternatives considered

- **Keep vanilla Three.js.** Rejected: contradicts the mandated stack and makes
  Suspense-based per-scene loading and drei/postprocessing harder to leverage.
- **Full rewrite discarding Part 1.** Rejected: wastes working, tuned shaders
  and systems; higher risk.
