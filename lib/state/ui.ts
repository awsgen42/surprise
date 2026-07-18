import { create } from "zustand";

// Ephemeral UI state (not persisted) — the currently displayed reveal card
// (a memory or the birthday letter). Kept tiny and separate from domain state.

export type CardKind = "memory" | "letter";

export interface RevealCard {
  kind: CardKind;
  title?: string;
  body: string;
  image?: string;
}

interface UIState {
  activeCard: RevealCard | null;
  showCard: (card: RevealCard) => void;
  hideCard: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeCard: null,
  showCard: (card) => set({ activeCard: card }),
  hideCard: () => set({ activeCard: null }),
}));
