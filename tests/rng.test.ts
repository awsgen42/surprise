import { describe, it, expect } from "vitest";
import { mulberry32, weightedPick, pick } from "@/ai/rng";

describe("mulberry32", () => {
  it("is deterministic for a given seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it("produces values in [0,1)", () => {
    const r = mulberry32(1);
    for (let i = 0; i < 100; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("weightedPick", () => {
  it("returns null for an empty or zero-weight set", () => {
    expect(weightedPick([])).toBeNull();
    expect(weightedPick([{ item: "x", weight: 0 }])).toBeNull();
  });

  it("respects weights deterministically with a seeded rng", () => {
    const rng = mulberry32(7);
    const items = [
      { item: "rare", weight: 1 },
      { item: "common", weight: 99 },
    ];
    const counts: Record<string, number> = { rare: 0, common: 0 };
    for (let i = 0; i < 1000; i++) counts[weightedPick(items, rng)!]++;
    expect(counts.common).toBeGreaterThan(counts.rare);
  });

  it("pick selects a member of the array", () => {
    const arr = ["a", "b", "c"];
    expect(arr).toContain(pick(arr, mulberry32(3)));
  });
});
