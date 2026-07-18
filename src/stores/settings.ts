import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistStorage, saveKey, SAVE_VERSION } from "@/services/storage";

interface SettingsState {
  muted: boolean;
  captions: boolean;
  highContrast: boolean;
  /** null = follow the OS prefers-reduced-motion; true/false = explicit override. */
  reducedMotionOverride: boolean | null;
  setMuted: (v: boolean) => void;
  setCaptions: (v: boolean) => void;
  setHighContrast: (v: boolean) => void;
  setReducedMotionOverride: (v: boolean | null) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      muted: false,
      captions: false,
      highContrast: false,
      reducedMotionOverride: null,
      setMuted: (v) => set({ muted: v }),
      setCaptions: (v) => set({ captions: v }),
      setHighContrast: (v) => set({ highContrast: v }),
      setReducedMotionOverride: (v) => set({ reducedMotionOverride: v }),
    }),
    {
      name: saveKey("settings"),
      version: SAVE_VERSION,
      storage: persistStorage,
    }
  )
);
