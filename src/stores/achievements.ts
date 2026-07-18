import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistStorage, saveKey, SAVE_VERSION } from "@/services/storage";

interface AchievementsState {
  unlocked: string[];
  /** Transient: the most recent newly-unlocked id (drives the toast). */
  lastUnlocked: { id: string; at: number } | null;
  /** Returns true if this call newly unlocked the achievement. */
  unlock: (id: string) => boolean;
  has: (id: string) => boolean;
}

export const useAchievementsStore = create<AchievementsState>()(
  persist(
    (set, get) => ({
      unlocked: [],
      lastUnlocked: null,
      unlock: (id) => {
        if (get().unlocked.includes(id)) return false;
        set((s) => ({
          unlocked: [...s.unlocked, id],
          lastUnlocked: { id, at: Date.now() },
        }));
        return true;
      },
      has: (id) => get().unlocked.includes(id),
    }),
    {
      name: saveKey("achievements"),
      version: SAVE_VERSION,
      storage: persistStorage,
      // only the unlocked set persists; lastUnlocked is a live toast signal
      partialize: (s) => ({ unlocked: s.unlocked }),
    }
  )
);
