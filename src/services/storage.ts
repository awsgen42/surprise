import { createJSONStorage, type StateStorage } from "zustand/middleware";

// Versioned, fail-safe local persistence (Blueprint §12). All persisted stores
// share this adapter and version so save format evolves through one migration
// path. Writes never throw (private mode / quota); a corrupt read fails safe to
// a fresh state rather than crashing the experience.

export const SAVE_VERSION = 1;
export const SAVE_NAMESPACE = "sos";

const memoryFallback = new Map<string, string>();

const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return typeof localStorage !== "undefined"
        ? localStorage.getItem(name)
        : memoryFallback.get(name) ?? null;
    } catch {
      return memoryFallback.get(name) ?? null;
    }
  },
  setItem: (name, value) => {
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem(name, value);
      else memoryFallback.set(name, value);
    } catch {
      memoryFallback.set(name, value);
    }
  },
  removeItem: (name) => {
    try {
      if (typeof localStorage !== "undefined") localStorage.removeItem(name);
      else memoryFallback.delete(name);
    } catch {
      memoryFallback.delete(name);
    }
  },
};

export const persistStorage = createJSONStorage(() => safeStorage);

export const saveKey = (domain: string) => `${SAVE_NAMESPACE}:${domain}`;

/** Wipe the entire save (settings + progress + memories + achievements). */
export function resetSave() {
  for (const domain of [
    "settings",
    "progress",
    "collectibles",
    "achievements",
    "mubi",
    "love",
  ]) {
    safeStorage.removeItem(saveKey(domain));
  }
}
