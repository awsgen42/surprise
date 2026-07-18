"use client";

import { useEffect, useRef, useState } from "react";
import { useAchievementsStore } from "@/stores/achievements";
import { achievementById } from "@/achievements/defs";

// A quiet, glassy toast for emotional milestones. Watches the store's transient
// `lastUnlocked` signal and shows it briefly. Never gamey, never blocking.

export default function AchievementToast() {
  const lastUnlocked = useAchievementsStore((s) => s.lastUnlocked);
  const [visible, setVisible] = useState(false);
  const [content, setContent] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const timer = useRef<number | null>(null);
  const mountAt = useRef<number>(Date.now());

  useEffect(() => {
    if (!lastUnlocked) return;
    // ignore signals that predate this mount (persisted saves don't re-toast)
    if (lastUnlocked.at < mountAt.current) return;
    const def = achievementById(lastUnlocked.id);
    if (!def) return;
    setContent({ title: def.title, description: def.description });
    setVisible(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setVisible(false), 4600);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [lastUnlocked]);

  if (!content) return null;

  return (
    <div
      className="no-select"
      style={{
        ...styles.wrap,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-10px)",
      }}
      role="status"
      aria-live="polite"
    >
      <div style={styles.card}>
        <div style={styles.spark}>✦</div>
        <div>
          <div style={styles.title}>{content.title}</div>
          <div style={styles.desc}>{content.description}</div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: "fixed",
    top: "calc(env(safe-area-inset-top) + 16px)",
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "center",
    zIndex: 32,
    pointerEvents: "none",
    transition: "opacity 0.7s ease, transform 0.7s ease",
  },
  card: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 18px",
    borderRadius: 16,
    background: "rgba(8,14,30,0.55)",
    border: "1px solid rgba(160,200,255,0.22)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    boxShadow: "0 8px 40px rgba(0,0,0,0.35)",
    maxWidth: "88vw",
  },
  spark: {
    color: "#ffe08a",
    fontSize: 18,
    textShadow: "0 0 12px #ffe08a",
  },
  title: {
    fontFamily: "var(--font-display)",
    fontSize: "1.05rem",
    color: "#eef5ff",
    lineHeight: 1.2,
  },
  desc: {
    fontSize: "0.78rem",
    color: "rgba(200,222,255,0.7)",
    letterSpacing: "0.02em",
  },
};
