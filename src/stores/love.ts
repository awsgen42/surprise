import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistStorage, saveKey, SAVE_VERSION } from "@/services/storage";

// The Love Engine's "seen" ledger — powers no-repeat-until-exhausted rotation
// of the Love Message Library across sessions (Emotional Systems §2.2).

interface LoveState {
  seen: string[];
  collected: string[]; // message ids kept in the scrapbook
  markSeen: (id: string) => void;
  keep: (id: string) => void;
  clearSeen: (ids: string[]) => void;
}

export const useLoveStore = create<LoveState>()(
  persist(
    (set) => ({
      seen: [],
      collected: [],
      markSeen: (id) =>
        set((s) => (s.seen.includes(id) ? s : { seen: [...s.seen, id] })),
      keep: (id) =>
        set((s) =>
          s.collected.includes(id) ? s : { collected: [...s.collected, id] }
        ),
      clearSeen: (ids) =>
        set((s) => ({ seen: s.seen.filter((x) => !ids.includes(x)) })),
    }),
    { name: saveKey("love"), version: SAVE_VERSION, storage: persistStorage }
  )
);
