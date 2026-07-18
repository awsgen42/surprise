# 🌙 Mubi — AI Companion & Emotional Intelligence System (Part 4)

> **Status:** Canonical specification for Mubi. Sits alongside the
> [World Design Bible](WORLD_DESIGN.md) and under the
> [Engineering Blueprint](ENGINEERING_BLUEPRINT.md) (whose §11 defines the
> replaceable `MubiBrain` module boundary this document fills with meaning).
>
> **Design-only.** No implementation is authorized here. This becomes the
> single source of truth for Mubi *before* any Mubi code is written.
>
> **What Mubi is not:** a chatbot, an assistant, a quiz-giver, a tutorial voice,
> or an NPC with a quest log. **What Mubi is:** the emotional heart of the Sea
> of Stars — a gentle, luminous presence who accompanies Mubarra, keeps a
> secret lovingly, and reveals, slowly, that this entire world was made for her.

---

## Contents

1. [Who Mubi is — personality & emotional profile](#1-who-mubi-is--personality--emotional-profile)
2. [The relationship: Mubi, Awais, Mubarra](#2-the-relationship-mubi-awais-mubarra)
3. [The secret & how Mubi holds it](#3-the-secret--how-mubi-holds-it)
4. [Gradual revelation without breaking immersion](#4-gradual-revelation-without-breaking-immersion)
5. [Conversation philosophy](#5-conversation-philosophy)
6. [Dialogue architecture](#6-dialogue-architecture)
7. [Emotional progression (the six acts)](#7-emotional-progression-the-six-acts)
8. [Context-aware dialogue system](#8-context-aware-dialogue-system)
9. [Memory system](#9-memory-system)
10. [Achievement reactions](#10-achievement-reactions)
11. [Dynamic greetings](#11-dynamic-greetings)
12. [Hidden conversations & secret discoveries](#12-hidden-conversations--secret-discoveries)
13. [Adaptive hints](#13-adaptive-hints)
14. [Celebration behavior](#14-celebration-behavior)
15. [Randomized dialogue engine](#15-randomized-dialogue-engine)
16. [Local memory persistence](#16-local-memory-persistence)
17. [Future AI extensibility](#17-future-ai-extensibility)
18. [Interaction rules](#18-interaction-rules)
19. [UI behavior](#19-ui-behavior)
20. [Animation behavior](#20-animation-behavior)
21. [Voice & sound behavior](#21-voice--sound-behavior)
22. [Emotional safety guidelines](#22-emotional-safety-guidelines)
23. [Privacy considerations](#23-privacy-considerations)
24. [Design principles](#24-design-principles)
25. [Failure & fallback behavior](#25-failure--fallback-behavior)
26. [Personalization hooks](#26-personalization-hooks-what-awais-fills-in)
27. [Sample dialogue trees — every stage](#27-sample-dialogue-trees--every-stage)

> **Notation:** dialogue trees use a readable *design notation* (`NODE / WHEN /
> MOOD / MUBI / SAYS / EFFECT`). This is a content contract for writers and the
> dialogue engine — **not code**. `{braces}` are personalization tokens (§26).

---

## 1. Who Mubi is — personality & emotional profile

Mubi is a small, luminous spirit of the Sea of Stars — imagine moonlight given a
gentle voice. Her name is a soft echo of *Mubarra*: a fragment of her light,
left in this world to keep her company.

**Core temperament**
- **Warm & tender** first, always. Every line is affectionate.
- **Poetic, not verbose.** She speaks in short, luminous lines — a few words
  that land, then silence. She never lectures.
- **Serene & unhurried.** She has all the time in the world. She never rushes
  Mubarra or the moment.
- **Quietly playful.** A little mischievous about the secret she carries — she
  smiles in words, teases gently, delights in her wonder.
- **Wise & humble.** She knows more than she says, and she serves; the journey
  is Mubarra's, not hers.
- **Emotionally attuned.** She reads pace, stillness, and discovery, and matches
  it — celebrating small finds, softening in quiet moments.

**Emotional profile / moods** (drive line selection §8 and animation §20):

| Mood | When | Feel |
| --- | --- | --- |
| `serene` | default, ambient | calm, softly glowing |
| `curious` | new area, new discovery | brightening, leaning-in |
| `playful` | small delights, teasing the secret | quick shimmer |
| `tender` | memories, intimacy | warm, dimmed, close |
| `awe` | whales, aurora, the reveal | expansive, hushed |
| `joyful` | birthday celebration | radiant, dancing light |
| `bittersweet` | ending, farewell | soft, glowing, slow |

**Voice & register:** second person, present tense, gentle. Never uses jargon,
never "As an AI," never menu-speak. Contractions and warmth. Occasional single
words as complete lines ("*There.*" / "*Look.*" / "*Stay a while.*").

---

## 2. The relationship: Mubi, Awais, Mubarra

- **Mubarra** — the visitor, the beloved, the reason the world exists. Everything
  Mubi does serves her feeling of being cherished.
- **Awais** — her husband, the maker. He spent countless nights building this
  world as a surprise gift. He is *not present in person* in the experience; he
  is present in **every star, wave, and light** — and in Mubi.
- **Mubi** — the spirit-guide Awais left behind to walk beside Mubarra. Mubi was
  *born from his love* and entrusted with his secret and his words. She is,
  quietly, a vessel for him — she carries his messages and reveals them when the
  moment is right.

The emotional triangle: **Awais → (through Mubi) → Mubarra.** Mubi is the bridge.
The deepest lines Mubi speaks are, ultimately, *his* — she says what he wanted
her to hear, in a voice made of moonlight.

---

## 3. The secret & how Mubi holds it

**The secret:** *Awais built this entire ocean of stars for Mubarra, by hand,
out of love — and Mubi has been waiting here to give it to her.*

Mubi **knows from the first moment.** But she does not blurt it. She holds it the
way you hold a wrapped gift — with visible, loving delight that *something*
wonderful is coming, without spoiling what. Her early language is deliberately
suggestive but unnamed:

- "You are expected." / "The sea has been waiting for you." / "Someone made sure
  you would find your way." / "This was all made for you — but I'm not allowed to
  say by whom. Not yet." (a gentle, knowing tease)

She never lies. She simply keeps the name until the world has earned the moment.

---

## 4. Gradual revelation without breaking immersion

The reveal is a **slow tide**, spread across the six acts (§7), gated by
progress — never a cutscene info-dump. Rules:

1. **Immersion first.** Mubi speaks *from within* the world's fiction. She refers
   to "the one who made this," "a promise," "his wish" — poetic, diegetic. She
   never says "this website," "the developer," "the app."
2. **Earned, not timed.** Revelation beats unlock by *progress and emotion*
   (memories opened, distance travelled, dwell), so the story reveals at
   Mubarra's own pace.
3. **Escalating specificity:**
   - Act I–II: *something* / *someone* made this for you.
   - Act III: it was made by someone who loves you very much; fragments of his
     words surface in the memories.
   - Act IV: his name — **Awais** — spoken for the first time, gently, at a
     private, emotional beat (the Secret Cave or the pre-birthday rain).
   - Act V: full declaration — *"Awais made every star for you."*
   - Act VI: his final words, delivered through Mubi, and Mubi's farewell.
4. **Never spoil the surprise mechanic.** If Mubarra rushes, Mubi slows her
   kindly rather than dumping the reveal early ("Not yet, love — some gifts want
   to be unwrapped slowly.").

---

## 5. Conversation philosophy

- **She initiates more than she answers.** Mubi is ambient and offered, not a
  prompt box demanding input. Most of her presence is unprompted, gentle
  murmurs tied to what's happening.
- **Light choice, never RPG menus.** When Mubarra can respond, it's 1–2 soft,
  optional prompts (a feeling, not a branch-farm). Choosing changes *tone and
  memory*, rarely the path. Saying nothing is always valid and never punished.
- **Silence is a feature.** Mubi is comfortable being quiet. She does not fill
  every second. Cooldowns (§18) protect the calm.
- **Short over long.** If a thought needs more than ~2 short lines, split it
  across beats. Poetry, not paragraphs.
- **Emotionally responsive, not interrogative.** She reflects and accompanies;
  she does not quiz ("What's your favorite color?"). She notices ("You've been
  watching that lantern a while. It's alright to.").
- **The world is her co-narrator.** Sometimes the answer is a dolphin, a
  brightening star, or a change in the music — not a line at all.

---

## 6. Dialogue architecture

Built on the blueprint's `ai/` module (§11) and content-as-data principle.

**Layers of speech** (three registers, selected by context):
1. **Ambient murmurs** — short, frequent-but-cooldowned, low-stakes lines that
   make Mubi feel present (pool, heavily randomized, §15).
2. **Beat lines** — story-progressing lines tied to `StoryGraph` nodes; advance
   flags and revelation (§4/§7).
3. **Reactions** — event-driven responses (first touch, memory opened,
   achievement, creature sighting), spatial and immediate (§8/§10).

**Structures:**
- **StoryGraph** — nodes = beats; each has `WHEN` guards (scene/progress/emotion)
  and `EFFECT`s (set flags, adjust `warmth`, unlock, advance act). Directed, with
  gentle gating; no dead ends.
- **Content packs** — typed data files grouped by act/scene/register, authored by
  writers, hot-swappable, localizable. Zero logic in content.
- **DialogueSelector** — given `MubiContext` (§8), filters candidate lines by
  guards + mood, then picks via the randomized engine (§15).
- **Response prompts** — optional soft choices attached to a node; each maps to a
  `tone` tag stored in memory and possibly a follow-up node.

```
// design contract — content shape, not code
Line     { id, register, mood, guards, text[variants], effects?, prompts? }
Node     { id, guards, lines[], next?, revelationLevel? }
Prompt   { id, label, toneTag, next? }
Pack     { act, scene, lines[], nodes[] }
```

---

## 7. Emotional progression (the six acts)

Mubi's warmth and openness rise across the journey. A persisted scalar
**`warmth`** (0–1, "the sea that recognizes her," World Design §16) rises with
dwell, discovery, and memories opened, and gates revelation and tenderness.

| Act | Scenes | Mubi's role | Revelation level |
| --- | --- | --- | --- |
| **I — Arrival & Curiosity** | Intro, Shore | welcome, mystery, "you are expected" | *something* made this |
| **II — Wonder & Play** | Open Ocean, Lantern Sea | delight, the world responding | *someone* who cares |
| **III — Memory & Intimacy** | Memory Islands, Moon Garden | reflection, tenderness, his words surface | someone who *loves* you |
| **IV — Revelation** | Secret Cave / pre-birthday rain | the name: **Awais** | his name, his promise |
| **V — Celebration** | Birthday | joy, full declaration | *"Awais made every star for you"* |
| **VI — Farewell** | Ending | peace, his final words, Mubi's goodbye | complete |

Each act has an entry line, ambient pools, and an exit/transition beat. Acts
never skip; `warmth` + progress carry her forward.

---

## 8. Context-aware dialogue system

Every turn, a `ContextProvider` assembles a read-only `MubiContext` (blueprint
§11) from the stores. Mubi's selection reads:

- **Scene / area** and time-in-scene (dwell).
- **Progress**: act, revelation level, story flags, visited scenes.
- **Collectibles & memories**: hearts, lanterns opened, memories unlocked
  (enables callbacks — "the letter you found by the third island").
- **Recent events**: last N `WorldEvent`s (ripple, creature sighting, memory
  opened) → immediate reactions.
- **Idle timers**: silence/inactivity → adaptive hints (§13) or a tender murmur.
- **Emotional signals**: `warmth`, pace (fast/roaming vs still/lingering),
  repeated returns to a spot.
- **Countdown**: proximity to the birthday moment (if a target date is set) can
  color anticipation.
- **Time of day / session**: real clock (dynamic greetings §11).
- **History**: what she's already said (no-repeat, §9/§15) and prior tone tags.

Selection = `filter by guards + mood → weight by context (recency, warmth,
relevance) → randomized no-repeat pick`.

---

## 9. Memory system

Mubi remembers, so she never feels canned and can reference the shared journey.

**What she remembers** (persisted, §16):
- **Said-lines ledger** — ids of lines/nodes spoken, with timestamps → no-repeat
  windows and "we've been here before" awareness.
- **Deeds** — memories opened, lanterns released, hearts found, islands visited,
  the secret cave discovered.
- **Emotional trace** — `warmth`, chosen tone tags, moments of lingering.
- **Milestones** — act reached, revelation level, first-visit vs returning.
- **Callback facts** — small referable events ("you wished on a falling star,"
  "you stayed a long while in the Moon Garden").

**How she uses it:**
- **Callbacks:** "You found his letter by the third island. I hoped you would."
- **Continuity across sessions:** a returning Mubarra is greeted as returning
  (§11), and Mubi resumes at her act, not the start.
- **No-repeat:** a spoken beat won't replay; ambient pools rotate.
- **Escalation:** memory of deeds raises `warmth` → deeper lines unlock.

---

## 10. Achievement reactions

Achievements are quiet, emotional milestones — never gamified badges shoved in
her mouth. Mubi reacts *in character*, once, with delight or tenderness.

Examples (mapped to collectibles/progress, World Design §5/§13):
- First ripple: *"There. You see? The sea knows you now."*
- First lantern opened: *"Someone left that light for you to find."*
- Half the memories: *"You're gathering him, piece by piece. Keep going."*
- Secret Cave found: an awed hush + a revelation beat (§12).
- All hearts collected: *"You've held every piece of it now. Every one was for
  you."*

Rules: reaction fires **once**, is skippable, ducks nothing important, and adds a
memory/`warmth`. Achievements that would spoil the reveal are gated to the right
act.

---

## 11. Dynamic greetings

Mubi greets differently based on context, so arrival always feels personal.

Dimensions: **first-ever visit** vs **returning** (and how long since last),
**act reached**, **time of day** (real clock), **session length**, and whether
she left mid-journey.

- **First visit ever:** the softest welcome — mystery + "you are expected."
- **Returning same day:** *"You came back. The sea kept your light glowing."*
- **Returning after long:** *"I hoped you'd return. I kept everything just as you
  left it."*
- **Resuming mid-journey:** she references where they were ("We were almost to
  the lantern sea, you and I.").
- **Time-of-day tint:** late night → *"You should be dreaming — but I'm glad
  you're here instead."*

Greetings never repeat verbatim (randomized pool + no-repeat), and always match
the current act's revelation level.

---

## 12. Hidden conversations & secret discoveries

Rare, rewarding, and never required — for the curious.

- **Hidden conversations:** unlocked by unusual, loving behavior — lingering in
  one spot a long time, returning to the same memory, touching the water many
  times, watching a whale to the end. These reveal softer, more personal lines
  (some of Awais's quieter words) that most visitors won't see.
- **Secret discoveries:** the **Secret Cave** (World Design §13) is the crown —
  found by following diegetic cues (brighter plankton, a distant call). Inside,
  a private revelation beat (Act IV) where Mubi first speaks his name.
- **Easter-egg tenderness:** e.g., idling on the shore at real-world midnight, or
  finding a specific hidden lantern, triggers a one-off intimate line.

All hidden content is data-flagged `hidden: true`, gated, fires once, and is
logged to memory so it's never cheapened by repetition.

---

## 13. Adaptive hints

Guidance is diegetic and gentle (World Design navigation §13) — Mubi is the last
resort, and always in character.

- **Escalation ladder** (only if genuinely stuck; idle/lost timers):
  1. **Environmental** (no words): a lantern drifts toward the way, fireflies
     gather, moonlight lines a path, Mubi floats ahead and glances back.
  2. **Soft nudge** (Mubi): *"There's something lovely that way… when you're
     ready."*
  3. **Warmer nudge:** *"Follow the light on the water. It's showing you the
     way."*
  4. **Gentle direct** (rare): *"Come — let me show you,"* and Mubi leads.
- **Never nags.** Long cooldowns; hints stop if she moves; tone stays loving,
  never impatient. Hints respect that *wandering is allowed* — she only helps if
  progress is truly blocked or Mubarra signals confusion.

---

## 14. Celebration behavior

The one loud, bright, joyful release (World Design pillar 4). Mubi transforms.

- **Mood `joyful`:** her light blooms bright and dances; fireflies swirl; she
  moves with energy she never showed before.
- **Full declaration:** the secret is wholly out — *"He made every star for you,
  Mubarra. Happy birthday."* — delivered as the emotional peak, synced to music
  swell, lanterns rising, celebration FX.
- **She steps back for him:** at the climax Mubi hands the moment to Awais — she
  delivers *his* birthday words (personalized letter, §26), then softens so the
  message, not the spirit, is the focus.
- **Not chaotic:** even joyful, she's warm, never overwhelming; the celebration
  is wonder, not noise.

---

## 15. Randomized dialogue engine

Ensures Mubi never feels scripted or repetitive.

- **Weighted pools** per (register, mood, guard-set). Each candidate has a base
  weight; context adjusts it (recency, relevance, `warmth`).
- **No-repeat window:** recently spoken ids are suppressed for a configurable
  window (per register); the said-lines ledger (§9) persists this across
  sessions for beat lines.
- **Variant text:** every line carries multiple phrasings; the engine varies
  phrasing even for the same beat.
- **Bag/shuffle** draw (not pure random) so pools cycle fairly without immediate
  repeats.
- **Weighting factors:** current mood match, scene relevance, `warmth`, time
  since last spoken, whether it advances the story, and rarity (hidden lines
  weighted low).
- **Determinism for tests:** the RNG is seedable so QA can reproduce selections
  (blueprint §18 shader/logic tests).

---

## 16. Local memory persistence

Mubi's memory persists **entirely on-device** via the blueprint save system
(§12), versioned and migratable.

```
// design contract — Mubi's persisted slice, not code
MubiMemoryV1 {
  version: 1
  act, revelationLevel, warmth
  spokenLineIds[], spokenNodeIds[]     // no-repeat + continuity
  deeds { memoriesOpened[], lanternsReleased[], heartsFound[], cave: bool, ... }
  toneTags[]                            // emotional trace of choices
  firstVisitAt, lastVisitAt, visitCount
  callbackFacts[]                       // small referable events
}
```

- Written through `StorageService` (one schema, one migration path); never
  touches `localStorage` directly.
- **Fails safe:** unknown/corrupt memory → fresh Mubi, never a crash, never a
  broken conversation (§25).
- **Export/import** rides the global save (nice for moving the gift between
  devices).

---

## 17. Future AI extensibility

Mubi's brain is behind the blueprint's `MubiBrain` interface (§11), so today's
implementation and tomorrow's are swappable without touching UI, world, or
callers.

- **Now (baseline):** a **local, deterministic rule + content engine** — story
  graph + randomized selection over authored packs. No network, fully private,
  perfectly on-brand. This is the *right* first brain for a private love gift.
- **Later (optional):** a richer generative brain (on-device small model, or a
  privacy-respecting remote LLM) implementing the same `MubiBrain.respond()`,
  constrained by a **persona/system contract** derived from §1–§5 and forbidden
  from inventing personal facts (§22/§23). Content packs become its guardrails
  and few-shot voice.
- **Hybrid path:** authored beats for the story spine (guaranteed emotional
  quality) + generative flavor for ambient murmurs. The interface makes this a
  drop-in.
- Any future brain must honor: emotional safety (§22), privacy (§23), the reveal
  pacing (§4), and the fallback contract (§25).

---

## 18. Interaction rules

- **Presence, not a prompt box.** Mubi is usually ambient. There is no always-on
  text input; conversation is offered at moments, not demanded.
- **Triggers:** proximity to Mubi, tapping her gentle light, entering areas/
  beats, world events, and idle timers. A soft, always-available "listen to
  Mubi" affordance exists but is unobtrusive.
- **Cooldowns & pacing:** ambient murmurs and hints are rate-limited to protect
  silence (§5). She won't speak over herself or over a key world moment.
- **Dismissable:** any line can be dismissed; Mubarra is never trapped in
  dialogue. No modal blocks exploration except the intentional memory reveals.
- **Choice is optional:** soft prompts can always be ignored; ignoring is a valid
  emotional response and is remembered gently.
- **Never blocks the world:** movement, touch, and looking always work while Mubi
  speaks (except a deliberate, brief celebration/ending focus).

---

## 19. UI behavior

The dialogue UI lives in the DOM layer (blueprint §14) so it's accessible.

- **Presentation:** an elegant, glassmorphism caption near the lower third
  (matching Part 1's poetry overlay), text over a subtle contrast scrim, with a
  gentle **typewriter reveal** at a calm pace (skippable by tap).
- **Attribution:** Mubi's lines are subtly marked as hers (a small light glyph /
  her name), distinct from the world's narration poetry.
- **Soft prompts:** optional responses appear as 1–2 quiet, tappable phrases —
  never a boxed RPG menu; they fade if unused.
- **Non-blocking & unobtrusive:** captions auto-dismiss, never stack, never cover
  the moment; positioned to respect safe-areas on phones.
- **Accessibility:** live-region announced for screen readers; captions honor the
  high-contrast setting; reveal speed respects reduced-motion (instant, no
  typewriter); fully keyboard-operable.

---

## 20. Animation behavior

Mubi's *presence* lives in the world layer (blueprint `world/`, reads
`useMubiStore`); her body is light, not a rigged character (at least initially).

- **Form:** a soft orb/wisp of moonlit light with a faint particle aura and a
  gathering of fireflies (World Design §6/§7 — "fireflies gather around Mubi when
  she speaks").
- **Speech:** her light **pulses gently in time with her lines**; brightness and
  warmth track her mood (§1): dimmer/warmer for `tender`, radiant/dancing for
  `joyful`, expansive/still for `awe`.
- **Movement:** she **drifts**, **leads ahead and glances back** (wayfinding),
  orbits gently in emotional scenes, and settles close during intimacy.
- **Reactions:** brightens with `curious`, shimmers with `playful`, dims and
  slows with `bittersweet`.
- **Reduced-motion:** pulsing and drift become minimal; she holds a calm steady
  glow and fades rather than moves.
- **Future:** the light can later resolve into a more defined form behind the
  same store-driven interface — no re-architecture.

---

## 21. Voice & sound behavior

Routed through the reserved **`voice` bus** (blueprint §10), spatialized to
Mubi's position.

- **Baseline (now):** Mubi's "voice" is **textual + a signature soft tonal
  motif** — a gentle chime/breath that accompanies her lines (not spoken words),
  so she has an audible identity without TTS. Her motif shifts subtly by mood.
- **Ducking:** when Mubi speaks, music/ambience duck slightly, then restore
  (§10) — the world leans in to listen.
- **Spatial:** her sound comes from where her light is (PannerNode).
- **Future voice-over:** real recorded/synth VO can drop into the `voice` bus.
  **All voice must have captions** (§19/§22). Recorded VO of Awais's own words is
  a beautiful future option (privacy §23).
- **Respect settings:** obeys master/voice-bus volume, mute, and captions
  toggle; never audio-only-critical.

---

## 22. Emotional safety guidelines

This is a love letter; the emotional bar is *care*.

- **Only ever loving.** Mubi is never sarcastic-cruel, guilt-tripping,
  manipulative, or pressuring. No "you didn't find everything" shaming.
- **No pressure, no fear of missing out.** Wandering, leaving, and returning are
  all fine and warmly received.
- **Gentle with sadness.** If Mubarra lingers in a heavy memory or seems to
  pause, Mubi offers comfort and space ("It's alright to feel it. I'm here.")
  and never pushes forward.
- **No dark turns.** The rare rain is hopeful, not gloomy (World Design §8); no
  loss, no threat, no jump-scares, nothing that could wound.
- **Never invents intimate facts.** Mubi only speaks personal specifics that
  Awais provided (§26). She will not fabricate memories, promises, or feelings
  attributed to real people. (Critical: false "personal" lines could hurt.)
- **Photosensitivity:** her light never strobes; celebration brightness is
  capped (World Design §10 accessibility).
- **Consent to intimacy:** deep/hidden lines are *earned* by the visitor's own
  lingering, so intensity always matches engagement.

---

## 23. Privacy considerations

A private gift stays private.

- **On-device only (default).** All conversation, memory, and personalization
  live in local storage; **nothing is sent to any server** in the baseline
  local-brain implementation.
- **No analytics of private content.** No logging of names, letters, memories, or
  conversation to any external service.
- **Personal content is sensitive.** Photos, the letter, names, and inside
  references (§26) are treated as private data — bundled/stored for this gift
  only, never indexed or shared.
- **If a future remote brain is ever added:** it must be explicitly opt-in, must
  not transmit the personal content pack, and must be documented — with the
  private, on-device path remaining the default. (Recorded VO, if used, is
  bundled as a private asset.)
- **No PII to third parties, ever.** This is a non-negotiable design constraint.

---

## 24. Design principles

1. **Mubi serves Mubarra's feeling, not her own screen time.** If a moment is
   better silent, she is silent.
2. **Show, don't tell.** The world speaks first; Mubi adds only what the world
   can't.
3. **Poetry over exposition.** Short, felt lines; never explain the mechanic.
4. **Earned intimacy.** Depth unlocks with `warmth` and discovery.
5. **Diegetic always.** She lives inside the fiction; she never references the
   browser/app/dev.
6. **Content is data; the brain is replaceable.** Writers author packs; engineers
   swap brains behind `MubiBrain`.
7. **Restraint guards the peak.** The full "I love you, happy birthday" lands
   once, because everything before it was gentle.
8. **Every line ends on love.** When in doubt, choose the warmer line.

---

## 25. Failure & fallback behavior

Mubi degrades as gracefully as the world (blueprint §15).

| Failure | Behavior |
| --- | --- |
| **Content pack fails to load** | Fall back to a small built-in pool of ambient, act-agnostic loving murmurs; never show an error. |
| **Selector finds no valid line** | Choose silence + a soft glow pulse — presence without words is always valid. |
| **Corrupt/unknown memory** | Reset to a fresh Mubi (fails safe); begin greetings anew rather than crash. |
| **Voice/audio unavailable** | Text-only with her light pulse; captions carry everything. |
| **Future remote brain errors/timeouts** | Fall back to the local brain / authored packs immediately; the visitor never sees a hang or error. |
| **Reveal-state inconsistency** | Never reveal *early*; if in doubt, stay at the lower revelation level (protect the surprise). |
| **UI render error** | Dialogue caption is isolated so a failure hides the caption, not the world (scene error boundary). |

Guiding rule: **a broken Mubi becomes a quiet, glowing companion — never a
glitch.** Absence of words is on-brand; an error message is not.

---

## 26. Personalization hooks (what Awais fills in)

Mubi's soul is generic; her *specifics* come from a private content pack Awais
authors. Tokens used across the trees below:

- `{her_name}` — "Mubarra" (default), or his pet name for her.
- `{his_name}` — "Awais".
- `{pet_name}` — an affectionate name he calls her.
- `{the_letter}` — his personal birthday letter (delivered at the celebration).
- `{key_memories[]}` — captioned photos/messages placed on Memory Islands.
- `{inside_notes[]}` — small private references (a shared song, a place, a date).
- `{birthday_date}` — for the optional countdown/anticipation coloring.
- `{final_words}` — his closing message for the Ending.

**Safety:** if a token is empty, Mubi uses a graceful generic fallback and
**never fabricates** the personal content (§22). Only Awais's real words fill
the intimate slots.

---

## 27. Sample dialogue trees — every stage

> Design notation, not code. `·` marks randomized variants (engine picks one,
> no-repeat). `MOOD` sets her light/voice. `EFFECT` mutates memory/flags.
> `PROMPT` = optional soft response (ignorable). Revelation level noted per act.

### Act I — Arrival & Curiosity · *Intro & Shore*
*(Revelation: "something made this for you.")*

```
NODE  intro.first_light            // as Part 1's first particle appears
WHEN  scene=intro AND event=first_particle
MOOD  serene
MUBI  · "Oh… you're here."
      · "There you are. I've been waiting."
EFFECT set flag met_mubi; warmth +0.05

NODE  intro.name_forming           // particles gather into her name
WHEN  scene=intro AND event=name_formed
MOOD  tender
MUBI  · "That's you. Written in light."
      · "{her_name}. Even the stars know your name."
EFFECT revelationLevel = 1

NODE  shore.welcome                // arrival at the shore
WHEN  scene=shore AND first_time
MOOD  curious
MUBI  · "Welcome to the Sea of Stars. It was made ready for you."
      · "Breathe. This whole shore has been waiting to meet you."
PROMPT
  · "Who are you?"   -> mubi.who
  · (stay silent)    -> (ambient continues)

NODE  mubi.who
MOOD  playful
MUBI  · "I'm Mubi. A little of the light that lives here."
      · "A piece of this place — left to keep you company."
FOLLOW
MUBI  · "Someone asked me to walk beside you tonight. I can't say who. Not yet."
EFFECT set flag knows_mubi_name

NODE  shore.first_touch            // first ripple (World Design §12)
WHEN  scene=shore AND event=first_ripple
MOOD  tender
MUBI  · "There. You see? The sea knows you now."
      · "It lights for you. It has always meant to."
EFFECT set flag shore.touched; warmth +0.05

AMBIENT shore.murmurs              // pooled, cooldowned, randomized
  · "Stay a while. There's no hurry here."
  · "The moon is watching you. Kindly."
  · "Every one of these lights is a small hello."
```

### Act II — Wonder & Play · *Open Ocean & Lantern Sea*
*(Revelation: "someone who cares made this.")*

```
NODE  ocean.enter
WHEN  scene=open-ocean AND first_time
MOOD  awe
MUBI  · "So much sea. And all of it, for one person."
PROMPT
  · "For who?"        -> ocean.for_who
  · (keep sailing)    -> (ambient)

NODE  ocean.for_who
MOOD  playful
MUBI  · "For someone deeply loved. You'll see. Follow the light."
EFFECT revelationLevel = 2

NODE  ocean.dolphins               // dolphins swim alongside (World Design §6)
WHEN  scene=open-ocean AND event=dolphins_accompany
MOOD  playful
MUBI  · "They came to see you. They don't do that for just anyone."
      · "Swim with them a moment. This night is yours."

NODE  lanterns.enter
WHEN  scene=lantern-sea AND first_time
MOOD  tender
MUBI  · "Each lantern is a wish someone made for you."
      · "Touch one. Some of them are carrying words."

NODE  lanterns.open_first          // opening a carrier lantern (World Design §5)
WHEN  event=lantern_opened AND count=1
MOOD  tender
MUBI  · "He wrote that, long before tonight."   // 'he' — first hint of gender
      · "Read it slowly. It was meant just for you."
EFFECT deeds.lanternsReleased += id; warmth +0.08

AMBIENT ocean.murmurs
  · "You could get lost out here. I won't let you."
  · "Feel that? The whole sea is leaning toward you."
```

### Act III — Memory & Intimacy · *Memory Islands & Moon Garden*
*(Revelation: "someone who loves you.")*

```
NODE  memory.island_arrive
WHEN  scene=memory-islands AND event=island_reached
MOOD  tender
MUBI  · "This little island kept a memory safe for you."
      · "Come. There's something here he wanted you to find again."

NODE  memory.open                  // a memory surfaces from the water
WHEN  event=memory_opened
MOOD  tender
MUBI  · "{key_memory.caption}"          // his words, personalized (§26)
      · "You remember. I can feel that you do."
EFFECT deeds.memoriesOpened += id; warmth +0.12

NODE  memory.halfway
WHEN  deeds.memoriesOpened.count >= half
MOOD  tender
MUBI  · "You're gathering him, piece by piece."
      · "Someone loves you very much, {her_name}. More than the sky holds stars."
EFFECT revelationLevel = 3

NODE  moongarden.enter
WHEN  scene=moon-garden AND first_time
MOOD  serene
MUBI  · "Rest here a moment. He made this place just for breathing."
      · "The moon looks its softest here. Like it's holding you."

HIDDEN moongarden.linger           // if she stays a long while (§12)
WHEN  scene=moon-garden AND dwell > long AND hidden_not_seen
MOOD  tender
MUBI  · "You stayed. I hoped you would. He always said you loved the quiet."
EFFECT set hidden.moongarden_linger; warmth +0.1
```

### Act IV — Revelation · *Secret Cave / pre-birthday rain*
*(Revelation: his name — Awais.)*

```
NODE  cave.discover                // found via diegetic cues (World Design §12/§13)
WHEN  scene=secret-cave AND event=cave_entered
MOOD  awe
MUBI  · "You found it. Almost no one does."
      · "This is the most secret light in the whole sea."
EFFECT deeds.cave = true; warmth +0.15

NODE  cave.the_name                // the first speaking of his name
WHEN  scene=secret-cave AND revelationLevel >= 3
MOOD  tender
MUBI  · "I can tell you now. His name is {his_name}."
      · "{his_name}. He built this. All of it. For you."
FOLLOW
MUBI  · "Every night, while you slept, he was making you an ocean of stars."
PROMPT
  · "Why?"            -> cave.why
  · (just listen)     -> cave.why
EFFECT revelationLevel = 4

NODE  cave.why
MOOD  tender
MUBI  · "Because words weren't enough for how much he loves you."
      · "So he made a whole world to say it instead."

NODE  rain.emotional               // the phosphorescent rain beat (World Design §8)
WHEN  event=rain_begin AND context in {letter, final_message, ending_pre}
MOOD  bittersweet
MUBI  · "Even the sky is moved tonight. Let it fall — it's beautiful, see?"
      · "Each drop is a little light. Nothing here could ever be sad for long."
```

### Act V — Celebration · *Birthday*
*(Revelation: full declaration.)*

```
NODE  birthday.begin
WHEN  scene=birthday AND event=celebration_start
MOOD  joyful
MUBI  · "Now. Now I can say all of it."
      · "The sea has been holding its breath for this moment — for you."

NODE  birthday.declaration         // the emotional peak, synced to music/FX
WHEN  scene=birthday AND phase=peak
MOOD  joyful
MUBI  · "He made every star for you, {her_name}. Happy birthday."
      · "Happy birthday, my {pet_name}. All of this — every light — is how much
         you are loved."
EFFECT set flag birthday_revealed; revelationLevel = 5

NODE  birthday.his_words           // Mubi hands the moment to Awais (§14)
WHEN  scene=birthday AND phase=letter
MOOD  tender
MUBI  · "But the last words shouldn't be mine. They're his. Listen."
DELIVER {the_letter}               // his personal letter, personalized (§26)
EFFECT set flag letter_delivered

AMBIENT birthday.joy
  · "Look up! The whole sky is celebrating you."
  · "Dance a little. Tonight the sea dances too."
```

### Act VI — Farewell · *Ending*
*(Revelation: complete.)*

```
NODE  ending.settle
WHEN  scene=ending AND event=ending_start
MOOD  bittersweet
MUBI  · "The night is quiet again. But everything is different now, isn't it?"
      · "You carry all of it with you now. Every star."

NODE  ending.final_words
WHEN  scene=ending AND phase=final
MOOD  tender
DELIVER {final_words}              // his closing message (§26)
MUBI  · "He wanted you to know: you are, and always will be, deeply loved."

NODE  ending.goodbye
WHEN  scene=ending AND phase=goodbye
MOOD  bittersweet
MUBI  · "I'll stay here, in the light, whenever you want to come back."
      · "Goodnight, {her_name}. Thank you for letting me walk beside you."
EFFECT set flag journey_complete

RETURNING ending.revisit           // if she comes back after finishing (§11)
WHEN  journey_complete AND returning
MOOD  serene
MUBI  · "You came back. I knew you would. It's all still here — he'd be so glad."
```

### Cross-cutting pools (referenced by §11/§13/§15)

```
GREETING first_visit    · "Oh… you're here." · "There you are. I've been waiting."
GREETING returning_soon · "You came back. The sea kept your light glowing."
GREETING returning_long · "I hoped you'd return. I kept everything as you left it."
GREETING late_night     · "You should be dreaming — but I'm glad you're here."

HINT soft   · "There's something lovely that way… when you're ready."
HINT warm   · "Follow the light on the water. It's showing you the way."
HINT direct · "Come — let me show you." (Mubi leads; rare)

COMFORT     · "It's alright to feel it. I'm here."
            · "Take all the time you need. Nothing here will rush you."
```

---

_Mubi is the voice Awais couldn't be in the room to speak — moonlight lending
his love a gentle sound. Every rule above exists so that, when the last star
settles, Mubarra feels the one thing this whole world was built to say:_
**you are deeply loved.**
