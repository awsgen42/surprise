import type { MubiLine } from "@/lib/types";

// Mubi's content pack — authored dialogue as data (Mubi spec §6, §27). Lines are
// grouped by trigger; the selector filters by guards + mood and picks a
// randomized, no-repeat variant. Tokens like {her_name} are personalized.
//
// This pack covers the systems live in the current world (greeting, touch,
// lantern memories, the birthday reveal, ending) — the acts/scenes added in
// later milestones extend it without touching the engine.

export const MUBI_LINES: MubiLine[] = [
  // ---- Greetings (Mubi spec §11) -----------------------------------------
  {
    id: "greet.first",
    trigger: "greet",
    register: "greeting",
    mood: "serene",
    once: true,
    guards: { flagsNone: ["met_mubi"] },
    effects: { flags: ["met_mubi"], warmth: 0.03 },
    texts: [
      "Oh… you're here. I've been waiting.",
      "There you are, {her_name}. The sea kept a light on for you.",
    ],
    prompts: [
      { id: "who", label: "who are you?", toneTag: "curious", then: "ambient" },
    ],
  },
  {
    id: "greet.return-soon",
    trigger: "greet",
    register: "greeting",
    mood: "tender",
    guards: { flagsAll: ["met_mubi"], flagsNone: ["journey_complete"] },
    texts: [
      "You came back. I kept everything just as you left it.",
      "I hoped you'd return. The stars are glad too.",
    ],
  },
  {
    id: "greet.return-complete",
    trigger: "greet",
    register: "greeting",
    mood: "serene",
    guards: { flagsAll: ["journey_complete"] },
    texts: [
      "You came back. I knew you would. It's all still here — he'd be so glad.",
    ],
  },

  // ---- Ambient murmurs (Mubi spec §5) ------------------------------------
  {
    id: "amb.stay",
    trigger: "ambient",
    register: "ambient",
    mood: "serene",
    texts: [
      "Stay a while. There's no hurry here.",
      "The moon is watching you. Kindly.",
      "Every one of these lights is a small hello.",
      "Feel that? The whole sea is leaning toward you.",
    ],
  },
  {
    id: "amb.hint-lantern",
    trigger: "ambient",
    register: "ambient",
    mood: "curious",
    guards: { flagsNone: ["opened_first_lantern"] },
    texts: [
      "Some of those lanterns are carrying words. Touch one.",
      "See the warm lights drifting? They were left for you to find.",
    ],
  },

  // ---- Idle hint (Mubi spec §13) -----------------------------------------
  {
    id: "hint.explore",
    trigger: "idle-hint",
    register: "hint",
    mood: "tender",
    texts: [
      "There's something lovely out there… when you're ready.",
      "Touch the water. It remembers you.",
      "Follow the warm lights, love. They're showing you the way.",
    ],
  },

  // ---- Reactions (Mubi spec §10) -----------------------------------------
  {
    id: "react.first-ripple",
    trigger: "first-ripple",
    register: "reaction",
    mood: "tender",
    once: true,
    effects: { flags: ["touched_sea"] },
    texts: [
      "There. You see? The sea knows you now.",
      "It lights for you. It has always meant to.",
    ],
  },
  {
    id: "react.ripple",
    trigger: "ripple",
    register: "reaction",
    mood: "playful",
    weight: 0.5,
    texts: [
      "Again — I love watching it wake for you.",
      "Every touch, a little constellation.",
    ],
  },
  {
    id: "react.lantern-first",
    trigger: "lantern-open",
    register: "reaction",
    mood: "tender",
    guards: { flagsNone: ["opened_first_lantern"] },
    effects: { flags: ["opened_first_lantern"], revelation: 2 },
    texts: [
      "He wrote that, long before tonight. Read it slowly.",
      "Someone left that light for you — and the words inside it.",
    ],
  },
  {
    id: "react.lantern-more",
    trigger: "lantern-open",
    register: "reaction",
    mood: "tender",
    guards: { flagsAll: ["opened_first_lantern"] },
    texts: [
      "You're gathering him, piece by piece. Keep going.",
      "Another light, another truth kept safe for you.",
    ],
  },

  // ---- Birthday flow (Mubi spec §14) -------------------------------------
  {
    id: "beat.all-lanterns",
    trigger: "all-lanterns",
    register: "beat",
    mood: "tender",
    once: true,
    effects: { flags: ["name_revealed"], revelation: 4 },
    texts: [
      "You've found every light. I can tell you now — his name is {his_name}. " +
        "He built all of this. For you.",
    ],
    prompts: [
      { id: "why", label: "why?", toneTag: "moved", then: "celebrate-invite" },
      {
        id: "ready",
        label: "(just listen)",
        toneTag: "quiet",
        then: "celebrate-invite",
      },
    ],
  },
  {
    id: "beat.celebrate-invite",
    trigger: "celebrate-invite",
    register: "beat",
    mood: "tender",
    once: true,
    texts: [
      "Because words weren't enough for how much he loves you — so he made a " +
        "whole world to say it. Are you ready to see the rest?",
    ],
    prompts: [
      {
        id: "yes",
        label: "I'm ready ♡",
        toneTag: "joyful",
        then: "celebrate",
      },
    ],
  },
  {
    id: "beat.celebrate",
    trigger: "celebrate",
    register: "beat",
    mood: "joyful",
    once: true,
    effects: { flags: ["birthday_revealed"], revelation: 5, warmth: 0.3 },
    texts: [
      "He made every star for you, {her_name}. Happy birthday, my {pet_name}.",
    ],
    prompts: [
      {
        id: "letter",
        label: "read his words",
        toneTag: "tender",
        then: "letter",
      },
    ],
  },
  {
    id: "beat.letter",
    trigger: "letter",
    register: "beat",
    mood: "tender",
    once: true,
    texts: [
      "The last words shouldn't be mine. They're his. Listen…",
    ],
  },
  {
    id: "beat.ending",
    trigger: "ending",
    register: "beat",
    mood: "bittersweet",
    once: true,
    effects: { flags: ["journey_complete"] },
    texts: [
      "You carry all of it with you now — every star. You are, and always will " +
        "be, deeply loved. Goodnight, {her_name}.",
    ],
  },

  // ---- Easter egg (Mubi spec §12) ----------------------------------------
  {
    id: "egg.midnight",
    trigger: "midnight",
    register: "ambient",
    mood: "tender",
    once: true,
    weight: 1,
    texts: [
      "It's midnight, love. You should be dreaming — but I'm glad you're here " +
        "instead.",
    ],
  },
];
