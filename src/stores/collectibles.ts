import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistStorage, saveKey, SAVE_VERSION } from "@/services/storage";

interface CollectiblesState {
  memoriesOpened: string[];
  lanternsOpened: string[];
  hearts: string[];
  openMemory: (id: string) => void;
  openLantern: (id: string) => void;
  addHeart: (id: string) => void;
  hasMemory: (id: string) => boolean;
}

export const useCollectiblesStore = create<CollectiblesState>()(
  persist(
    (set, get) => ({
      memoriesOpened: [],
      lanternsOpened: [],
      hearts: [],
      openMemory: (id) =>
        set((s) =>
          s.memoriesOpened.includes(id)
            ? s
            : { memoriesOpened: [...s.memoriesOpened, id] }
        ),
      openLantern: (id) =>
        set((s) =>
          s.lanternsOpened.includes(id)
            ? s
            : { lanternsOpened: [...s.lanternsOpened, id] }
        ),
      addHeart: (id) =>
        set((s) =>
          s.hearts.includes(id) ? s : { hearts: [...s.hearts, id] }
        ),
      hasMemory: (id) => get().memoriesOpened.includes(id),
    }),
    {
      name: saveKey("collectibles"),
      version: SAVE_VERSION,
      storage: persistStorage,
    }
  )
);
