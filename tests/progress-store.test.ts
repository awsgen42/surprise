// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { useProgressStore } from "@/stores/progress";
import { resetSave } from "@/services/storage";

describe("progress store + Love Engine warmth (persisted)", () => {
  beforeEach(() => {
    resetSave();
    useProgressStore.setState({
      act: "arrival",
      warmth: 0,
      revelation: 0,
      flags: {},
    });
  });

  it("accumulates warmth and advances the act", () => {
    const s = useProgressStore.getState();
    s.addWarmth(0.3);
    expect(useProgressStore.getState().warmth).toBeCloseTo(0.3);
    expect(useProgressStore.getState().act).toBe("wonder");
  });

  it("clamps warmth to [0,1]", () => {
    useProgressStore.getState().addWarmth(5);
    expect(useProgressStore.getState().warmth).toBe(1);
  });

  it("sets flags and reflects them in act derivation", () => {
    useProgressStore.getState().setFlag("birthday_revealed");
    useProgressStore.getState().addWarmth(0.01);
    expect(useProgressStore.getState().act).toBe("celebration");
  });

  it("persists warmth to storage", () => {
    useProgressStore.getState().addWarmth(0.5);
    const raw = localStorage.getItem("sos:progress");
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!).state.warmth).toBeCloseTo(0.5);
  });
});
