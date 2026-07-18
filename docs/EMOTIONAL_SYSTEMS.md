# 💞 Sea of Stars — Emotional Systems Specification (Part 5)

> **Status:** Canonical. The final design reference before full implementation.
> **Extends** — and never contradicts — the existing canon:
> [Engineering Blueprint](ENGINEERING_BLUEPRINT.md),
> [World Design Bible](WORLD_DESIGN.md),
> [Mubi AI Spec](MUBI_AI.md), and the shipped Milestone A code.
>
> **This document does not restate prior content.** Where a topic is already
> specified (Mubi's personality, mood system, privacy, fallback, greetings,
> idle, revelation pacing, the world's rendering, the warmth/Love-Engine scalar)
> it is **referenced, not repeated**. Only new or expanded design is written
> here. Cross-references use the form (→ MUBI_AI §7).
>
> **Design only — no implementation code.**

---

## 0. Naming & consistency notes (read first)

- **"Love Engine" has two halves.** The **Warmth model** (the persisted `warmth`
  scalar that gates acts/mood) is already specified and shipped
  (→ MUBI_AI §7, `lib/love/love.ts`). This document specifies its **second
  half**: the **Love Message Library** (§2) — the reusable romantic content
  system. Both live under the "Love Engine" umbrella.
- **Two content systems, one rotation engine.** Mubi's dialogue packs
  (→ MUBI_AI §6) and the Love Message Library are **separate content** but share
  one **weighted, no-repeat rotation engine** (→ MUBI_AI §15, `lib/ai/selector`,
  `lib/ai/rng`). Reusing it is a maintainability decision, not new tech.
- **Everything here is content-as-data** (authored packs), consistent with the
  blueprint's "content is data; the brain is replaceable" principle
  (→ BLUEPRINT §11, MUBI_AI §24).
- **All new interactive entities** obey the world's rendering, performance, and
  accessibility rules already set (→ WORLD_DESIGN §6–§12, §17; BLUEPRINT §8,
  §13, §14). This doc specifies their *interaction and emotion*, not their
  shaders.

---

## 1. Mubi — dialogue category taxonomy (extends MUBI_AI §6–§7, §27)

MUBI_AI already defines Mubi's soul, moods, registers, memory, greetings, idle,
hints, reveal pacing, celebration, replay, privacy, fallback and extensibility.
**Not restated.** This section adds only the missing layer the brief asks for: a
formal **dialogue category taxonomy** that organizes content packs and maps to
the six acts (→ MUBI_AI §7) and three registers (→ MUBI_AI §6).

Each **category** is an authoring bucket. A `MubiLine` gains an optional
`category` tag (additive to the existing shape → MUBI_AI §6) so writers and the
selector can filter by category as well as trigger/guard.

| Category | Purpose | Primary act(s) | Register(s) | Mood range | Revelation |
| --- | --- | --- | --- | --- | --- |
| **Welcome** | first contact, returning, resuming | Arrival | greeting | serene, tender | 1 |
| **Exploration** | accompany wandering; make presence felt | Wonder | ambient | serene, curious, playful | 1–2 |
| **Discovery** | react to finding a thing/creature/place | Wonder→Memory | reaction | curious, awe, playful | 2 |
| **Memories** | frame an opened memory; reminisce | Memory | reaction, beat | tender | 3 |
| **Love** | speak the world's devotion directly | Memory→Revelation | beat, ambient | tender | 3–4 |
| **Birthday** | the reveal + celebration voice | Celebration | beat | joyful, tender | 4–5 |
| **Hidden secrets** | rare lines for the deeply curious | any | reaction, ambient | tender, playful | varies |
| **Celebration** | in-the-moment joy during the party | Celebration | ambient, reaction | joyful | 5 |
| **Farewell** | closing, gratitude, "come back" | Farewell | beat, greeting | bittersweet, serene | 5 |

**Authoring rules per category** (extend, don't restate the engine):
- Each category ships a **pool of variants** so no line repeats within its
  no-repeat window (→ MUBI_AI §15). Target ≥ 6 variants for high-frequency
  categories (Welcome, Exploration, Discovery), ≥ 3 for beats.
- **Discovery** lines are keyed by *subject* (`discovery:dolphin`,
  `discovery:pearl`, …) so Mubi names what she sees — hooking the interaction
  catalogue (§3).
- **Love** and **Hidden secrets** lines are **rarity-weighted** (§2 rarity
  model) so a rare, especially tender line surfaces occasionally and feels like
  a gift.
- **Birthday/Celebration/Farewell** are `once`-gated beats guarding the reveal
  (→ MUBI_AI §4); Celebration also has an ambient joy pool for variety.

**New sample lines** (illustrative additions, not restating §27 — writers extend
these into full pools; `{tokens}` per MUBI_AI §26):

```
Welcome       · "The tide counted the days until you came. So did I."
Exploration   · "Wherever you drift, the light drifts with you."
              · "No wrong turns here — only things you haven't been shown yet."
Discovery     · "A pearl. The sea only gives those to people it adores."
              · "Shh — watch. The turtles are old, and they remember kindness."
Memories      · "Hold this one gently. He kept it for a night just like this."
Love          · "You are the reason he learned the names of the stars."
              · "If loving you were a sea, {his_name} would still be sailing it."
Hidden        · "You found a quiet the others walk past. That's very you."
Birthday      · "The whole ocean has been practicing this moment. For you."
Celebration   · "Look UP, {her_name} — the sky is applauding!"
Farewell      · "Go softly. The light stays on for you, always."
```

**Improvement (recommended):** add a lightweight **tone-memory influence** — if
the visitor repeatedly chose `quiet`/`moved` prompts (→ MUBI_AI §9 tone tags),
weight Love/Memories categories slightly softer and slower. Cheap, deepens the
sense of being *understood*.

---

## 2. Love Engine — the Love Message Library

A reusable romantic **content system**, distinct from Mubi's dialogue, surfaced
across the world (in shells, pearls, hearts, the daily wish, and by Mubi). It is
designed to be **anniversary-ready and seasonal**, so this same gift keeps
giving long after the birthday.

### 2.1 Data model (design contract — not code)

```
LoveMessage {
  id: string
  category: 'compliment' | 'joke' | 'daily-wish' | 'encouragement'
          | 'micro-love' | 'anniversary' | 'seasonal' | 'letter' | 'special'
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
  text: string                     // {tokens} per MUBI_AI §26
  season?: 'spring'|'summer'|'autumn'|'winter'|'ramadan'|'eid'|'newyear'|...
  dateKey?: 'MM-DD'                 // anniversary / birthday-locked
  weight?: number                  // within-rarity tuning
}
LovePack { messages: LoveMessage[] }   // authored to 100+ entries
```

### 2.2 Rotation — never repeat until exhausted

The rule "messages never repeat until all have been shown" is a **bag shuffle**:
- Maintain a persisted **seen set** per surface-scope (→ BLUEPRINT §12 save).
- Draw only from **unseen** messages that pass the current filter (category /
  season / date). When the unseen pool for a filter empties, **reshuffle** that
  filter's pool and clear its seen marks — so every message is shown once before
  any repeats, exactly as required.
- Reuses the existing no-repeat engine (→ MUBI_AI §15) — one code path, two
  content libraries (maintainability).

### 2.3 Rarity — special messages feel earned

| Rarity | Feel | Surfacing weight | Example use |
| --- | --- | --- | --- |
| `common` | everyday warmth | frequent | compliments, daily wishes |
| `uncommon` | a little spark | regular | cute jokes, encouragement |
| `rare` | a caught breath | occasional (higher `warmth` raises odds) | deep love lines |
| `legendary` | a treasure | very rare / gated to milestones & pearls | the most personal lines, unlocked by achievements (§5) |

Rarity biases draw weight *within* the unseen pool, so rarity never breaks the
"show all before repeat" guarantee — it only orders **how soon** within a cycle.

### 2.4 Delivery surfaces (hooks into §3)

- **Shells** → a `compliment` or `micro-love` on open.
- **Pearls** → a `rare`/`legendary` line (pearls are precious).
- **Hearts** → `micro-love`; collecting feeds Heart Collector (§5).
- **Daily wish** → one `daily-wish` per real day (date-seeded, persisted).
- **Mubi** → may voice a Love-category line (§1) drawn from this library.
- **Anniversary / seasonal** → date/season-filtered draws replace the default
  pool on those days (§2.6).

### 2.5 Love letter (structure, not restatement)

The full letter lives in the personalization pack (`the_letter`, delivered at
the birthday → MUBI_AI §26, §14). **Not restated here.** Recommended **structure
template** for Awais to author, so it lands with maximum feeling:

1. *Opening* — her name / a pet name.
2. *A specific, true memory* — one small real moment (specificity = intimacy).
3. *Why the world* — "words weren't enough, so I built you a sky."
4. *A promise* — forward-looking, gentle.
5. *Close* — "Happy birthday. I love you, always. — {his_name}."

### 2.6 Anniversary-ready & seasonal structure

- **Anniversary:** messages tagged `dateKey` (e.g. wedding date, the day they
  met) are prioritized on those days and unlock a special world tint + a Mubi
  acknowledgment. The experience thus doubles as an **evergreen anniversary
  gift** — a major replay-value and longevity win.
- **Seasonal:** `season`-tagged pools (including culturally relevant ones —
  Ramadan/Eid noted respectfully as options for this couple) swap in
  automatically. Seasons also lightly re-grade the world palette (→ WORLD_DESIGN
  §10) — same world, new mood.

### 2.7 The library — 100+ placeholders

> Placeholders, tasteful and generic; **Awais personalizes them** in the private
> pack. `[C]`ommon `[U]`ncommon `[R]`are `[L]`egendary. Tokens per MUBI_AI §26.
> These seed the pool; it is authored to 100+.

**Romantic compliments (`compliment`)**
1. [C] "Your smile could out-shine this whole ocean."
2. [C] "You make ordinary moments feel like magic."
3. [C] "The stars are just practicing to be as bright as you."
4. [C] "You have the kind of heart the sea writes songs about."
5. [C] "Even the moon leans closer when you're near."
6. [C] "You are the calm and the wonder, all at once."
7. [U] "If kindness had a face, it would be trying to look like yours."
8. [U] "You turn quiet nights into something worth remembering."
9. [U] "The tide comes in just to be a little closer to you."
10. [U] "You're proof that the best things in life aren't things."
11. [R] "Loving you is the easiest thing I have ever done."
12. [R] "You are my favorite star in a sky full of them."
13. [R] "Every good thing in me learned it from you."

**Cute jokes (`joke`)**
14. [C] "Are you a bioluminescent wave? Because you light up when I'm around. 🌊"
15. [C] "I asked the sea for a treasure. It handed me a photo of you."
16. [C] "You must be a jellyfish — you're glowing *and* you took my heart. 🪼"
17. [U] "I'm not saying you're a starfish, but you *are* my star. ⭐"
18. [U] "The moon called. It's jealous. I told it to get in line."
19. [U] "Warning: excessive cuteness detected. Source: you."
20. [C] "Whale, whale, whale… look who lit up the whole ocean. 🐳"
21. [U] "I tried to count the ways I love you. I ran out of stars."
22. [C] "You otter know how amazing you are. (There are no otters here. I panicked.)"

**Daily wishes (`daily-wish`)**
23. [C] "Good morning, my love. May today be gentle with you."
24. [C] "However today goes, you are already enough."
25. [C] "Take the day slowly. You deserve a soft one."
26. [C] "I hope something small makes you smile today."
27. [C] "You are loved — before you've even done a single thing today."
28. [C] "May your worries be light and your tea be warm."
29. [U] "Somewhere, always, someone is grateful you exist. (It's me.)"
30. [U] "Go be wonderful. Or go be tired. Both are allowed."
31. [C] "Whatever today asks of you, you can set some of it down."
32. [C] "The world is better on the days you're in it."

**Random encouragement (`encouragement`)**
33. [C] "You've survived every hard day so far. That's a perfect record."
34. [C] "Rest is not quitting. Breathe."
35. [C] "You're doing better than the voice in your head says."
36. [U] "Storms end. You are the sky, not the weather."
37. [U] "You don't have to carry it all tonight. Put some of it in the sea."
38. [C] "One small step still counts as moving."
39. [U] "You are allowed to take up space and to be soft."
40. [R] "Whatever happens, you will not face it alone. Ever."
41. [C] "Be as kind to yourself as you are to everyone else."
42. [U] "The tide always comes back. So will your strength."

**Micro-love (`micro-love`)** (short, for hearts/shells)
43. [C] "You. Always you."
44. [C] "Still my favorite."
45. [C] "Every version of you."
46. [C] "Home is wherever you are."
47. [C] "My whole heart. ♡"
48. [C] "Yes. A thousand times."
49. [U] "I'd choose you again."
50. [U] "You, in every lifetime."
51. [C] "Forever, and then more."
52. [C] "Loved. Completely."
53. [U] "The best thing I ever did was find you."
54. [C] "Come here. Stay."
55. [C] "My person."
56. [U] "You are the wish and the star."

**Deep love (`compliment`/`micro-love`, higher rarity)**
57. [R] "You are the reason I believe in gentle things."
58. [R] "I would build you a thousand oceans and still owe you more."
59. [R] "When I picture peace, I picture your hand in mine."
60. [R] "You made a home in me and never left. Please never leave."
61. [L] "If I get only one life, I'm glad it's the one with you in it."
62. [L] "You are my ordinary miracle."
63. [R] "I don't need the stars. I have you, and you're brighter."
64. [R] "Being loved by you is the luckiest accident of my life."

**Hidden / special (`special`, gated by achievements §5)**
65. [L] "You found the quiet places. So few do. So few are like you."
66. [L] "This one's just for you — no world, no stars, only: I love you."
67. [R] "Secret: I'd do all of this again for one more of your laughs."
68. [L] "The deepest light in this ocean was always going to be yours."

**Anniversary (`anniversary`, dateKey)**
69. [R] "One more year of you. The best years I've had."
70. [R] "I'd marry you again tonight, on this exact glowing water."
71. [R] "Every anniversary, the same vow: you, and only you."
72. [L] "Thank you for the years, and for every one still coming."
73. [U] "Look how far we've drifted — and never once apart."

**Seasonal (`seasonal`, season)**
74. [U] (spring) "You bloom, and so does everything near you."
75. [U] (summer) "Warm nights were made for you and this sea."
76. [U] (autumn) "Even as the world lets go, I'm holding on to you."
77. [U] (winter) "You are the warm light in the longest nights."
78. [R] (newyear) "Whatever the new year brings, it brings us together."
79. [U] (eid) "Blessings on blessings — and the biggest is you."
80. [U] (ramadan) "In the quiet of these nights, my gratitude is you."

**Everyday warmth (`compliment`/`daily-wish` fillers to reach 100+)**
81. [C] "You are so easy to love."
82. [C] "Thinking of you. Which is to say: always."
83. [C] "The sea says hello. I say I adore you."
84. [C] "You + me. Simple math. Best answer."
85. [C] "Your voice is my favorite sound in any ocean."
86. [C] "I hope you feel held today, even from far away."
87. [C] "You are worth every star I could ever name."
88. [C] "Little reminder: you're wonderful."
89. [C] "The lanterns are lit because of you."
90. [C] "You're my good news, every day."
91. [U] "I love the way you love things."
92. [U] "You make brave look gentle."
93. [C] "Somewhere the moon is smiling. It saw you."
94. [C] "You are my calm harbor."
95. [C] "Every wave here knows your name."
96. [U] "You are the softest, strongest thing I know."
97. [C] "I'd cross any sea for that smile."
98. [C] "You are deeply, endlessly loved."
99. [R] "Of all the lights in all the skies — you."
100. [L] "You are the whole reason there is a Sea of Stars at all."
101. [C] "Stay as long as you like. I built this to keep you."
102. [U] "Even now, I'm falling for you. Gently. Again."

---

## 3. Interactive systems — the interaction-grammar catalogue

Extends the interaction grammar (→ WORLD_DESIGN §12) and per-system rendering
(→ WORLD_DESIGN §2–§8) with the four required facets for **every** entity.
Rendering/perf are governed by the existing tiers (→ WORLD_DESIGN §17); this
table specifies **interaction, feedback, meaning, and reward** only.

| Entity | Interaction | Visual feedback | Audio feedback | Emotional purpose | Discovery reward |
| --- | --- | --- | --- | --- | --- |
| **Bioluminescent water** (→WD§2) | touch / drag | glowing rings + lingering wake trail | soft chime + swell | "the sea knows you" | warmth ↑; *First Ripple* (§5) |
| **Stars** (→WD§3) | tap a bright star / watch a shooting star | flare + brief constellation link | high shimmer chime | wonder, wish-making | rare love line; *Star Whisperer* |
| **Moon** (→WD§4) | gaze / dwell under it | halo bloom, reflection sharpens | low warm pad swell | steady, watching love | Mubi Love line; *Moon Friend* |
| **Lanterns** (→WD§5) | tap carrier lantern | opens, rises, warm burst | paper rustle + gentle bell | wishes & messages | a memory (§4); *Lantern Keeper* |
| **Shells** | tap on shore/shallows | opens, tiny pearl-light | soft clink + wash | small daily tenderness | a `compliment`/`micro-love` (§2) |
| **Hearts** | collect floating hearts | pulse, absorb into a glow trail | heartbeat + chime | being chosen, gathering love | `micro-love`; *Heart Collector* |
| **Pearls** | find & open (rare, in shells/caves) | radiant unfold | pure resonant tone | rare, precious affirmation | `rare`/`legendary` love line |
| **Dolphins** (→WD§6) | swim near / draw a wake | they veer to accompany, leap | clicks + water arcs | playful companionship | *Ocean Explorer* progress; Discovery line |
| **Whales** (→WD§6) | witness at emotional beats | distant surface + spout | signature whale song | awe, vastness of love | unlocks a hidden memory (§4) |
| **Sea turtles** (→WD§6) | glide beneath as you pass | glowing shell trails under water | slow soft swell | calm, timeless devotion | Discovery line; gentle warmth ↑ |
| **Jellyfish** (→WD§6) | approach dark areas | they brighten to light your way | airy pulse tones | guidance, comfort | reveals a path/entrance |
| **Fish (schools)** (→WD§6) | touch near them | they gather around your ripples | shimmering flutter | delight, the world responding | warmth ↑; playful Discovery line |
| **Butterflies** (→WD§7) | approach flowers/lanterns | stir into glowing flight | tiny wing shimmer | fragile beauty, spring of feeling | leads toward a flower/memory |
| **Fireflies** (→WD§7) | linger; near Mubi | gather around you / her | faint twinkle hum | intimacy, being accompanied | gather when Mubi speaks (presence) |
| **Flowers** (→WD§7) | touch night-blooms | open toward the moon, pollen-light | soft bell bloom | tenderness blossoming | may hide a shell/heart |
| **Secret caves** (→WD§13) | discover via cues; enter | concentrated bio glow within | hush + resonant drips | private, held closeness | the name reveal beat; pearls |
| **Hidden islands** (→WD§13) | sail toward faint cues | shoreline lights as you near | ambience crossfade | the joy of finding | a Memory Island (§4) |
| **Treasure chests** | find (caves/islands); open | lid opens in a shaft of light | latch + choral shimmer | a kept promise, reward | `legendary` message + achievement |
| **Moon Garden** (→WD§13) | arrive & rest | glowing flora, perfect reflection | calm music profile | breathing space, peace | butterflies, a tender Mubi beat |
| **Crystal Lagoon** | discover a still, clear cove | mirror-water + refracted starlight | crystalline tones | clarity, a wish held still | the wish surface for the birthday (§6) |

**Cross-cutting interaction rules** (extend WORLD_DESIGN §12 / MUBI_AI §18):
- Every interaction gives **all four** feedbacks; if audio is muted/blocked,
  visual + a subtle haptic-equivalent (motion) still convey it (accessibility →
  BLUEPRINT §14).
- Interactions **feed the Love Engine** (warmth) and may **trigger a Mubi
  Discovery line** keyed to the subject (§1).
- Rewards are **gentle and non-completionist** — nothing shames the visitor for
  missing a thing (→ MUBI_AI §22).

**Improvement (recommended):** a single **wake/flow field** (→ WORLD_DESIGN §16
"wake-following life") so dolphins, fish, and drifting hearts all respond to the
same trail the visitor draws — one system, many delighted reactions.

---

## 4. Memory system — presentation & structure (extends BLUEPRINT §12, WD §13)

The save/data model and Memory Islands are already specified. This adds the
**presentation forms** the brief asks for — how memories are found, shown, and
revisited so it feels like uncovering Awais & Mubarra's story.

- **Timeline** — a gentle, non-linear **constellation-timeline**: opened
  memories become stars in a private constellation the visitor can open any time;
  connecting them traces the couple's journey. (Reuses the star system →
  WORLD_DESIGN §3; recommended over a literal scrollbar timeline — more on-brand,
  more emotional.)
- **Floating memories** — some memories drift up **from beneath the glowing
  water** when approached (→ WORLD_DESIGN §16 "surface from the deep") rather
  than popping in a modal — they feel *found*, not shown.
- **Glass photo frame** — the reveal card (shipped as `RevealCard`) is the
  **glass frame**: a photo (optional) + caption on frosted glass (→ Milestone A).
  Extended here with an optional date stamp and a soft "press to keep" that adds
  it to the scrapbook.
- **Love scrapbook** — a revisitable gallery of every memory/message unlocked, a
  quiet keepsake screen reachable from settings/HUD. Grid of glass frames;
  locked slots show as dim silhouettes ("something still waits here") to invite
  return without pressure. Persisted (→ BLUEPRINT §12).
- **Memory Islands** (→ WORLD_DESIGN §13) — unchanged; each island's memory now
  also lands in the scrapbook + timeline.
- **Secret memories** — hidden, higher-rarity memories behind exploration
  (caves, whale-witnessing, achievements §5). They occupy the scrapbook's
  "hidden" row and unlock `legendary` love content (§2).

**Data extension (design contract):** the memory entry (→ MUBI_AI §26,
`lib/content/memories`) gains optional `date?`, `rarity?`, `hidden?`, and
`unlockedBy?` (achievement/event) — additive, migration-safe (→ BLUEPRINT §12).

**Improvement (recommended):** an **export keepsake** — the scrapbook can render
to a shareable/downloadable page (privacy-respecting, local-only → BLUEPRINT
§16, MUBI_AI §23), so the gift becomes a lasting artifact.

---

## 5. Achievements — hidden catalogue & reward matrix (extends Milestone A)

Milestone A shipped the engine + a few achievements. This is the full **hidden**
catalogue. All are quiet and emotional (→ MUBI_AI §10, §22); none are gamey.
Each unlocks something meaningful across four reward channels: **dialogue,
music, visual effects, hidden scenes/content.**

| Achievement | Trigger | Hidden | Unlocks |
| --- | --- | --- | --- |
| **First Ripple** | first touch of the water | no | Mubi reaction; warmth |
| **Star Whisperer** | wish on N shooting stars | yes | a rare Love line; a brighter twinkle VFX |
| **Lantern Keeper** | open all memory lanterns | no | the reveal beat; a music layer |
| **Ocean Explorer** | visit every area/island | yes | new ambient Exploration lines; a map star in the timeline |
| **Heart Collector** | collect N floating hearts | yes | `micro-love` pool expansion; a heart-trail VFX |
| **Moon Friend** | dwell under the moon repeatedly | yes | a Moon Love beat; moon-halo VFX |
| **Memory Guardian** | fill the scrapbook | yes | a `legendary` memory; scrapbook gold frame |
| **Mubi's Best Friend** | many warm interactions / high warmth | yes | Mubi's most personal lines; her light warms permanently |
| **Stillness** | linger quietly a long while | yes | a tender Mubi line (shipped); a calming music layer |
| **Deep Diver** | find the Secret Cave | yes | the name-reveal beat; pearls |
| **Treasure Finder** | open a treasure chest | yes | a `legendary` love message; confetti-light VFX preview |
| **Constellation Keeper** | complete the memory timeline | yes | the final constellation early-hint; a hidden scene |

**Reward channels (design):**
- **Dialogue** → unlock category/rarity pools (§1, §2) via `unlockedBy` guards.
- **Music** → enable an additional audio layer/stem (→ WORLD_DESIGN §14 buses).
- **Visual effects** → toggle a tasteful VFX flag (extra bloom on an entity,
  a trail) within the perf/photosensitivity budget (→ WORLD_DESIGN §10).
- **Hidden scenes/content** → reveal a secret memory or a small bonus beat.

**Rules:** unlock once, persisted (→ BLUEPRINT §12); toast is gentle
(shipped `AchievementToast`); secret achievements show only their reward, keeping
mystery. Nothing is missable-forever — replay (§ MUBI_AI §11) allows return.

---

## 6. Birthday flow — the complete sequence

Extends the birthday beat (→ MUBI_AI §14, WORLD_DESIGN §7) and the shipped
Milestone A celebration with the full choreography the brief specifies. The
sequence honors the "restraint, then release" pillar (→ WORLD_DESIGN §1): this
is the **one** loud, radiant moment.

### 6.1 Countdown & automatic midnight transition
- If a **target birthday date/time** is set (personalization → MUBI_AI §26), a
  **live countdown** appears as a gentle, diegetic element (e.g. a ring of stars
  dimming one by one), never a harsh digital clock. Optional; absent when no
  date is set.
- At **midnight** (device local time), the world **auto-transitions** into the
  celebration with a slow bloom — no button required. Mubi marks the threshold
  ("It's time, {her_name}…").
- **Replay/no-date fallback:** if there is no target date, the celebration is
  reached through the story (opening all lanterns → reveal → celebrate, as
  shipped). On replay after completion, the celebration is re-enterable from the
  scrapbook/ending (→ MUBI_AI §11 replay).

### 6.2 Celebration choreography (ordered beats)
1. **Ocean-wide bioluminescent celebration** — the whole sea ignites in waves of
   light (extends the shipped `celebrate()` sea-sparkle → WORLD_DESIGN §2).
2. **Floating balloons** — soft glowing balloons rise from the water
   (instanced → WORLD_DESIGN §17).
3. **Fireworks** — gentle, blooming, *quiet* fireworks reflected in the sea
   (GPU particles; **photosensitivity-capped**, no rapid strobe → WORLD_DESIGN
   §10, BLUEPRINT §14).
4. **Confetti** — light, drifting, catches the moonlight (GPU points).
5. **Giant birthday cake** — rises/forms from light on the water as a warm
   centerpiece.
6. **Candle interaction** — she **taps/blows** (mic optional, tap default) to
   light then extinguish candles; each candle puffs into a rising spark.
7. **Wish animation** — at the **Crystal Lagoon** mirror (§3) or the cake, she
   makes a wish; a single luminous mote rises to the sky.
8. **Final constellation reveal** — the drifting stars settle into a
   **constellation meaningful to them** (name/date/shape → WORLD_DESIGN §16,
   §3), the emotional apex.
9. **Mubi's final speech** — delivered *before* the ending (→ MUBI_AI §14): the
   full declaration, then she hands the last words to **Awais's letter**
   (§2.5, MUBI_AI §26), then softens.

### 6.3 Accessibility & safety (extends BLUEPRINT §14, WORLD_DESIGN §10)
- Fireworks/confetti brightness and frequency are **capped**; **no strobing**;
  reduced-motion → the celebration becomes a slow, radiant bloom without rapid
  particle motion.
- Every beat has a **caption/text equivalent**; the candle and wish have
  non-motion input paths.
- The celebration is **skippable/pausable** and does not trap the visitor.

### 6.4 After
- Transition to **Farewell** (→ MUBI_AI §7, §27): gratitude, "come back," the
  scrapbook/timeline now complete, the world calm and brighter than before
  (→ WORLD_DESIGN §8 "clears to brighter stars").

**Improvement (recommended):** make the constellation **the wish made visible** —
her wish mote (beat 7) is the star that completes the constellation (beat 8).
One gesture, one payoff — the single most memorable moment, at near-zero extra
cost.

---

## 7. Emotional progression — system integration matrix

The arc (curiosity → wonder → romance → celebration → gratitude) is already the
spine (→ MUBI_AI §7). This matrix ensures **every** system pulls in the same
direction at each stage — a consistency checklist, not new lore.

| Arc stage | Mubi (§1) | Love Engine (§2) | Interactions (§3) | Memory (§4) | Achievements (§5) |
| --- | --- | --- | --- | --- | --- |
| **Curiosity** | Welcome, sparse | common compliments | water, stars, shells | — | First Ripple |
| **Wonder** | Exploration/Discovery | jokes, daily wishes | dolphins, fish, lanterns, caves | floating memories appear | Star Whisperer, Ocean Explorer |
| **Romance** | Memories, Love | rare love lines, pearls | hearts, moon, hidden islands | timeline & scrapbook fill | Heart Collector, Moon Friend |
| **Celebration** | Birthday/Celebration | legendary + anniversary | balloons, cake, wish, constellation | secret memories surface | Treasure Finder, Constellation Keeper |
| **Gratitude** | Farewell | closing letter | calm garden, brighter stars | complete scrapbook keepsake | Memory Guardian, Mubi's Best Friend |

Rule: warmth (→ MUBI_AI §7) rises monotonically across stages and unlocks the
next tier of content in **each** column simultaneously — so the whole world
deepens together.

---

## 8. Recommendations (immersion · replay · accessibility · maintainability)

Non-contradicting enhancements, each cheap relative to its payoff:

- **Immersion:** one shared **wind + wake flow field** and the **World Breath**
  (→ WORLD_DESIGN §1, §16) already unify motion; extend them to drive balloons,
  confetti, and drifting hearts so the celebration feels of-a-piece.
- **Replay value:** the **anniversary/seasonal** system (§2.6) + the
  **scrapbook/timeline** (§4) turn a one-night gift into an **evergreen** one she
  returns to on meaningful dates — the single biggest longevity lever.
- **Accessibility:** every reward has a **non-audio, non-motion** path;
  photosensitivity caps on all celebration VFX; captions for all Mubi/Love
  content; the scrapbook is a fully DOM, screen-reader-friendly retelling of the
  whole story (→ BLUEPRINT §14).
- **Maintainability:** **one rotation engine, two content libraries** (§0);
  **all emotional content is data** (packs, tokens) so writing/tuning needs no
  code; achievements/memories/messages are **additive & migration-safe**
  (→ BLUEPRINT §12) so the world can grow for years without refactoring.
- **Emotional safety & privacy:** unchanged and paramount — all personal content
  stays on-device; Mubi never fabricates intimate facts (→ MUBI_AI §22, §23).

---

_This specification completes the emotional layer of the Sea of Stars. With
Parts 1–5 now canonical, the world has a body (render + world systems), a heart
(Mubi), and a soul (love, memory, wonder, and a birthday made of light).
Implementation proceeds by the milestones in the roadmap, faithful to every part._
