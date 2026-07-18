# 🌊✨ Sea of Stars

**A cinematic, interactive birthday journey — made with love by Awais, for Mubarra.**

This is not a website. It is a small universe: an endless ocean at night that
glows with bioluminescent light, under a sky of a thousand stars, where a
silent love story unfolds and the sea slowly awakens for one special person.

Built with **Next.js 16**, **React 19**, and **Three.js** — everything
hand-crafted, original, and fully self-contained (no external assets, fonts,
or audio files; even the ambient score is generated live in the browser).

---

## ▶️ Running it

```bash
npm install
npm run dev      # http://localhost:3000
```

For a production build:

```bash
npm run build
npm run start
```

> Best experienced on a phone, with sound, in a dark room. 🌙

---

## 🎬 The journey

1. **The threshold** — a glass card: _"a gift, for Mubarra"_. A single tap
   begins everything (a tap is required so the browser will allow music &
   motion sensors).
2. **The gather** — out of darkness, glowing particles drift in and slowly
   assemble into her name.
3. **The words** — the name dissolves into the sky as three lines of poetry
   fade across a dark, moonlit sea.
4. **The voyage** — the camera glides forward toward the shore.
5. **The Sea of Stars** — the ocean awakens: bioluminescent waves, the moon's
   shimmering reflection, floating lanterns, fireflies, glowing jellyfish,
   shooting stars, and creatures leaping in the distance.
6. **Explore** — touch the water anywhere to send out rings of living light.
   Tilt your phone to look around.

---

## 🧩 How it's built

| Piece | File |
| --- | --- |
| Scene orchestration, camera choreography, post-processing, input | `lib/three/World.ts` |
| Bioluminescent ocean (Gerstner waves + fresnel + moon glitter + ripples) | `lib/three/Ocean.ts` |
| Stars, moon + halo, aurora, shooting stars, meteor showers | `lib/three/Sky.ts` |
| Intro name-particles, air motes, fireflies | `lib/three/Particles.ts` |
| Floating lanterns, jellyfish, creature leaps | `lib/three/Life.ts` |
| Shared GLSL (simplex noise, fbm) | `lib/three/glsl.ts` |
| Procedural ambient score (Web Audio) | `lib/audio.ts` |
| The story beats & timing | `lib/story.ts` |
| React shell, poetry overlay, the begin gate | `components/*` |

**Mobile-first & performant:** particle counts, resolution, antialiasing and
bloom all scale down automatically on phones; point sizes are clamped; the
story runs on a wall-clock so narration keeps its pace even if the framerate
dips; rendering pauses when the tab is hidden.

**Debug helpers** (query params): `?jump=30` starts the journey at t=30s,
`?noocean` / `?nosky` / `?noparticles` isolate layers.

---

## 🏗️ Architecture

Two canonical design documents govern all future work:

- **[`docs/ENGINEERING_BLUEPRINT.md`](docs/ENGINEERING_BLUEPRINT.md)** — *how it
  is engineered*: scene system, state, asset loading, rendering strategy, audio,
  the Mubi AI module, save system, performance budget, accessibility, milestones.
- **[`docs/WORLD_DESIGN.md`](docs/WORLD_DESIGN.md)** — *what the world is and how
  it feels*: ocean, sky, moon, lanterns, wildlife, flora, weather, camera
  language, lighting, shaders, interactions, islands, and the per-environment
  soundscape — plus proposed enhancements and their trade-offs.
- **[`docs/MUBI_AI.md`](docs/MUBI_AI.md)** — *the emotional heart*: Mubi's
  personality, the Awais↔Mubi↔Mubarra relationship, the gradual reveal,
  conversation & dialogue architecture, memory, greetings, hints, celebration,
  emotional-safety & privacy rules, and sample dialogue trees for every stage.

Contributor rules are in [`AGENTS.md`](AGENTS.md).

## 🛣️ What's next (Part 2 → beyond)

Per the blueprint, the world grows into independent scenes (Shore → Open Ocean
→ Lantern Sea → Memory Islands → Moon Garden → Secret Cave → Birthday →
Ending) and gains the **Mubi AI Spirit** — a companion with her own
personality, a memory of Awais & Mubarra's story, dynamic conversation, and an
emotional dialogue engine. The most personal part of this world.

---

_"Tonight, this entire ocean awakens for one special person…"_
