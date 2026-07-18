import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistStorage, saveKey, SAVE_VERSION } from "@/lib/save/storage";
import type { MubiMood, MubiUtterance } from "@/lib/types";

// Mubi's live presence + her persisted memory of what she's already said
// (no-repeat, Mubi spec §9/§15). Only `spokenLineIds` persists; her live speech
// state resets each session.

interface MubiState {
  current: MubiUtterance | null;
  mood: MubiMood;
  speaking: boolean;
  spokenLineIds: string[];

  say: (u: MubiUtterance) => void;
  clear: () => void;
  markSpoken: (id: string) => void;
  hasSpoken: (id: string) => boolean;
}

export const useMubiStore = create<MubiState>()(
  persist(
    (set, get) => ({
      current: null,
      mood: "serene",
      speaking: false,
      spokenLineIds: [],
      say: (u) => set({ current: u, mood: u.mood, speaking: true }),
      clear: () => set({ current: null, speaking: false }),
      markSpoken: (id) =>
        set((s) =>
          s.spokenLineIds.includes(id)
            ? s
            : { spokenLineIds: [...s.spokenLineIds, id] }
        ),
      hasSpoken: (id) => get().spokenLineIds.includes(id),
    }),
    {
      name: saveKey("mubi"),
      version: SAVE_VERSION,
      storage: persistStorage,
      partialize: (s) => ({ spokenLineIds: s.spokenLineIds }),
    }
  )
);
