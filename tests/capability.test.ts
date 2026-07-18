import { describe, it, expect } from "vitest";
import { classifyFrom, type CapabilitySignals } from "@/services/Capability";

const base: CapabilitySignals = {
  ua: "Mozilla/5.0",
  devicePixelRatio: 1,
  coarsePointer: false,
  viewportWidth: 1440,
};

describe("classifyFrom", () => {
  it("classifies a desktop flagship as high", () => {
    expect(
      classifyFrom({ ...base, deviceMemory: 16, hardwareConcurrency: 12 })
    ).toBe("high");
  });

  it("classifies a modern Android as mid", () => {
    expect(
      classifyFrom({
        ...base,
        ua: "Android Mobile",
        coarsePointer: true,
        viewportWidth: 412,
        deviceMemory: 6,
        hardwareConcurrency: 8,
      })
    ).toBe("mid");
  });

  it("classifies a weak mobile as low", () => {
    expect(
      classifyFrom({
        ...base,
        ua: "Android Mobile",
        coarsePointer: true,
        viewportWidth: 360,
        deviceMemory: 3,
        hardwareConcurrency: 4,
      })
    ).toBe("low");
  });

  it("classifies a very weak device as potato", () => {
    expect(
      classifyFrom({ ...base, deviceMemory: 2, hardwareConcurrency: 2 })
    ).toBe("potato");
  });
});
