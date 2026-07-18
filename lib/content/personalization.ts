// Personalization tokens (Mubi spec §26). Mubi's soul is generic; her specifics
// come from a private content pack Awais fills in. Empty tokens fall back
// gracefully — Mubi NEVER fabricates intimate facts. To make this gift personal,
// edit the values below (kept local; never sent anywhere — privacy §23).

export interface Personalization {
  her_name: string;
  his_name: string;
  pet_name: string;
  /** His birthday letter, delivered at the celebration. */
  the_letter: string;
  /** His closing message at the ending. */
  final_words: string;
}

export const personalization: Personalization = {
  her_name: "Mubarra",
  his_name: "Awais",
  pet_name: "my love",
  the_letter:
    "Mubarra — I couldn't fit what you mean to me into words, so I built you " +
    "a sky instead. Every star here is a night I spent grateful for you. " +
    "Happy birthday. I love you, always. — Awais",
  final_words:
    "Wherever you go, you carry this ocean with you now. And you carry me. " +
    "Happy birthday, my love.",
};

const TOKEN = /\{(\w+)\}/g;

/** Replace {tokens} in a line with personalization values (safe fallback). */
export function fill(
  text: string,
  p: Personalization = personalization
): string {
  return text.replace(TOKEN, (_, key: string) => {
    const v = (p as unknown as Record<string, string>)[key];
    return v && v.trim().length > 0 ? v : fallbackFor(key);
  });
}

function fallbackFor(key: string): string {
  switch (key) {
    case "her_name":
      return "my dear";
    case "his_name":
      return "someone who loves you";
    case "pet_name":
      return "my love";
    default:
      return "";
  }
}
