import type { MemoryEntry } from "@/types";

// The memories carried by the floating lanterns. Placeholder captions written in
// Mubi's/Awais's voice; Awais replaces these (and can add images) to make the
// gift personal. Kept local — never transmitted (privacy §23).

export const MEMORIES: MemoryEntry[] = [
  {
    id: "mem-1",
    caption:
      "The first time you laughed at something I said, I decided I would spend " +
      "my life trying to hear it again.",
  },
  {
    id: "mem-2",
    caption:
      "You make ordinary days feel like they were worth waking up for. " +
      "That is not a small thing. It is everything.",
  },
  {
    id: "mem-3",
    caption:
      "If I could give you the real sea of stars, I would. Until then, let this " +
      "one remind you how loved you are.",
  },
];

export function memoryById(id: string): MemoryEntry | undefined {
  return MEMORIES.find((m) => m.id === id);
}
