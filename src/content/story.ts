// The silent love story. Each beat drives both the on-screen poetry and the
// state of the living world. Timings are in seconds, relative to the moment
// the visitor chooses to "begin".

export type Beat = {
  id: string;
  /** Seconds from the start of the journey when this beat begins. */
  at: number;
  /** How long the line stays fully visible before fading. */
  hold: number;
  /** The poetry. Empty string = a silent, wordless moment. */
  line: string;
  /** Optional smaller line beneath the main one. */
  sub?: string;
  /** World phase this beat belongs to. */
  phase: "void" | "gather" | "words" | "voyage" | "sea";
};

export const NAME = "Mubarra";

export const STORY: Beat[] = [
  { id: "void", at: 0.0, hold: 2.4, line: "", phase: "void" },
  {
    id: "spark",
    at: 2.6,
    hold: 3.0,
    line: "In the beginning, there was only darkness…",
    phase: "gather",
  },
  {
    id: "gather",
    at: 6.2,
    hold: 3.2,
    line: "and then, a single light.",
    phase: "gather",
  },
  {
    id: "w1",
    at: 10.2,
    hold: 3.6,
    line: "Some stories are too beautiful for words…",
    phase: "words",
  },
  {
    id: "w2",
    at: 14.6,
    hold: 3.6,
    line: "Some hearts shine brighter than the stars…",
    phase: "words",
  },
  {
    id: "w3",
    at: 19.0,
    hold: 4.2,
    line: "Tonight, this entire ocean awakens for one special person…",
    phase: "words",
  },
  {
    id: "voyage",
    at: 24.0,
    hold: 3.2,
    line: "",
    sub: "",
    phase: "voyage",
  },
  {
    id: "arrive",
    at: 27.5,
    hold: 5.5,
    line: `Happy Birthday, ${NAME}.`,
    sub: "The Sea of Stars has been waiting for you.",
    phase: "sea",
  },
];

/** The last beat's end — after this, the world is free to explore. */
export const STORY_END =
  STORY[STORY.length - 1].at + STORY[STORY.length - 1].hold;

export function currentBeat(t: number): Beat | null {
  let active: Beat | null = null;
  for (const b of STORY) {
    if (t >= b.at && t <= b.at + b.hold) active = b;
  }
  return active;
}

/** Opacity envelope for a beat's text: fade in, hold, fade out. */
export function beatOpacity(beat: Beat, t: number): number {
  const local = t - beat.at;
  const fade = 1.1;
  if (local < 0) return 0;
  if (local < fade) return local / fade;
  if (local > beat.hold - fade) return Math.max(0, (beat.hold - local) / fade);
  return 1;
}

export function phaseAt(t: number): Beat["phase"] {
  let phase: Beat["phase"] = "void";
  for (const b of STORY) if (t >= b.at) phase = b.phase;
  return phase;
}
