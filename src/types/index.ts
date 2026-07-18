// Shared domain types for the emotional-core systems (render-agnostic).

export type MubiMood =
  | "serene"
  | "curious"
  | "playful"
  | "tender"
  | "awe"
  | "joyful"
  | "bittersweet";

/** The six acts of the emotional progression (Mubi spec §7). */
export type Act =
  | "arrival"
  | "wonder"
  | "memory"
  | "revelation"
  | "celebration"
  | "farewell";

export const ACT_ORDER: Act[] = [
  "arrival",
  "wonder",
  "memory",
  "revelation",
  "celebration",
  "farewell",
];

/** Speech registers (Mubi spec §6). */
export type Register = "ambient" | "beat" | "reaction" | "greeting" | "hint";

/** A single line of Mubi dialogue — a content contract, authored as data. */
export interface MubiLine {
  id: string;
  /** What causes this line to be considered. */
  trigger: MubiTrigger;
  register: Register;
  mood: MubiMood;
  /** Randomized phrasings; the engine picks one. Tokens like {her_name}. */
  texts: string[];
  guards?: LineGuards;
  /** Fire at most once ever (persisted). */
  once?: boolean;
  effects?: LineEffects;
  /** Optional soft, ignorable responses. */
  prompts?: MubiPrompt[];
  /** Lower weight = rarer (hidden lines). Default 1. */
  weight?: number;
}

export interface LineGuards {
  actIn?: Act[];
  flagsAll?: string[];
  flagsNone?: string[];
  minWarmth?: number;
  minRevelation?: number;
}

export interface LineEffects {
  flags?: string[];
  warmth?: number;
  revelation?: number;
  act?: Act;
}

export interface MubiPrompt {
  id: string;
  label: string;
  toneTag: string;
  /** Optional trigger to fire when chosen. */
  then?: MubiTrigger;
}

export type MubiTrigger =
  | "greet"
  | "ambient"
  | "idle-hint"
  | "first-ripple"
  | "ripple"
  | "lantern-open"
  | "all-lanterns"
  | "celebrate-invite"
  | "celebrate"
  | "letter"
  | "ending"
  | "midnight" // easter egg
  | `achievement:${string}`;

/** A resolved line ready for the UI. */
export interface MubiUtterance {
  lineId: string;
  text: string;
  mood: MubiMood;
  prompts?: MubiPrompt[];
}

export interface MemoryEntry {
  id: string;
  /** Caption / message — personalization tokens allowed. */
  caption: string;
  /** Optional image path (public/). Falls back to a generated glow card. */
  image?: string;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  secret?: boolean;
}

/**
 * Fire-and-forget world events (Master Plan §4 — the typed event bus channel).
 * Producers (render systems) emit; consumers (Mubi, achievements, Love, audio,
 * birthday) subscribe — keeping systems loosely coupled.
 */
export type WorldEvent =
  | { type: "ripple"; first: boolean; x?: number; z?: number }
  | { type: "lanternOpen"; id: string }
  | { type: "sceneEnter"; scene: string }
  | { type: "sceneExit"; scene: string }
  | { type: "creatureSighting"; kind: string }
  | { type: "memoryOpened"; id: string }
  | { type: "achievement"; id: string }
  | { type: "celebrate" };

export type WorldEventType = WorldEvent["type"];

/** Device capability tiers (Blueprint §17). */
export type QualityTier = "high" | "mid" | "low" | "potato";
