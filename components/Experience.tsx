"use client";

import { useEffect, useRef, useState } from "react";
import { World } from "@/lib/three/World";
import { Ambient } from "@/lib/audio";
import { NAME } from "@/lib/story";
import StoryOverlay from "./StoryOverlay";
import StartGate from "./StartGate";

export default function Experience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<World | null>(null);
  const ambientRef = useRef<Ambient | null>(null);
  const timeRef = useRef<number>(0);

  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showUI, setShowUI] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    let world: World | null = null;
    try {
      world = new World(containerRef.current, {
        name: NAME,
        onTick: (t) => {
          timeRef.current = t;
        },
        onArrive: () => setShowUI(true),
      });
      world.mount();
      worldRef.current = world;
      setReady(true);
    } catch (err) {
      console.error("WebGL init failed", err);
    }
    return () => {
      world?.dispose();
      ambientRef.current?.dispose();
      worldRef.current = null;
    };
  }, []);

  const begin = async () => {
    const world = worldRef.current;
    if (!world) return;
    await world.enableTilt();
    world.begin();

    const amb = new Ambient();
    ambientRef.current = amb;
    try {
      await amb.start();
    } catch {
      /* audio blocked — the visuals carry on regardless */
    }
    // swell the music for the birthday reveal
    window.setTimeout(() => ambientRef.current?.bloom(), 27000);
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    ambientRef.current?.setMuted(next);
  };

  return (
    <main style={styles.main}>
      <div ref={containerRef} style={styles.canvasHost} />

      {/* cinematic vignette */}
      <div style={styles.vignette} className="no-select" />

      <StoryOverlay timeRef={timeRef} />

      {ready && <StartGate onBegin={begin} />}

      {/* subtle audio control, appears once the sea is revealed */}
      <button
        onClick={toggleMute}
        aria-label={muted ? "unmute" : "mute"}
        style={{
          ...styles.mute,
          opacity: showUI ? 1 : 0,
          pointerEvents: showUI ? "auto" : "none",
        }}
      >
        {muted ? "♪̶" : "♪"}
      </button>

      <div
        style={{
          ...styles.tapHint,
          opacity: showUI ? 0.55 : 0,
        }}
        className="no-select"
      >
        touch the water
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    position: "fixed",
    inset: 0,
    background: "#03040c",
    overflow: "hidden",
  },
  canvasHost: {
    position: "absolute",
    inset: 0,
  },
  vignette: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    zIndex: 10,
    background:
      "radial-gradient(circle at 50% 42%, transparent 45%, rgba(2,3,10,0.55) 100%)",
  },
  mute: {
    position: "fixed",
    top: "max(18px, env(safe-area-inset-top))",
    right: "max(18px, env(safe-area-inset-right))",
    zIndex: 30,
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
    transition: "opacity 1s ease",
  },
  tapHint: {
    position: "fixed",
    bottom: "max(20px, env(safe-area-inset-bottom))",
    left: 0,
    right: 0,
    textAlign: "center",
    zIndex: 25,
    fontSize: "0.72rem",
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: "rgba(180,205,245,0.8)",
    transition: "opacity 1.5s ease",
    pointerEvents: "none",
  },
};
