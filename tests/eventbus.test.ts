import { describe, it, expect, vi } from "vitest";
import { EventBus } from "@/services/EventBus";

describe("EventBus", () => {
  it("delivers events to type subscribers", () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on("ripple", handler);
    bus.emit({ type: "ripple", first: true });
    bus.emit({ type: "lanternOpen", id: "l1" });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ type: "ripple", first: true });
  });

  it("delivers to onAny and supports unsubscribe", () => {
    const bus = new EventBus();
    const any = vi.fn();
    const off = bus.onAny(any);
    bus.emit({ type: "celebrate" });
    off();
    bus.emit({ type: "celebrate" });
    expect(any).toHaveBeenCalledTimes(1);
  });

  it("isolates a throwing handler from others", () => {
    const bus = new EventBus();
    const good = vi.fn();
    bus.on("achievement", () => {
      throw new Error("boom");
    });
    bus.on("achievement", good);
    expect(() => bus.emit({ type: "achievement", id: "x" })).not.toThrow();
    expect(good).toHaveBeenCalledOnce();
  });
});
