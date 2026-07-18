import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistStorage, saveKey, SAVE_VERSION } from "@/services/storage";
import type { Act } from "@/types";
import { actForWarmth } from "@/love/love";

// Progress + the Love Engine. `warmth` (0..1) is the heart of the world's
// recognition of her; it rises with interaction, discovery and dwell, and gates
// Mubi's act, mood and revelation.

interface ProgressState {
  act: Act;
  warmth: number;
  revelation: number; // 0..5 (Mubi spec §4)
  flags: Record<string, true>;
  firstVisitAt: number;
  lastVisitAt: number;
  visitCount: number;
  journeyComplete: boolean;

  addWarmth: (amount: number) => void;
  setFlag: (flag: string) => void;
  hasFlag: (flag: string) => boolean;
  setAct: (act: Act) => void;
  setRevelation: (level: number) => void;
  completeJourney: () => void;
  registerVisit: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      act: "arrival",
      warmth: 0,
      revelation: 0,
      flags: {},
      firstVisitAt: 0,
      lastVisitAt: 0,
      visitCount: 0,
      journeyComplete: false,

      addWarmth: (amount) => {
        const warmth = Math.min(1, Math.max(0, get().warmth + amount));
        // warmth can gently carry the act forward, never backward
        const suggested = actForWarmth(warmth, get().flags);
        set({ warmth, act: suggested });
      },
      setFlag: (flag) => set({ flags: { ...get().flags, [flag]: true } }),
      hasFlag: (flag) => !!get().flags[flag],
      setAct: (act) => set({ act }),
      setRevelation: (level) =>
        set({ revelation: Math.max(get().revelation, level) }),
      completeJourney: () => set({ journeyComplete: true, act: "farewell" }),
      registerVisit: () => {
        const now = Date.now();
        const s = get();
        set({
          firstVisitAt: s.firstVisitAt || now,
          lastVisitAt: now,
          visitCount: s.visitCount + 1,
        });
      },
    }),
    {
      name: saveKey("progress"),
      version: SAVE_VERSION,
      storage: persistStorage,
      // live-only fields excluded from persistence are none here; all persist
    }
  )
);
