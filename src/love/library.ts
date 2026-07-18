import {
  LOVE_MESSAGES,
  RARITY_WEIGHT,
  type LoveCategory,
  type LoveMessage,
} from "@/content/love-messages";
import { useLoveStore } from "@/stores/love";
import { weightedPick, defaultRng, type Rng } from "@/ai/rng";
import { fill } from "@/content/personalization";

// No-repeat-until-exhausted rotation with rarity weighting (Emotional Systems
// §2.2/§2.3). Draws only from unseen messages in the requested category; when a
// category's unseen pool empties, its seen marks are cleared so every message is
// shown once before any repeats.

export interface DrawnMessage {
  id: string;
  text: string; // personalized
  raw: LoveMessage;
}

export function drawLoveMessage(
  category?: LoveCategory,
  rng: Rng = defaultRng
): DrawnMessage | null {
  const store = useLoveStore.getState();
  const pool = LOVE_MESSAGES.filter(
    (m) => !category || m.category === category
  );
  if (pool.length === 0) return null;

  let unseen = pool.filter((m) => !store.seen.includes(m.id));
  if (unseen.length === 0) {
    // exhausted this category — reshuffle by clearing its seen marks
    store.clearSeen(pool.map((m) => m.id));
    unseen = pool;
  }

  const chosen = weightedPick(
    unseen.map((m) => ({ item: m, weight: RARITY_WEIGHT[m.rarity] })),
    rng
  );
  if (!chosen) return null;

  store.markSeen(chosen.id);
  return { id: chosen.id, text: fill(chosen.text), raw: chosen };
}
