import { describe, it, expect } from "vitest";
import { actForWarmth } from "@/love/love";

describe("actForWarmth (Love Engine act derivation)", () => {
  it("advances acts with warmth", () => {
    expect(actForWarmth(0, {})).toBe("arrival");
    expect(actForWarmth(0.3, {})).toBe("wonder");
    expect(actForWarmth(0.7, {})).toBe("memory");
  });

  it("never regresses past a hard story flag", () => {
    expect(actForWarmth(0, { name_revealed: true })).toBe("revelation");
    expect(actForWarmth(0, { birthday_revealed: true })).toBe("celebration");
    expect(actForWarmth(0.9, { journey_complete: true })).toBe("farewell");
  });

  it("prioritizes the furthest flag", () => {
    expect(
      actForWarmth(0.1, { name_revealed: true, birthday_revealed: true })
    ).toBe("celebration");
  });
});
