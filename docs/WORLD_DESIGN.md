# 🌌 Sea of Stars — World Design Bible (Part 3)

> **Status:** Canonical world & experience design. Sits *under* the
> [Engineering Blueprint](ENGINEERING_BLUEPRINT.md) (Part 2) and *over* the
> feature implementations. Where this document specifies *what the world is and
> how it feels*, the blueprint specifies *how it is engineered*. Neither
> overrides the emotional vision of Part 1.
>
> **Design-only.** This authorizes no code. Implementation is milestone-driven
> (blueprint §19); the prerequisite is Milestone 1 (Foundation + R3F
> migration). §15 of this document maps every world system to a milestone.
>
> **Prime directive (unchanged):** every star, wave, and light exists so that
> Mubarra feels — *"You are deeply loved."* No feature ships if it costs that
> feeling, and no feature is simplified except for a stated technical reason
> (each such trade-off is called out inline as **⚖️ Trade-off**).

---

## 0. How to read this

Each world system below follows the same shape so it stays maintainable:

- **Feeling** — the emotional job of the system.
- **Behavior** — what it does in the world.
- **Tech & shaders** — how it's built (consistent with the blueprint).
- **Interaction** — how the visitor touches it.
- **Audio** — its layer in the soundscape (§13).
- **Mobile & reduced-motion** — how it scales down and how it behaves for
  `prefers-reduced-motion`.
- **⚖️ Trade-offs** — honest costs and the recommended choice.

Contents: [1 Design pillars](#1-experience-design-pillars) ·
[2 Ocean](#2--ocean) · [3 Sky](#3--sky) · [4 Moon](#4--moon-choreography) ·
[5 Lanterns](#5--floating-lantern-ecosystem) · [6 Wildlife](#6--wildlife) ·
[7 Flora & tiny life](#7--flowers-butterflies-fireflies) ·
[8 Weather](#8--dynamic-weather) · [9 Camera](#9--camera-language) ·
[10 Lighting](#10--lighting-system) · [11 Shaders](#11--shader-catalogue) ·
[12 Interactions](#12--environmental-interactions) ·
[13 Islands](#13--island-ecosystems) · [14 Soundscape](#14--ambient-soundscape) ·
[15 Sequencing](#15--implementation-sequencing) ·
[16 Proposed enhancements](#16--proposed-enhancements-better-ideas) ·
[17 Global trade-offs](#17--global-trade-offs--decisions-to-confirm)

---

## 1. Experience design pillars

From the elite-team lens, five pillars govern every decision below:

1. **Living, not looping.** Nothing is on a visible loop. A single global
   **World Breath** (a slow ~0.05 Hz signal) subtly modulates light intensity,
   audio swell, wave amplitude, and creature cadence so the world *inhales and
   exhales*. This is the cheapest, highest-impact "aliveness" trick and it
   costs one uniform.
2. **The world recognizes her.** Bioluminescence, creatures, and Mubi respond
   to presence, dwell, and cumulative interaction — the sea *knows* someone is
   here. (Part 1 already seeds this with reactive ripples.)
3. **Guided freedom.** She is never told to click. Attention is drawn by light,
   motion, and sound (a lantern drifts closer, a whale calls from a direction);
   the camera *offers* rather than *forces* (§9).
4. **Restraint, then release.** The world is peaceful and quiet by default.
   There is exactly **one** loud, bright, joyful moment — the Birthday — and its
   power comes from everything before it being gentle.
5. **Coherence.** One **wind field**, one **light key** (the moon), one **color
   grade** per scene. Every system reads the same environment state so the
   world feels authored, not assembled.

---

## 2. 🌊 Ocean

**Feeling:** the ocean is the protagonist — vast, calm, alive, and quietly
affectionate. It should feel deep enough to fall into.

**Behavior:** rolling swell + fine chop; bioluminescent plankton that brightens
on crests, along the visitor's touch and wake, and near creatures; a moonlit
glitter path; soft foam on the sharpest crests; depth-graded color from near-
black deep to a bio-teal glow.

**Tech & shaders** (evolves Part 1's `Ocean.ts`, preserving its GLSL):
- **Displacement:** summed **Gerstner** waves (directional swell) + simplex
  chop, tiered by device (fewer octaves on mobile). Wave state derived from the
  global **wind field** so ocean, lanterns, petals, and grass all agree.
- **Surface:** fresnel rim, analytic **moon glitter** concentrated into the
  moon-azimuth path (Part 1), **subsurface-scattering approximation** (cheap
  wrap-diffuse in bio-teal to fake light passing through the wave), foam mask on
  crest steepness, and **fake caustics** (animated voronoi/again-simplex) just
  under the surface near islands for shallow-water shimmer.
- **Bioluminescence:** an **interactive heightfield/trail render target**
  (ping-pong FBO) is the key upgrade over Part 1's fixed ripple-uniform array —
  it stores touch ripples *and persistent wake trails* that decay over seconds,
  sampled by the ocean shader as extra glow + displacement. This is what makes
  "touch → glowing ripples and trails" feel physical (§12).
- **Reflection:** analytic moon/star reflection in-shader (no SSR). Optional
  **planar reflection** for the moon on `high` tier only.

**Interaction:** touch/drag writes into the trail RT → glowing rings and a wake
that lingers; the sea brightens the longer she stays (recognition).

**Audio:** `ambience` bus — layered surf whose swell is driven by the same wind
field + World Breath, so what you hear matches what you see.

**Mobile & reduced-motion:** octave count, RT resolution, and caustics scale by
tier. Reduced-motion → gentler amplitude, calmer bio pulsing, no sudden bright
reactions.

**⚖️ Trade-offs:**
- *FFT/Tessendorf ocean* is more physically real but heavy and complex.
  **Recommend Gerstner-first** (proven in Part 1, 60 FPS on mobile), with FFT as
  a `high`-tier-only enhancement later — the dreamy tone doesn't need FFT.
- *SSR reflections* are costly and noisy on mobile. **Recommend analytic
  reflection**; planar reflection only on `high`. Not a simplification of the
  vision — the moon path already reads beautifully (verified in Part 1).

---

## 3. 🌌 Sky

**Feeling:** infinite, tender, and quietly in motion — a sky worth lying under.

**Behavior:** thousands of parallaxed stars with individual twinkle and slow
drift; occasional **shooting stars** and **rare meteor showers**; **aurora**
curtains high and subtle; slow-drifting thin clouds; the **stars slowly
rearrange** across the journey, and at one beat gently settle into a
**constellation** meaningful to her (see §16).

**Tech & shaders** (evolves Part 1's `Sky.ts`):
- **Stars:** GPU `Points` on a large dome (tier-scaled count; "millions"
  suggested via density + parallax layers, not literal million-vertex buffers —
  a 3-layer parallax star dome reads as infinite and stays cheap). Per-star
  twinkle, color temperature, size **clamped** (Part 1 lesson).
- **Aurora:** low-frequency layered simplex curtains, additive, **kept subtle**
  (Part 1 tuning) so it never becomes a green wall.
- **Shooting stars / meteors:** pooled, additive trails; meteor showers as
  timed bursts.
- **Clouds:** a few large soft billboards or a thin volumetric-ish scroll on
  `high`.

**Interaction:** looking up (tilt/drag) parallaxes the layers; a rare beat lets
her "wish" on a shooting star (tap during its arc → a small reward).

**Audio:** high, sparse **chimes** (Part 1's "stars singing") on the `wildlife`/
music edge; aurora adds an airy pad on `high`.

**Mobile & reduced-motion:** fewer stars/layers; meteor frequency reduced;
reduced-motion slows drift and softens twinkle (no rapid flicker — also a
photosensitivity safeguard, §14 accessibility).

**⚖️ Trade-off:** literal "millions of stars" as GPU points would blow the
vertex/fill budget on mobile. **Recommend perceptual millions** (parallax
layers + density + bloom). This preserves the *feeling* the vision asks for
without the cost — an honesty note, not a downgrade.

---

## 4. 🌙 Moon choreography

**Feeling:** the moon is the world's steady heart and its single light source —
a witness that follows her gently.

**Behavior:** a luminous disc with a soft halo and faint corona; its reflection
paints the sea; across the journey it performs a slow **choreography** — rising
subtly, shifting hue at emotional beats (warmer at the Birthday, cool and
silver at the Ending), and briefly **haloing** when Mubi speaks an important
line.

**Tech & shaders:** emissive disc + additive halo (Part 1), corona via a cheap
radial shader; the moon is the **key light** for the whole lighting system
(§10) — moving it re-lights the world coherently. Reflection handled in the
ocean shader (§2).

**Interaction:** non-interactive by design (it's the constant), but it *reacts*
to story state — a quiet, dependable presence.

**Audio:** tied to the `music` bus swells at moon beats.

**Mobile & reduced-motion:** trivial cost. Reduced-motion keeps the moon still
(no rise), only hue grading.

---

## 5. 🏮 Floating lantern ecosystem

**Feeling:** each lantern is a wish, a memory, a small warm heartbeat on a cool
sea — the counterpoint to the blue.

**Behavior:** warm paper lanterns drift with the **wind field**, bob on the
swell, cast a warm pool of light and a rippling warm reflection; they gather in
denser drifts in the **Lantern Sea** scene; some carry a **message/memory** and
glow a touch brighter, inviting a tap.

**Tech & shaders:** **`InstancedMesh`** for the lantern bodies (one draw call
for the flock); a soft additive halo billboard per lantern (or an instanced
glow); warm point-light *contribution faked* in the ocean/air via additive glow
(no real dynamic lights on mobile). Drift + bob derived from wind + World
Breath.

**Interaction (key link to the Memory system):** tapping a "carrier" lantern
opens its memory — a photo/message unfolds in the UI layer, then the lantern
releases and rises. This ties the lantern ecosystem to the save/memory system
(blueprint §12) and to Mubi's dialogue.

**Audio:** near lanterns, a soft spatialized **chime/creak**; opening a memory
plays a gentle reveal cue and ducks ambience.

**Mobile & reduced-motion:** instanced count scales by tier; reduced-motion
stills the bob and the rise animation becomes a fade.

**⚖️ Trade-off:** real per-lantern dynamic lights are too expensive at scale.
**Recommend faked additive glow + instancing** — visually indistinguishable in
this bloom-heavy, dark scene, and it keeps hundreds of lanterns affordable.

---

## 6. 🐬 Wildlife

**Feeling:** the sea is inhabited and gentle — life appears like a gift, never
on demand, and each sighting is a small "oh." Dolphins play, a whale surfaces
far away like a slow miracle, turtles glide, jellyfish pulse, fish schools
shimmer.

**Behavior & staging:**
- **Dolphins:** arc and leap in the near-mid distance, trailing bioluminescence;
  occasionally in playful pairs; can be drawn toward the visitor's wake.
- **Whales:** *far-horizon* silhouettes that surface, spout, and slowly sound —
  rare, awe-scaled, never close enough to threaten the intimacy.
- **Turtles:** glide calmly near islands/shallows, gentle and unhurried.
- **Jellyfish:** glowing bells pulsing just beneath the surface (Part 1 has
  these as GPU shader points — kept and enriched).
- **Fish schools:** shimmering **boids-lite** shoals that part around the
  visitor and catch the moonlight.

**Tech & shaders:**
- **Stylized, not photoreal.** Impressionistic forms — clean silhouettes with
  bioluminescent rim/accent and vertex-shader motion (spine sine for
  swim/leap) — rather than heavy rigged photoreal models.
- **Dolphins/turtles/whales:** low-poly `.glb` (Draco), **vertex-animated** or
  light skeletal; **instanced** where multiple; LOD by distance; whales as
  distant billboarded/low-LOD silhouettes.
- **Fish schools:** **GPU boids** (FBO simulation) or instanced with a shared
  flow field — thousands of fish, near-zero CPU.
- **Creature events** are orchestrated by an `EventDirector` (spatialized: a
  whale call comes from where the whale is) and can react to the wake trail RT.

**Interaction:** creatures *notice* the visitor — dolphins veer toward a wake,
fish part around a touch, a whale may call when looked at. No "catch/tap"
gimmicks; the reward is witnessing.

**Audio:** `wildlife` bus — spatialized dolphin clicks, distant whale song
(a signature emotional sound), soft school shimmer.

**Mobile & reduced-motion:** creature density and school counts scale by tier;
far whales drop to billboards on `low`; reduced-motion reduces leap frequency
and speed, keeps motion smooth and calm.

**⚖️ Trade-off (important):** *photoreal, fully-rigged marine animals* are
expensive (model size, skeletal animation, draw calls) and — more importantly —
photorealism fights the dream-like, bioluminescent art direction. **Recommend
stylized/impressionistic creatures.** This is a *quality* choice, not a
simplification: it is more on-brand, more performant, and more emotionally
coherent than realism. If photoreal is explicitly desired for hero moments
(e.g. one whale), we can budget a single high-detail hero creature on `high`
tier — flagged for confirmation (§17).

---

## 7. 🌺 Flowers, butterflies, fireflies

**Feeling:** the small, tender details that reward a close, quiet gaze.

**Behavior:** on shore and islands — glowing night flowers that sway in the wind
and open toward the moon; **butterflies** with softly glowing wings near
blossoms; **fireflies** blinking around rocks and grass (Part 1 has fireflies);
occasional **falling petals** drifting on the wind and settling on the water
(spawning a tiny ripple in the trail RT — cross-system coherence).

**Tech & shaders:** instanced flowers with vertex-wind sway; butterflies as
instanced billboards or tiny meshes with a wing-flap vertex shader + additive
glow; fireflies/petals as GPU points (Part 1). Petals landing write to the
ocean trail RT.

**Interaction:** approaching stirs butterflies into flight; touching grass/
flowers sends a shiver through them and puffs pollen-light.

**Audio:** the softest layer — gentle rustle and a barely-there shimmer near
blossoms; part of `wildlife`/`ambience`.

**Mobile & reduced-motion:** counts scale by tier; reduced-motion calms flight
paths and slows sway.

---

## 8. 🌧️ Dynamic weather

**Feeling:** weather is *mood*, not meteorology — mist for mystery, breeze for
tenderness, a rare gentle shimmer-rain for a held breath.

**Behavior:**
- **Mist / fog:** volumetric-feeling ground fog over the water, thicker near
  islands and in the Secret Cave approach; density tied to scene mood.
- **Breeze:** the visible expression of the **wind field** — grass, petals,
  lanterns, and wave direction all move together; gusts pass through as coherent
  waves.
- **Optional light rain:** a *rare, gentle, opt-in* "phosphorescent drizzle"
  where each drop lights a tiny bio-ring on the sea (writes to the trail RT).
  Used only at a specific emotional beat, never as ambient default.

**Tech & shaders:** fog via exponential + a scrolling noise "mist" plane/
billboards near the camera and islands (cheap, not raymarched); wind field is a
single global vector + low-freq noise sampled by all systems; rain as GPU points
with per-drop impact events into the trail RT.

**Interaction:** breeze responds subtly to the visitor's movement; drizzle turns
the whole sea into a field of tiny lights that respond to her presence.

**Audio:** wind on the `wind` bus (breeze intensity → filter/volume); rain adds
a soft patter layer that ducks other layers slightly.

**Mobile & reduced-motion:** mist billboard count scales; rain disabled on
`low`/`potato`; reduced-motion → static soft fog, no gusts, no rain.

**⚖️ Trade-offs:**
- *Rain on a calm magical sea* risks breaking the peaceful tone **and** costs
  transparency overdraw. **Recommend keeping it rare, gentle, opt-in, and
  emotionally placed** (a "phosphorescent drizzle" reframed as beauty, not
  gloom), tier-gated off on weak devices. This honors the spec's "optional light
  rain" while protecting the vision and perf.
- *True volumetric fog (raymarched)* is expensive. **Recommend layered
  billboard + shader fog** — reads as volumetric in this palette at a fraction
  of the cost.

---

## 9. 🎥 Camera language

**Feeling:** the camera is a loving, unhurried gaze — it breathes, it offers, it
never yanks.

**Vocabulary** (all owned by the single `CameraDirector`, blueprint §9):
- **Drift** — the resting state: slow parallax sway + micro-handheld noise so
  the frame is never dead-still.
- **Glide** — smooth dolly between points of interest (scene transitions).
- **Reveal** — a slow push/tilt that uncovers a vista (the Part 1 Sea reveal).
- **Tether** — gently frames Mubi or a creature, then releases.
- **Offer** — when something wants attention, the camera eases *toward* it a
  few degrees, inviting without commanding.
- **Focus pull** — depth-of-field rack to emphasize a lantern, a face, a
  memory (emotional punctuation).
- **Celebration** — the one energetic sequence: rising, sweeping, joyful (still
  eased, never jarring).

**Principles:** always eased (no linear, no cuts); movement is *motivated*
(light/sound/story); pointer + device-tilt add parallax on top of any move
(Part 1); GSAP timelines for scripted beats, `useFrame` for ambient drift.

**Mobile & reduced-motion:** device-tilt parallax on phones (Part 1); reduced-
motion replaces glides/reveals with gentle cross-fades and disables handheld
noise and DoF racks.

**⚖️ Trade-off:** heavy real-time **depth of field** (bokeh) is costly on
mobile. **Recommend selective, brief DoF** on `mid`+ for punctuation only, off
on `low`.

---

## 10. 💡 Lighting system

**Feeling:** moonlight silver, bioluminescent teal, lantern gold — three
warm/cool notes in balance.

**Model:** one **key light = the moon** (§4). Everything else is *emissive/
additive* and bloom, not real dynamic lights (mobile budget):
- **Bloom:** **selective** via `@react-three/postprocessing` with a luminance/
  emissive threshold + bloom layer, so only true highlights (stars, moon,
  glints, bio crests, lanterns) bloom. This fixes Part 1's global-bloom
  white-out at the source (blueprint §8).
- **Fake GI:** bio light and lanterns contribute additive glow to nearby
  surfaces in-shader (no light probes).
- **Volumetrics:** **screen-space god-rays** from the moon (radial blur/
  occlusion) + fog scattering — *approximated*, not raymarched.
- **Grade:** per-scene ACES tone-map + color grade (blueprint palettes) so each
  environment has its own emotional temperature.

**Mobile & reduced-motion:** bloom/god-ray strength and resolution scale by tier
(blueprint §17). Reduced-motion doesn't change lighting (static is fine); a
**photosensitivity guard** caps bloom flashes and forbids strobing (§14).

**⚖️ Trade-off:** *true volumetric lighting* (raymarched god-rays, light
shafts) is beautiful but expensive. **Recommend screen-space approximation** —
in a foggy, bloom-heavy night scene it is visually convincing and cheap.

---

## 11. 🎨 Shader catalogue

The GLSL we own (shared chunks in `shaders/`, feature-local shaders in-feature;
Part 1's simplex/fbm promoted to `shaders/lib/`):

| Shader | Purpose | Notes |
| --- | --- | --- |
| **Ocean surface** | displacement + fresnel + SSS + foam + bio + caustics | tiered octaves; samples trail RT |
| **Ocean trail RT** | ping-pong heightfield for touch ripples + wake trails | the interactive-water core (§12) |
| **Star field** | GPU points, twinkle, parallax | clamped point size |
| **Aurora** | layered simplex curtains | subtle, additive |
| **Moon halo/corona** | radial glow | additive |
| **God-rays** | screen-space radial scattering | post pass, `mid`+ |
| **Particle systems** | motes, plankton, fireflies, petals, celebration | GPU points/FBO, clamped |
| **GPU boids** | fish schools | FBO simulation, `mid`+ |
| **Jellyfish bell** | SSS-ish pulsing glow | Part 1 base, enriched |
| **Lantern glow** | warm additive halo | instanced |
| **Flora/petal wind** | vertex sway from wind field | instanced |
| **Fog / mist** | scrolling noise scattering | cheap volumetric feel |
| **Transition/dither** | scene crossfades, reveals | full-screen |

Rule: shaders read shared environment uniforms (time, **World Breath**, **wind
field**, moon dir/color, scene grade) so the world stays coherent.

---

## 12. 🌊 Environmental interactions

**Feeling:** the world answers her touch — it *wants* to be touched.

**Grammar:**
- **Touch → glowing ripple:** a tap writes a ring into the **trail RT** →
  expanding bio ring + displacement + a soft chime. (Part 1 has ripples;
  the RT upgrade makes them physical and layered.)
- **Drag → wake trail:** a lingering, decaying luminous trail follows the
  finger/pointer across the sea; creatures may follow it.
- **Reflections:** the moon, stars, and lanterns reflect and *shatter* in the
  ripples she makes.
- **Presence/dwell:** staying in one place slowly intensifies local bio — the
  sea leaning toward her (recognition pillar).
- **Tilt → parallax** and **tap lantern → memory** (§5).

**Tech:** unified `interactions/` feature writes normalized events into the
trail RT and emits `WorldEvent`s that creatures, audio, and Mubi subscribe to
(blueprint event bus). One input path, many reactions.

**Mobile & reduced-motion:** touch-first (multi-touch ripples supported);
reduced-motion keeps ripples but gentler and non-startling; all interactions
have a non-motion feedback (sound/soft glow) for accessibility.

---

## 13. 🏝️ Island ecosystems

Islands are the "rooms" of the world (blueprint scenes), each a small,
self-contained ecosystem reached by gentle sail/glide across the Open Ocean.

- **Memory Islands:** each island holds one **memory** (photo/message) unlocked
  by arriving and a small act (opening a lantern, touching a glowing bloom).
  Each has its own micro-flora, fireflies, and palette. Ties to save/memory
  (blueprint §12) and Mubi (who reminisces).
- **Secret Cave:** *hidden* — discovered by following a subtle cue (a trail of
  brighter plankton, a distant sound). Inside: concentrated bioluminescence,
  hushed audio, a private surprise. Discovery is the reward.
- **Moon Garden:** a calm interlude — glowing flora, butterflies, still water, a
  perfect moon reflection. A place to breathe.

**Tech:** each island is a lazy-loaded scene (blueprint §4/§7) with instanced
flora, its own audio profile, and shared world layers (ocean/sky/moon) re-tuned
via `worldProfile`. Only the active island + adjacents stay resident.

**Interaction:** exploration-driven; Mubi offers gentle hints if she lingers
lost (blueprint hint system).

**Audio:** each island has a distinct `ambience`/`music` profile with smooth
crossfades on approach/entry (§14).

**⚖️ Trade-off:** a fully open, seamless sail between islands (no loading seams)
is ideal but demands careful streaming. **Recommend "guided freedom"** — free
look and free short-range sail within a scene, with graceful, masked
transitions (fog/glide/audio crossfade) between island scenes rather than one
giant always-resident world. Preserves immersion within budget. (Navigation
model is a confirm item — §17.)

---

## 14. 🎵 Ambient soundscape

**Feeling:** sound you feel more than notice — until the Birthday, when it
blooms.

**Architecture** (blueprint §10 — layered Web Audio bus graph):
`ambience (ocean) · wind · wildlife · music · sfx · celebration · voice(future)`

- **Per-environment profiles:** every scene/island declares target bus levels +
  a music cue; transitions **crossfade** (no hard cuts). Shore, Open Ocean,
  Lantern Sea, Memory Islands, Moon Garden, Secret Cave, Birthday, Ending each
  sound distinct.
- **Spatialization:** creatures, lanterns, and cave echoes use `PannerNode`
  spatial audio — a whale call *comes from the whale*, a lantern chimes where it
  floats. Headphone-aware.
- **World Breath** modulates ambience swell and a music pad so audio breathes
  with the visuals.
- **Ducking:** Mubi's voice / key SFX duck music & ambience, then restore.
- **Procedural fallback:** Part 1's generated score remains the graceful
  fallback when stems haven't loaded or fail (blueprint §15).

**Mobile & reduced-motion / accessibility:** master + per-bus controls in
settings; nothing is audio-only-critical; captions for voice and meaningful SFX
(blueprint §14). Autoplay unlocked by the Start Gate tap (Part 1).

---

## 15. 🗺️ Implementation sequencing

Mapping every world system onto the blueprint's milestones (§19). **Part 1
already ships** a baseline of many systems (marked ✅) — Part 3 upgrades and
extends them; it does not restart them.

| Milestone | World systems delivered |
| --- | --- |
| **M1 Foundation** | R3F migration of Part 1 (ocean✅, sky✅, moon✅, lanterns✅, jellyfish✅, fireflies✅, leaps✅, procedural audio✅), World Breath + wind-field uniforms, capability tiers, selective bloom |
| **M2 World rendering** | Sky upgrade (parallax layers, meteor showers, constellation hook), lighting system (selective bloom, god-rays, per-scene grade), fog/mist, scene system + transitions |
| **M3 Ocean simulation** | Ocean upgrade: trail-RT (ripples + wake trails), SSS, caustics, tiered octaves, moon reflection modes |
| **M4 Mubi AI** | Mubi presence + dialogue/story/memory/hints (blueprint §11); creature/lantern event reactions wired to Mubi |
| **M5 Interactive objects** | Wildlife (dolphins, whales, turtles, fish boids), lantern ecosystem + memory-carriers, flora/butterflies/petals, full interaction grammar |
| **M6 Memory system** | Memory Islands, photo galleries (lazy), unlocks + versioned save |
| **M7 Birthday** | Moon Garden, Secret Cave, Birthday celebration (the one release), Ending |
| **M8 Optimization** | Dynamic res, instancing/LOD/boids tuning, texture compression, PWA/offline, rain gating |
| **M9 Polish** | Camera-language detailing, spatial-audio pass, accessibility + reduced-motion + photosensitivity, color grading |
| **M10 Final QA** | Device matrix, error paths, save migrations, full-journey regression via the screenshot harness |

Each milestone is independently testable and ends with a frame-time + bundle
measurement (blueprint §13/§18).

---

## 16. 💡 Proposed enhancements (better ideas)

Original additions that raise the ceiling toward Awwwards SOTD **while
preserving the emotional vision**. Each is optional and flagged with its cost.

1. **The constellation that remembers.** At one late beat, drifting stars settle
   into a constellation meaningful to Awais & Mubarra (a shape, initials, or a
   date). *Cost:* trivial (a target-position set for the star field, which Part 1
   already supports via rearrangement). *Payoff:* enormous, deeply personal.
2. **The sea that recognizes her.** Cumulative dwell/interaction slowly raises a
   global "warmth" value that brightens bio, draws creatures nearer, and shifts
   Mubi warmer. *Cost:* one persisted scalar. *Payoff:* the core "you are loved"
   feeling made mechanical.
3. **Wake-following life.** Fish and dolphins subtly follow the luminous wake she
   draws (trail RT as a flow field). *Cost:* sampling the RT in the boids field.
   *Payoff:* the world feels *aware*.
4. **Message-in-a-lantern.** Lanterns carry the actual memories/messages; opening
   one releases it skyward. *Cost:* ties lanterns↔memory↔Mubi (already planned).
   *Payoff:* unifies three systems into one gesture.
5. **World Breath.** The global aliveness signal (§1). *Cost:* one uniform.
   *Payoff:* the single biggest "living world" upgrade per byte.
6. **Diegetic wayfinding.** Never a UI arrow — brighter plankton trails, a whale
   call from a direction, a lantern that drifts toward the next island. *Cost:*
   design + event director. *Payoff:* immersion intact, no HUD clutter.
7. **A held-breath beat before the Birthday.** The phosphorescent drizzle (§8)
   placed as the quiet inhale before the celebration's release. *Cost:* the rain
   system, tier-gated. *Payoff:* emotional contrast that makes the joy land.
8. **Photo-memories that surface from the deep.** In Memory Islands, a memory
   rises from beneath the glowing water rather than popping in a modal. *Cost:*
   a reveal shader + camera focus pull. *Payoff:* memories feel *found*.

---

## 17. 🌐 Global trade-offs & decisions to confirm

Stated plainly so we choose deliberately, per the "explain trade-offs before
implementing" directive:

- **WebGL vs WebGPU.** Blueprint targets **WebGL/R3F** as baseline (broad,
  reliable Android support in 2026). WebGPU enables compute-based ocean/boids
  but support is uneven on target devices. **Recommend WebGL-first**, with
  systems designed so a **WebGPU renderer** can be swapped in behind capability
  detection later (R3F supports `WebGPURenderer`). Progressive enhancement, not
  a fork.
- **Wildlife style.** **Recommend stylized/impressionistic** (§6) over
  photoreal for coherence + performance; open to one photoreal *hero* creature
  on `high` if desired. *(Confirm.)*
- **Navigation model.** **Recommend "guided freedom"** (§13) — free look + short
  free sail within scenes, masked transitions between islands — over a single
  seamless always-resident open world. *(Confirm.)*
- **Light rain.** **Recommend rare, gentle, opt-in "phosphorescent drizzle"**,
  tier-gated off on weak devices (§8). *(Confirm it stays in.)*
- **"Millions of stars."** Delivered as **perceptual millions** (parallax +
  density + bloom), not literal million-vertex buffers (§3).
- **Volumetrics & DoF.** **Approximated** (screen-space god-rays; brief selective
  DoF on `mid`+) rather than raymarched/heavy (§9/§10).

None of these simplify the *emotional* experience; each protects the 60 FPS
mobile budget or the art direction, with the more expensive option available as
a `high`-tier enhancement where it genuinely adds.

---

_The world above is one continuous act of devotion: a sea that lights at her
touch, a sky that remembers her, life that comes to greet her, and a single
golden moment made for her. Everything here serves that. Implementation waits
for the go-ahead and proceeds milestone by milestone, faithful to Parts 1 and
2._
