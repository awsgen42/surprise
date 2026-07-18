# ADR-0003 — R3F migration hosting the exact Part 1 pipeline (Milestone 2)

- **Status:** Accepted (Milestone 2)
- **Date:** 2026-07-18
- **Context:** M2 migrates the rendering layer to React Three Fiber. The exit
  criterion is that the Shore scene stays **visually identical** to the approved
  Part 1 baseline. The blueprint (M2) also lists selective bloom via
  `@react-three/postprocessing` and AdaptiveDpr/PerformanceMonitor.

## Decisions & trade-offs

1. **R3F hosts the existing imperative engine (ADR-0001 escape hatch).**
   React Three Fiber owns the `<Canvas>`, renderer, camera, sizing, and frame
   loop. The world systems + post-processing are kept in an imperative
   `WorldEngine`, adopted via a thin bridge (`WorldScene`) that adds it to the
   R3F scene and advances it from `useFrame` with **render priority 1** (so R3F
   yields rendering to our composer). Every GLSL string is preserved verbatim.
   *Why:* guarantees identical output and minimizes regression risk versus a
   full declarative rewrite.

2. **Kept the three/addons `EffectComposer` + `UnrealBloomPass` + `OutputPass`
   pipeline; deferred `@react-three/postprocessing`.**
   *Trade-off:* the blueprint names `@react-three/postprocessing`, but its Bloom
   is a different implementation and would shift the look. To honor "visually
   identical," we keep the exact Part 1 bloom (same strength/radius/threshold,
   tone mapping ACESFilmic, exposure 0.92, sRGB). Adopting selective-bloom
   layers is revisited in a later milestone if a visual case exists.

3. **Fixed dpr/antialias from the Part 1 formula; dynamic resolution deferred
   to M13.**
   *Trade-off:* the blueprint lists AdaptiveDpr/PerformanceMonitor in M2, but
   dynamic downscaling changes pixel output and would fight the "identical"
   gate (especially under software GL in CI). We set `dpr = min(devicePR,
   mobile?1.6:2)` and `antialias = !mobile` exactly as Part 1, and defer
   PerformanceMonitor-driven dynamic resolution to M13 (Performance), where the
   blueprint also schedules dynamic resolution. The hook point (Canvas dpr) is
   in place.

4. **Gate decoupled from engine readiness (regression fix).**
   Previously `setReady(true)` was synchronous; under R3F the engine initializes
   asynchronously, which could delay the "tap to begin" gate. The gate now
   renders immediately and `begin()` is queued (`pendingBeginRef`) if tapped
   before the engine is ready — preserving Part 1's instant-gate UX.

5. **`next lint` removed in Next 16.** The `lint` script now runs `tsc --noEmit`
   + the custom import-boundary linter (a meaningful gate) instead of the
   removed `next lint`.

## Consequences

- `World` → `WorldEngine` (renderer/canvas/loop no longer owned by it);
  new `WorldScene` (R3F bridge) and `WorldCanvas` (the persistent `<Canvas>` +
  `WebGLErrorBoundary` poster fallback, Blueprint §15).
- Visuals verified identical (Shore + gate) against the baseline; all shaders,
  camera choreography, timing, reveals, and celebration behavior unchanged.
- Deferred items (selective-bloom option, dynamic resolution) are tracked to
  later milestones with hook points established.
