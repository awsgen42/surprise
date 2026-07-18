import { MUBI_LINES } from "./content";
import type { Act, MubiLine, MubiTrigger } from "@/types";
import { fill } from "@/content/personalization";
import { weightedPick, pick, type Rng, defaultRng } from "./rng";

export interface SelectContext {
  act: Act;
  warmth: number;
  revelation: number;
  flags: Record<string, true>;
  hasSpoken: (id: string) => boolean;
}

function guardsPass(line: MubiLine, ctx: SelectContext): boolean {
  const g = line.guards;
  if (!g) return true;
  if (g.actIn && !g.actIn.includes(ctx.act)) return false;
  if (g.minWarmth != null && ctx.warmth < g.minWarmth) return false;
  if (g.minRevelation != null && ctx.revelation < g.minRevelation) return false;
  if (g.flagsAll && !g.flagsAll.every((f) => ctx.flags[f])) return false;
  if (g.flagsNone && g.flagsNone.some((f) => ctx.flags[f])) return false;
  return true;
}

/** Pick the best line for a trigger given context (weighted, no-repeat). */
export function selectLine(
  trigger: MubiTrigger,
  ctx: SelectContext,
  rng: Rng = defaultRng
): MubiLine | null {
  const candidates = MUBI_LINES.filter(
    (l) =>
      l.trigger === trigger &&
      guardsPass(l, ctx) &&
      !(l.once && ctx.hasSpoken(l.id))
  );
  if (candidates.length === 0) return null;
  // deprioritise already-spoken (non-once) lines so pools rotate
  const weighted = candidates.map((l) => ({
    item: l,
    weight: (l.weight ?? 1) * (ctx.hasSpoken(l.id) ? 0.2 : 1),
  }));
  return weightedPick(weighted, rng);
}

/** Resolve a randomized, personalized text variant for a line. */
export function resolveText(line: MubiLine, rng: Rng = defaultRng): string {
  return fill(pick(line.texts, rng));
}
