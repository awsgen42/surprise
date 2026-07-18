"use client";

import { useEffect, useRef } from "react";
import { STORY, beatOpacity, STORY_END } from "@/content/story";

/**
 * Renders the poetry. Reads the shared journey-time ref every frame and writes
 * directly to the DOM (opacity + text) so it never forces a React re-render
 * inside the animation loop.
 */
export default function StoryOverlay({
  timeRef,
}: {
  timeRef: React.MutableRefObject<number>;
}) {
  const lineRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const creditRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let lastLine = "";
    let lastSub = "";

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = timeRef.current;

      // find the active beat with the highest opacity
      let best = { op: 0, line: "", sub: "" };
      for (const b of STORY) {
        if (t >= b.at && t <= b.at + b.hold) {
          const op = beatOpacity(b, t);
          if (op > best.op) best = { op, line: b.line, sub: b.sub ?? "" };
        }
      }

      if (lineRef.current) {
        if (best.line !== lastLine) {
          lineRef.current.textContent = best.line;
          lastLine = best.line;
        }
        lineRef.current.style.opacity = best.line ? String(best.op) : "0";
      }
      if (subRef.current) {
        if (best.sub !== lastSub) {
          subRef.current.textContent = best.sub;
          lastSub = best.sub;
        }
        subRef.current.style.opacity = best.sub ? String(best.op * 0.9) : "0";
      }

      // gentle closing credit after the journey resolves
      if (creditRef.current) {
        const c = Math.min(1, Math.max(0, (t - (STORY_END + 1.5)) / 3));
        creditRef.current.style.opacity = String(c);
      }
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [timeRef]);

  return (
    <div ref={wrapRef} style={styles.wrap} className="no-select">
      <div style={styles.center}>
        <div ref={lineRef} style={styles.line} />
        <div ref={subRef} style={styles.sub} />
      </div>
      <div ref={creditRef} style={styles.credit}>
        made with love, by Awais — for you, always ♡
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: "0 28px 12vh",
    zIndex: 20,
  },
  center: {
    textAlign: "center",
    maxWidth: 900,
  },
  line: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(1.6rem, 5.5vw, 3.4rem)",
    fontWeight: 500,
    letterSpacing: "0.02em",
    lineHeight: 1.25,
    color: "var(--ink)",
    textShadow:
      "0 0 22px rgba(127,211,255,0.55), 0 0 60px rgba(43,108,255,0.35)",
    opacity: 0,
    transition: "opacity 0.25s linear",
  },
  sub: {
    marginTop: "0.8em",
    fontFamily: "var(--font-display)",
    fontSize: "clamp(1rem, 3vw, 1.5rem)",
    fontWeight: 400,
    fontStyle: "italic",
    letterSpacing: "0.04em",
    color: "var(--ink-soft)",
    textShadow: "0 0 18px rgba(127,211,255,0.4)",
    opacity: 0,
    transition: "opacity 0.25s linear",
  },
  credit: {
    position: "absolute",
    bottom: "5vh",
    fontFamily: "var(--font-display)",
    fontSize: "clamp(0.85rem, 2.4vw, 1.05rem)",
    fontStyle: "italic",
    letterSpacing: "0.08em",
    color: "rgba(200,222,255,0.7)",
    textShadow: "0 0 16px rgba(86,240,214,0.35)",
    opacity: 0,
    transition: "opacity 0.5s linear",
  },
};
