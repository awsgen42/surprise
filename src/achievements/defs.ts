import type { AchievementDef } from "@/types";

// Quiet, emotional milestones — never gamified badges. Each has an in-character
// Mubi reaction (fired via the controller) and a gentle toast.

export const ACHIEVEMENTS: Record<string, AchievementDef> = {
  "met-mubi": {
    id: "met-mubi",
    title: "A companion in the dark",
    description: "You met Mubi.",
  },
  "first-touch": {
    id: "first-touch",
    title: "The sea remembers",
    description: "You touched the water for the first time.",
  },
  "first-lantern": {
    id: "first-lantern",
    title: "A light with words inside",
    description: "You opened your first memory lantern.",
  },
  collector: {
    id: "collector",
    title: "Every piece of him",
    description: "You opened every memory lantern.",
  },
  "heart-collector": {
    id: "heart-collector",
    title: "Heart Collector",
    description: "You gathered the hearts drifting on the sea.",
    secret: true,
  },
  "the-truth": {
    id: "the-truth",
    title: "Made for you",
    description: "You learned who made this world, and why.",
  },
  stargazer: {
    id: "stargazer",
    title: "Stillness",
    description: "You stayed a long, quiet while under the stars.",
    secret: true,
  },
};

export function achievementById(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS[id];
}
