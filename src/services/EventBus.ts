import type { WorldEvent, WorldEventType } from "@/types";

// A tiny, typed, fire-and-forget event bus (Master Plan §4). It is the single
// decoupling channel between render systems (producers) and logic systems
// (consumers): producers emit `WorldEvent`s; consumers subscribe by type or to
// all events. It holds no state and runs outside React.

type Handler<T extends WorldEvent = WorldEvent> = (event: T) => void;

export class EventBus {
  private byType = new Map<WorldEventType, Set<Handler>>();
  private all = new Set<Handler>();

  /** Subscribe to one event type. Returns an unsubscribe function. */
  on<T extends WorldEventType>(
    type: T,
    handler: (event: Extract<WorldEvent, { type: T }>) => void
  ): () => void {
    let set = this.byType.get(type);
    if (!set) {
      set = new Set();
      this.byType.set(type, set);
    }
    set.add(handler as Handler);
    return () => set!.delete(handler as Handler);
  }

  /** Subscribe to every event. Returns an unsubscribe function. */
  onAny(handler: Handler): () => void {
    this.all.add(handler);
    return () => this.all.delete(handler);
  }

  /** Emit an event to all matching subscribers. Never throws to the emitter. */
  emit(event: WorldEvent): void {
    const set = this.byType.get(event.type);
    if (set) for (const h of set) safe(h, event);
    for (const h of this.all) safe(h, event);
  }

  clear(): void {
    this.byType.clear();
    this.all.clear();
  }
}

function safe(handler: Handler, event: WorldEvent) {
  try {
    handler(event);
  } catch (err) {
    // a broken consumer must never break the producer or other consumers
    console.error("[EventBus] handler error", err);
  }
}

/** The app-wide bus instance (imported where world events cross systems). */
export const worldBus = new EventBus();
