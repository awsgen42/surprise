import { describe, it, expect } from "vitest";
import { selectLine, type SelectContext } from "@/ai/selector";
import { mulberry32 } from "@/ai/rng";

const ctx = (over: Partial<SelectContext> = {}): SelectContext => ({
  act: "arrival",
  warmth: 0,
  revelation: 0,
  flags: {},
  hasSpoken: () => false,
  ...over,
});

describe("dialogue selector (guards + no-repeat)", () => {
  it("selects the first-visit greeting for a new visitor", () => {
    const line = selectLine("greet", ctx(), mulberry32(1));
    expect(line?.id).toBe("greet.first");
  });

  it("skips a once-line already spoken and honors flag guards", () => {
    const line = selectLine(
      "greet",
      ctx({
        flags: { met_mubi: true },
        hasSpoken: (id) => id === "greet.first",
      }),
      mulberry32(1)
    );
    expect(line?.id).toBe("greet.return-soon");
  });

  it("returns null when no line matches the trigger", () => {
    // no midnight line is authored twice; once spoken, none remain
    const line = selectLine(
      "midnight",
      ctx({ hasSpoken: () => true }),
      mulberry32(1)
    );
    expect(line).toBeNull();
  });

  it("respects revelation/flag guards for the reveal beat", () => {
    const line = selectLine("all-lanterns", ctx(), mulberry32(1));
    expect(line?.id).toBe("beat.all-lanterns");
  });
});
