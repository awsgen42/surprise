import type { Act } from "@/lib/types";

// The Love Engine's tunables. Warmth is a 0..1 measure of how much the world has
// "recognized" her — it never decreases, and it nudges the act forward while
// story flags handle the hard gates (revelation, celebration, farewell).

export const WARMTH = {
  ripple: 0.015,
  firstRipple: 0.05,
  lanternOpen: 0.12,
  dwellPerTick: 0.004, // per idle "breath" while she lingers peacefully
  memory: 0.1,
};

/** Warmth thresholds that softly advance the early acts. */
const WARMTH_ACTS: { at: number; act: Act }[] = [
  { at: 0.0, act: "arrival" },
  { at: 0.25, act: "wonder" },
  { at: 0.6, act: "memory" },
];

/**
 * Suggest an act from warmth, but never regress past a hard story flag.
 * Revelation / celebration / farewell are driven by explicit flags, not warmth.
 */
export function actForWarmth(
  warmth: number,
  flags: Record<string, true>
): Act {
  if (flags["journey_complete"]) return "farewell";
  if (flags["birthday_revealed"]) return "celebration";
  if (flags["name_revealed"]) return "revelation";
  let act: Act = "arrival";
  for (const t of WARMTH_ACTS) if (warmth >= t.at) act = t.act;
  return act;
}
