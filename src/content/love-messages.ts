// The Love Message Library (a seed of the 100+ pack from the design). Content
// as data; Awais personalizes freely. Rarity biases how soon a message surfaces
// within a no-repeat cycle. Tokens (e.g. {her_name}) resolved via personalization.

export type LoveCategory =
  | "compliment"
  | "joke"
  | "daily-wish"
  | "encouragement"
  | "micro-love"
  | "special";

export type Rarity = "common" | "uncommon" | "rare" | "legendary";

export interface LoveMessage {
  id: string;
  category: LoveCategory;
  rarity: Rarity;
  text: string;
}

export const RARITY_WEIGHT: Record<Rarity, number> = {
  common: 1,
  uncommon: 0.6,
  rare: 0.28,
  legendary: 0.1,
};

export const LOVE_MESSAGES: LoveMessage[] = [
  // micro-love (hearts)
  { id: "ml-1", category: "micro-love", rarity: "common", text: "You. Always you." },
  { id: "ml-2", category: "micro-love", rarity: "common", text: "Still my favorite." },
  { id: "ml-3", category: "micro-love", rarity: "common", text: "Home is wherever you are." },
  { id: "ml-4", category: "micro-love", rarity: "common", text: "My whole heart. ♡" },
  { id: "ml-5", category: "micro-love", rarity: "common", text: "Every version of you." },
  { id: "ml-6", category: "micro-love", rarity: "uncommon", text: "I'd choose you again." },
  { id: "ml-7", category: "micro-love", rarity: "uncommon", text: "You, in every lifetime." },
  { id: "ml-8", category: "micro-love", rarity: "common", text: "Forever, and then more." },
  { id: "ml-9", category: "micro-love", rarity: "uncommon", text: "The best thing I ever did was find you." },
  { id: "ml-10", category: "micro-love", rarity: "common", text: "My person." },
  { id: "ml-11", category: "micro-love", rarity: "rare", text: "You are the wish and the star." },
  { id: "ml-12", category: "micro-love", rarity: "common", text: "Come here. Stay." },
  // compliments
  { id: "co-1", category: "compliment", rarity: "common", text: "Your smile could out-shine this whole ocean." },
  { id: "co-2", category: "compliment", rarity: "common", text: "You make ordinary moments feel like magic." },
  { id: "co-3", category: "compliment", rarity: "common", text: "The stars are just practicing to be as bright as you." },
  { id: "co-4", category: "compliment", rarity: "uncommon", text: "If kindness had a face, it would try to look like yours." },
  { id: "co-5", category: "compliment", rarity: "rare", text: "Loving you is the easiest thing I have ever done." },
  { id: "co-6", category: "compliment", rarity: "rare", text: "You are my favorite star in a sky full of them." },
  // cute jokes
  { id: "jk-1", category: "joke", rarity: "common", text: "Are you a bioluminescent wave? You light up when I'm around. 🌊" },
  { id: "jk-2", category: "joke", rarity: "common", text: "I asked the sea for treasure. It handed me a photo of you." },
  { id: "jk-3", category: "joke", rarity: "uncommon", text: "You must be a jellyfish — glowing, and you took my heart. 🪼" },
  { id: "jk-4", category: "joke", rarity: "common", text: "Whale, whale, whale… look who lit up the whole ocean. 🐳" },
  // daily wishes
  { id: "dw-1", category: "daily-wish", rarity: "common", text: "Good morning, my love. May today be gentle with you." },
  { id: "dw-2", category: "daily-wish", rarity: "common", text: "However today goes, you are already enough." },
  { id: "dw-3", category: "daily-wish", rarity: "common", text: "I hope something small makes you smile today." },
  { id: "dw-4", category: "daily-wish", rarity: "uncommon", text: "Somewhere, always, someone is grateful you exist. (It's me.)" },
  // encouragement
  { id: "en-1", category: "encouragement", rarity: "common", text: "You've survived every hard day so far. A perfect record." },
  { id: "en-2", category: "encouragement", rarity: "common", text: "Rest is not quitting. Breathe." },
  { id: "en-3", category: "encouragement", rarity: "uncommon", text: "Storms end. You are the sky, not the weather." },
  { id: "en-4", category: "encouragement", rarity: "rare", text: "Whatever happens, you will not face it alone. Ever." },
  // special (rare/legendary)
  { id: "sp-1", category: "special", rarity: "rare", text: "You are the reason he learned the names of the stars." },
  { id: "sp-2", category: "special", rarity: "legendary", text: "You are my ordinary miracle." },
  { id: "sp-3", category: "special", rarity: "legendary", text: "Of all the lights in all the skies — you." },
];
