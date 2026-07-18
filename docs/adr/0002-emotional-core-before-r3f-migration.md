# ADR-0002 — Build the emotional core on Part 1 before the R3F migration

- **Status:** Accepted (Milestone A)
- **Date:** 2026-07-18
- **Context:** Prompt 5 authorized implementation of the full Part 4 "combine"
  scope (Mubi AI, Love Engine, interactive features, memory, achievements,
  dialogue, birthday flow). The blueprint (ADR-0001) plans a render-layer
  migration from Part 1's vanilla Three.js to React Three Fiber. Doing that
  migration *first*, in one step, is large and risky and would delay the
  emotional systems that are the heart of the gift.

## Decision

Implement the **logic layer + DOM UI layer now, on top of Part 1's working
vanilla-Three world**, and keep the R3F render-layer migration as its own later
milestone (Milestone B).

## Rationale

- The emotional systems are **render-agnostic** per the blueprint (Zustand
  domain stores, `StorageService`, the `ai/` module, achievements, memory). They
  are built exactly as the blueprint specifies and **survive the R3F migration
  untouched** — only the render layer changes later.
- Part 1's world already runs at 60 FPS and looks right; layering DOM UI + a
  thin world-event bridge onto it is low-risk and immediately shippable.
- It lets us deliver and verify a complete vertical slice (greet → touch →
  memory → reveal → celebration) now, rather than gating everything on a big
  rewrite.

## Consequences

- **Delivered on Part 1:** state stores + versioned save, Love Engine (warmth),
  dialogue engine + content packs + Mubi controller, memory lanterns, memory
  cards, achievements + toasts, the birthday reveal flow, and accessibility
  toggles (reduced motion / high contrast / captions).
- **Bridge code** in `World.ts` (`onRipple`, `onLanternTap`, `celebrate()`) and
  `Life.ts` (tappable carrier lanterns) is small and will be re-expressed as R3F
  components/events during Milestone B without touching the logic layer.
- **Folder placement:** logic lives under `lib/` (matching Part 1's layout)
  rather than the blueprint's `src/` tree; the `src/` restructure happens with
  the R3F migration so it's one move, not two.
- **Deferred:** Mubi's 3D world presence (she is represented in the UI + a light
  glyph for now), world-level reduced-motion damping, and multi-scene dialogue
  — all tracked in the roadmap.

## Alternatives considered

- **Do the R3F migration first.** Rejected for this milestone: higher risk,
  delays the emotional payload, and the logic layer doesn't depend on it.
