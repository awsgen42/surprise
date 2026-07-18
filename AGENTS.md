# Working in this repository

**Before implementing anything, read
[`docs/ENGINEERING_BLUEPRINT.md`](docs/ENGINEERING_BLUEPRINT.md).** It is the
canonical architecture for the project and all implementation must remain
consistent with it.

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
