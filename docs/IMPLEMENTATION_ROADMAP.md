# 🛠️ Implementation Roadmap (quick index)

> **The authoritative build strategy is [`docs/MASTER_PLAN.md`](MASTER_PLAN.md)**
> (milestones with goals, dependencies, complexity, risks, testing, exit
> criteria; component map; state flow; performance & testing strategy). This file
> is a lightweight status index that mirrors it.
>
> Turns the specs (Parts 1–5) into an ordered, buildable plan. Each milestone is
> independently shippable and testable, and preserves every prior specification.

## Status legend
✅ done · 🚧 in progress (this build) · ⏳ planned

---

## Milestone A — Emotional Core (Mubi + Love Engine + Memory + Achievements + Dialogue + Birthday flow) 🚧

**The Part 4 "combine" milestone.** Builds the render-agnostic **logic layer**
and a **DOM UI layer** on top of Part 1's working world, so the emotional
systems are real, persistent, and verifiable *before* the larger render-layer
migration. Everything here is authored per the Mubi spec and survives the R3F
migration untouched.

- ✅ State: Zustand domain stores (settings, progress+love, collectibles,
  achievements, mubi) with versioned, fail-safe local persistence.
- ✅ **Love Engine**: a persisted `warmth` scalar that rises with interaction,
  discovery, and dwell — "the sea that recognizes her" — gating Mubi's mood,
  act, and revelation.
- ✅ **Dialogue System**: content-as-data packs, a weighted **no-repeat**
  randomized selector (seedable RNG), guards by act/flags/warmth, three speech
  registers, personalization tokens with safe fallbacks.
- ✅ **Mubi AI**: a controller wiring world events → context → line selection →
  store updates, with greetings, ambient murmurs, reactions, adaptive idle
  hints, and the gradual reveal.
- ✅ **Interactive feature**: tap a floating **memory lantern** → it opens and
  rises → a memory surfaces → Mubi reacts. Ripples/touch feed the Love Engine.
- ✅ **Memory system**: collectible memories/lanterns persisted; a memory card UI.
- ✅ **Achievements**: quiet, emotional milestones with in-character Mubi
  reactions and a gentle toast.
- ✅ **Birthday flow**: opening all memory lanterns raises warmth until Mubi
  invites the celebration → the full reveal + personalized letter + celebration
  FX + ending line.
- ✅ Accessibility & polish folded in: reduced-motion (no typewriter, calm
  motion), captions/live-region for Mubi, high-contrast option, mute; an
  easter-egg (real-world-midnight line).

**Exit criteria (verified this build):** production build clean; Playwright
confirms Mubi greets, a lantern opens a memory, an achievement toast fires,
state persists across reload, and the reduced-motion path works.

---

## Milestone B — Render-layer migration to R3F ⏳
Port Part 1's vanilla-Three world into React Three Fiber (ADR-0002 escape
hatch), single persistent `<Canvas>`, selective bloom, capability tiers,
`WorldLayer` + `SceneManager`. Preserve all shaders + Milestone A logic.
Gate: Shore matches Part 1 visual baselines.

## Milestone C — World systems upgrade ⏳
Ocean trail-RT (wake trails), sky parallax + constellation, god-rays, fog/mist,
World Breath + wind field uniforms (World Design §2–§11).

## Milestone D — Scenes & seamless navigation ⏳
Scene registry + transition-scenes (no loading screens), the nine scenes,
diegetic wayfinding, Mubi leading ahead (World Design §13).

## Milestone E — Wildlife & living world ⏳
Stylized-cinematic-realism creatures (80/20), instancing/LOD/boids, flora,
butterflies, petals, seabirds (World Design §6/§7).

## Milestone F — Full memory islands, moon garden, secret cave ⏳
Per-scene ecosystems, photo galleries (lazy), hidden conversations & the cave
revelation beat (Mubi §12).

## Milestone G — Weather & cinematic rain ⏳
Mist, wind field expression, the rare bioluminescent rain beat + clearing arc
(World Design §8).

## Milestone H — Optimization ⏳
Dynamic resolution, texture compression, code-split audit, PWA + offline
(Blueprint §16), rain/creature tier gating, frame-time budget pass.

## Milestone I — Accessibility & Awwwards polish ⏳
Full a11y pass, spatial audio layers + stems, motion/audio detailing, color
grading, more easter eggs.

## Milestone J — Final QA ⏳
Device matrix, error-path verification, save-migration tests, full-journey
visual regression via the screenshot harness.
