import { useAchievementsStore } from "@/lib/state/achievements";
import { ACHIEVEMENTS } from "./defs";
import type { AchievementDef } from "@/lib/types";

/** Award an achievement. Returns its definition if newly unlocked, else null. */
export function award(id: string): AchievementDef | null {
  const newly = useAchievementsStore.getState().unlock(id);
  return newly ? ACHIEVEMENTS[id] ?? null : null;
}
