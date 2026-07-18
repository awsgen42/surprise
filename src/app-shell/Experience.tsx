"use client";

import { useEffect, useRef, useState } from "react";
import WorldCanvas from "@/app-shell/WorldCanvas";
import type { WorldEngine, WorldOptions } from "@/world/World";
import { Ambient } from "@/audio/ambient";
import { NAME, STORY_END } from "@/content/story";
import StoryOverlay from "@/ui/StoryOverlay";
import StartGate from "@/ui/StartGate";
import MubiDialogue from "@/ui/MubiDialogue";
import AchievementToast from "@/ui/AchievementToast";
import RevealCard from "@/ui/RevealCard";
import SettingsMenu from "@/ui/SettingsMenu";

import { useProgressStore } from "@/stores/progress";
import { useMubiStore } from "@/stores/mubi";
import { useCollectiblesStore } from "@/stores/collectibles";
import { useSettingsStore } from "@/stores/settings";
import { useUIStore, type RevealCard as Card } from "@/stores/ui";
import { speak } from "@/ai/mubi";
import { award } from "@/achievements/engine";
import { WARMTH } from "@/love/love";
import { MEMORIES, memoryById } from "@/content/memories";
import { personalization, fill } from "@/content/personalization";

const CARRIER_COUNT = MEMORIES.length;
const IDLE_MS = 23000;
const AMBIENT_COOLDOWN_MS = 21000;
const STARGAZER_MS = 42000;

export default function Experience() {
  const worldRef = useRef<WorldEngine | null>(null);
  const ambientRef = useRef<Ambient | null>(null);
  const timeRef = useRef<number>(0);

  const [showUI, setShowUI] = useState(false);
  const muted = useSettingsStore((s) => s.muted);
  const setMuted = useSettingsStore((s) => s.setMuted);

  // journey/idle bookkeeping
  const begunRef = useRef(false);
  const greetedRef = useRef(false);
  const lastInteractRef = useRef(0);
  const lastAmbientRef = useRef(0);
  const stargazerRef = useRef(false);
  const ambientToggleRef = useRef(false);
  const celebratedRef = useRef(false);
  const letterShownRef = useRef(false);
  const allLanternsRef = useRef(false);
  const pendingBeginRef = useRef(false);

  const touch = () => {
    lastInteractRef.current = performance.now();
  };

  // Stable world options (created once) — the WorldEngine adopts these when the
  // R3F Canvas is ready. Callbacks read stores/refs, so a single capture is safe.
  const optsRef = useRef<WorldOptions | null>(null);
  if (!optsRef.current) {
    optsRef.current = {
      name: NAME,
      onTick: (t) => {
        timeRef.current = t;
        tick(t);
      },
      onArrive: () => setShowUI(true),
      onRipple: (first) => onRipple(first),
      onLanternTap: (id) => onLanternTap(id),
    };
  }

  const handleReady = (engine: WorldEngine) => {
    worldRef.current = engine;
    // if the visitor tapped "begin" before the engine finished initializing,
    // start the journey now
    if (pendingBeginRef.current) {
      pendingBeginRef.current = false;
      startJourney();
    }
  };

  /* --------------------- lifecycle: subscriptions --------------------- */
  useEffect(() => {
    useProgressStore.getState().registerVisit();

    // dev-only hooks for automated verification (query-param gated)
    if (new URLSearchParams(window.location.search).has("debug")) {
      (window as unknown as Record<string, unknown>).__sos = {
        speak,
        award,
        simLantern: (id: string) => onLanternTap(id),
        state: () => ({
          progress: useProgressStore.getState(),
          collectibles: useCollectiblesStore.getState(),
          mubi: useMubiStore.getState(),
        }),
      };
    }

    const onAnyPointer = () => touch();
    window.addEventListener("pointerdown", onAnyPointer, { passive: true });

    // celebration FX when the reveal lands
    const unsubProgress = useProgressStore.subscribe((s) => {
      if (s.flags["birthday_revealed"] && !celebratedRef.current) {
        celebratedRef.current = true;
        worldRef.current?.celebrate();
        ambientRef.current?.bloom();
        award("the-truth");
      }
    });

    // show the letter card when Mubi hands the moment to Awais
    const unsubMubi = useMubiStore.subscribe((s) => {
      if (s.current?.lineId === "beat.letter" && !letterShownRef.current) {
        letterShownRef.current = true;
        useUIStore.getState().showCard({
          kind: "letter",
          body: personalization.the_letter,
        });
      }
    });

    return () => {
      window.removeEventListener("pointerdown", onAnyPointer);
      unsubProgress();
      unsubMubi();
      ambientRef.current?.dispose();
      // the WorldEngine is disposed by WorldScene on unmount
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --------------------------- per-frame ------------------------------ */
  const tick = (t: number) => {
    if (!begunRef.current) return;

    // Mubi awakens once the scripted prologue has resolved
    if (!greetedRef.current && t > STORY_END + 1) {
      greetedRef.current = true;
      lastInteractRef.current = performance.now();
      lastAmbientRef.current = performance.now();
      speak("greet");
      // midnight easter egg, gently, a little after the welcome
      if (new Date().getHours() === 0) {
        window.setTimeout(() => {
          if (!useMubiStore.getState().speaking) speak("midnight");
        }, 9000);
      }
      return;
    }
    if (!greetedRef.current) return;

    const now = performance.now();
    const idle = now - lastInteractRef.current;
    const speaking = useMubiStore.getState().speaking;
    const complete = useProgressStore.getState().flags["journey_complete"];

    // gentle stillness reward
    if (!stargazerRef.current && idle > STARGAZER_MS && !speaking) {
      stargazerRef.current = true;
      award("stargazer");
      useProgressStore.getState().addWarmth(WARMTH.dwellPerTick * 6);
    }

    // adaptive idle murmur / hint (not during the finale)
    if (
      !complete &&
      !speaking &&
      idle > IDLE_MS &&
      now - lastAmbientRef.current > AMBIENT_COOLDOWN_MS
    ) {
      lastAmbientRef.current = now;
      ambientToggleRef.current = !ambientToggleRef.current;
      speak(ambientToggleRef.current ? "idle-hint" : "ambient");
    }
  };

  /* ------------------------- event handlers --------------------------- */
  const onRipple = (first: boolean) => {
    touch();
    const p = useProgressStore.getState();
    p.addWarmth(first ? WARMTH.firstRipple : WARMTH.ripple);
    if (first) {
      award("first-touch");
      speak("first-ripple");
    } else if (!useMubiStore.getState().speaking && Math.random() < 0.12) {
      speak("ripple");
    }
  };

  const onLanternTap = (id: string) => {
    touch();
    const c = useCollectiblesStore.getState();
    c.openLantern(id);
    const idx = Math.max(0, parseInt(id.split("-")[1] || "1", 10) - 1);
    const mem = MEMORIES[idx] ?? MEMORIES[0];
    c.openMemory(mem.id);
    useProgressStore.getState().addWarmth(WARMTH.lanternOpen);
    award("first-lantern");
    // show the memory the lantern carried; Mubi reflects when it's closed
    useUIStore.getState().showCard({
      kind: "memory",
      body: fill(memoryById(mem.id)?.caption ?? mem.caption),
    });
  };

  const onCardClose = (card: Card) => {
    if (card.kind === "memory") {
      speak("lantern-open");
      const opened = useCollectiblesStore.getState().lanternsOpened.length;
      if (opened >= CARRIER_COUNT && !allLanternsRef.current) {
        allLanternsRef.current = true;
        award("collector");
        // let the reflection breathe, then reveal the truth
        window.setTimeout(() => speak("all-lanterns"), 5200);
      }
    } else if (card.kind === "letter") {
      window.setTimeout(() => speak("ending"), 800);
    }
  };

  /* ------------------------------ begin ------------------------------- */
  // The gate is always visible immediately; if it's tapped before the WebGL
  // engine is ready, we queue and start the journey the moment it arrives.
  const startJourney = async () => {
    const world = worldRef.current;
    if (!world) {
      pendingBeginRef.current = true;
      return;
    }
    if (begunRef.current) return;
    await world.enableTilt();
    world.begin();
    begunRef.current = true;

    const amb = new Ambient();
    ambientRef.current = amb;
    try {
      await amb.start();
      amb.setMuted(useSettingsStore.getState().muted);
    } catch {
      /* audio blocked — visuals carry on */
    }
    window.setTimeout(() => ambientRef.current?.bloom(), 27000);
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    ambientRef.current?.setMuted(next);
  };

  return (
    <main style={styles.main}>
      <div style={styles.canvasHost}>
        <WorldCanvas opts={optsRef.current} onReady={handleReady} />
      </div>
      <div style={styles.vignette} className="no-select" />

      <StoryOverlay timeRef={timeRef} />
      <MubiDialogue />
      <AchievementToast />
      <RevealCard onClose={onCardClose} />

      <StartGate onBegin={startJourney} />

      <div
        style={{
          ...styles.controls,
          opacity: showUI ? 1 : 0,
          pointerEvents: showUI ? "auto" : "none",
        }}
      >
        <button
          onClick={toggleMute}
          aria-label={muted ? "unmute" : "mute"}
          style={styles.iconBtn}
        >
          {muted ? "♪̶" : "♪"}
        </button>
        <SettingsMenu />
      </div>

      <div
        style={{ ...styles.tapHint, opacity: showUI ? 0.55 : 0 }}
        className="no-select"
      >
        touch the water · find the glowing lanterns
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: { position: "fixed", inset: 0, background: "#03040c", overflow: "hidden" },
  canvasHost: { position: "absolute", inset: 0 },
  vignette: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    zIndex: 10,
    background:
      "radial-gradient(circle at 50% 42%, transparent 45%, rgba(2,3,10,0.55) 100%)",
  },
  controls: {
    position: "fixed",
    top: "max(18px, env(safe-area-inset-top))",
    right: "max(18px, env(safe-area-inset-right))",
    zIndex: 30,
    display: "flex",
    gap: 10,
    transition: "opacity 1s ease",
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "1px solid rgba(160,200,255,0.22)",
    background: "rgba(255,255,255,0.05)",
    color: "#dceaff",
    fontSize: 18,
    cursor: "pointer",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  },
  tapHint: {
    position: "fixed",
    bottom: "max(20px, env(safe-area-inset-bottom))",
    left: 0,
    right: 0,
    textAlign: "center",
    zIndex: 25,
    fontSize: "0.72rem",
    letterSpacing: "0.24em",
    textTransform: "uppercase",
    color: "rgba(180,205,245,0.8)",
    transition: "opacity 1.5s ease",
    pointerEvents: "none",
  },
};
