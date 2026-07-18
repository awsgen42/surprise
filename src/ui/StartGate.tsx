"use client";

import { useEffect, useRef, useState } from "react";
import { NAME } from "@/content/story";

/**
 * The threshold of the journey. Audio autoplay and device-orientation both
 * require a user gesture, so the experience opens with a single, quiet tap —
 * which is also its first emotional beat.
 */
export default function StartGate({ onBegin }: { onBegin: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const handle = () => {
    if (leaving) return;
    setLeaving(true);
    onBegin();
    window.setTimeout(() => {
      if (rootRef.current) rootRef.current.style.display = "none";
    }, 2200);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") handle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving]);

  return (
    <div
      ref={rootRef}
      onClick={handle}
      className="no-select"
      style={{
        ...styles.root,
        opacity: leaving ? 0 : 1,
        pointerEvents: leaving ? "none" : "auto",
      }}
    >
      <div style={styles.card}>
        <div style={styles.kicker}>a gift, for</div>
        <div style={styles.name}>{NAME}</div>
        <div style={styles.hint}>
          <span style={styles.dot} />
          tap to begin
        </div>
      </div>
      <div style={styles.foot}>best experienced with sound & in the dark</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    position: "fixed",
    inset: 0,
    zIndex: 40,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background:
      "radial-gradient(circle at 50% 45%, rgba(10,22,48,0.55), rgba(2,3,10,0.96) 70%)",
    backdropFilter: "blur(2px)",
    WebkitBackdropFilter: "blur(2px)",
    transition: "opacity 2s ease",
    cursor: "pointer",
  },
  card: {
    textAlign: "center",
    padding: "48px 56px",
    borderRadius: 28,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(160,200,255,0.16)",
    boxShadow:
      "0 0 60px rgba(43,108,255,0.18), inset 0 0 40px rgba(127,211,255,0.06)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  },
  kicker: {
    fontFamily: "var(--font-display)",
    fontStyle: "italic",
    fontSize: "clamp(0.9rem, 3vw, 1.15rem)",
    letterSpacing: "0.35em",
    textTransform: "uppercase",
    color: "rgba(200,222,255,0.6)",
  },
  name: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(2.6rem, 11vw, 5.5rem)",
    fontWeight: 600,
    letterSpacing: "0.03em",
    margin: "0.15em 0 0.5em",
    color: "#eef5ff",
    textShadow:
      "0 0 30px rgba(127,211,255,0.6), 0 0 80px rgba(43,108,255,0.4)",
  },
  hint: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    fontSize: "clamp(0.85rem, 3vw, 1rem)",
    letterSpacing: "0.28em",
    textTransform: "uppercase",
    color: "rgba(220,235,255,0.85)",
    animation: "pulse 2.6s ease-in-out infinite",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "var(--bio)",
    boxShadow: "0 0 12px var(--bio), 0 0 24px var(--glow)",
    display: "inline-block",
  },
  foot: {
    position: "absolute",
    bottom: "6vh",
    fontSize: "0.78rem",
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: "rgba(170,195,235,0.45)",
  },
};
