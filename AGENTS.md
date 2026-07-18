# Working in this repository

**Before implementing anything, read both canonical design docs:**

- [`docs/ENGINEERING_BLUEPRINT.md`](docs/ENGINEERING_BLUEPRINT.md) — the
  architecture (*how it's built*).
- [`docs/WORLD_DESIGN.md`](docs/WORLD_DESIGN.md) — the world design bible
  (*what the world is and how it feels*), including per-system trade-offs.
- [`docs/MUBI_AI.md`](docs/MUBI_AI.md) — the canonical Mubi AI specification
  (*the emotional heart*): personality, reveal pacing, dialogue architecture,
  memory, emotional-safety & privacy rules, and sample dialogue trees.
- [`docs/EMOTIONAL_SYSTEMS.md`](docs/EMOTIONAL_SYSTEMS.md) — *the soul, in
  detail*: dialogue-category taxonomy, the Love Message Library, the interaction
  catalogue, memory presentation, achievements + rewards, and the birthday flow.

All implementation must remain consistent with all four (plus the roadmap in
`docs/IMPLEMENTATION_ROADMAP.md`).

Key rules (see the blueprint for full detail):

- **Feature-first & modular** — one folder per feature/scene; no cross-scene
  imports; features talk only through stores and typed events.
- **Three layers** — UI (DOM/React/Tailwind/Framer Motion), Logic
  (stores/services/AI/save, framework-light, unit-testable), Render
  (R3F + GLSL). Keep them separate.
- **One persistent WebGL canvas**; scenes mount/unmount inside it.
- **60 FPS on modern Android is a hard budget.** No `setState` in `useFrame`;
  mutate uniforms/refs. Dispose GPU resources on unmount. Lazy-load everything
  non-critical.
- **Zustand domain slices**, never one global store.
- **Mobile-first, strong typing (no `any`), graceful degradation.**
- **Implementation is milestone-driven** (blueprint §19) and does not begin
  until the relevant specification part authorizes it.

The current code is **Part 1** (imperative vanilla Three.js). Part 2 adopts
R3F; see [`docs/adr/0001-adopt-react-three-fiber.md`](docs/adr/0001-adopt-react-three-fiber.md)
for the migration decision. Do not start the migration or any Part 2 feature
until asked — the blueprint is design-only for now.
