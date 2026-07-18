"use client";

import { useEffect, useRef, useState } from "react";
import { useMubiStore } from "@/stores/mubi";
import { useSettingsStore } from "@/stores/settings";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { choosePrompt } from "@/ai/mubi";
import type { MubiMood } from "@/types";

const MOOD_COLOR: Record<MubiMood, string> = {
  serene: "#8fd7ff",
  curious: "#7ff0d6",
  playful: "#9affea",
  tender: "#ffc7e6",
  awe: "#c6b8ff",
  joyful: "#ffe08a",
  bittersweet: "#a9c6ff",
};

export default function MubiDialogue() {
  const current = useMubiStore((s) => s.current);
  const mood = useMubiStore((s) => s.mood);
  const clear = useMubiStore((s) => s.clear);
  const highContrast = useSettingsStore((s) => s.highContrast);
  const reduced = useReducedMotion();

  const [shown, setShown] = useState("");
  const clearTimer = useRef<number | null>(null);
  const typeTimer = useRef<number | null>(null);

  const color = MOOD_COLOR[mood] ?? MOOD_COLOR.serene;
  const hasPrompts = !!current?.prompts?.length;

  // typewriter reveal (instant under reduced motion)
  useEffect(() => {
    if (typeTimer.current) window.clearInterval(typeTimer.current);
    if (clearTimer.current) window.clearTimeout(clearTimer.current);
    if (!current) {
      setShown("");
      return;
    }
    const full = current.text;
    if (reduced) {
      setShown(full);
    } else {
      let i = 0;
      setShown("");
      typeTimer.current = window.setInterval(() => {
        i += 1;
        setShown(full.slice(0, i));
        if (i >= full.length && typeTimer.current) {
          window.clearInterval(typeTimer.current);
          typeTimer.current = null;
        }
      }, 28);
    }
    // auto-dismiss lines without prompts after a gentle dwell
    if (!current.prompts?.length) {
      const dwell = Math.max(3800, current.text.length * 55);
      clearTimer.current = window.setTimeout(() => clear(), dwell);
    }
    return () => {
      if (typeTimer.current) window.clearInterval(typeTimer.current);
      if (clearTimer.current) window.clearTimeout(clearTimer.current);
    };
  }, [current, reduced, clear]);

  if (!current) return null;

  return (
    <div style={styles.wrap} className="no-select" aria-live="polite">
      <div
        style={{
          ...styles.card,
          background: highContrast
            ? "rgba(4,8,20,0.86)"
            : "rgba(8,14,30,0.5)",
          borderColor: `${color}55`,
        }}
      >
        <div style={styles.head}>
          <span
            style={{
              ...styles.orb,
              background: color,
              boxShadow: `0 0 12px ${color}, 0 0 26px ${color}aa`,
              animation: reduced ? "none" : "pulse 2.4s ease-in-out infinite",
            }}
          />
          <span style={{ ...styles.name, color }}>Mubi</span>
        </div>

        <p style={styles.text}>{shown}</p>

        {hasPrompts && (
          <div style={styles.prompts}>
            {current.prompts!.map((p) => (
              <button
                key={p.id}
                style={{ ...styles.prompt, borderColor: `${color}66` }}
                onClick={() => {
                  setShown("");
                  choosePrompt(p);
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: "calc(env(safe-area-inset-bottom) + 9vh)",
    display: "flex",
    justifyContent: "center",
    padding: "0 18px",
    zIndex: 28,
    pointerEvents: "none",
  },
  card: {
    pointerEvents: "auto",
    maxWidth: 560,
    width: "100%",
    borderRadius: 20,
    border: "1px solid",
    padding: "16px 20px 18px",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    boxShadow: "0 10px 50px rgba(0,0,0,0.4)",
  },
  head: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    marginBottom: 8,
  },
  orb: {
    width: 11,
    height: 11,
    borderRadius: "50%",
    display: "inline-block",
  },
  name: {
    fontSize: "0.72rem",
    letterSpacing: "0.28em",
    textTransform: "uppercase",
    fontWeight: 600,
  },
  text: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(1.15rem, 4.4vw, 1.5rem)",
    lineHeight: 1.4,
    color: "#eef5ff",
    minHeight: "1.4em",
    textShadow: "0 0 20px rgba(127,211,255,0.25)",
  },
  prompts: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  prompt: {
    pointerEvents: "auto",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid",
    color: "#eaf2ff",
    borderRadius: 999,
    padding: "8px 16px",
    fontSize: "0.9rem",
    fontFamily: "var(--font-display)",
    fontStyle: "italic",
    letterSpacing: "0.02em",
    cursor: "pointer",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  },
};
