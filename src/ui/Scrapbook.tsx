"use client";

import { useCollectiblesStore } from "@/stores/collectibles";
import { useLoveStore } from "@/stores/love";
import { MEMORIES } from "@/content/memories";
import { LOVE_MESSAGES } from "@/content/love-messages";
import { fill } from "@/content/personalization";

// The love scrapbook (Emotional Systems §4): a revisitable, DOM/screen-reader
// friendly gallery of every memory and love note gathered. Locked slots invite
// return without pressure.

export default function Scrapbook({ onClose }: { onClose: () => void }) {
  const opened = useCollectiblesStore((s) => s.memoriesOpened);
  const hearts = useCollectiblesStore((s) => s.hearts);
  const collected = useLoveStore((s) => s.collected);

  const notes = LOVE_MESSAGES.filter((m) => collected.includes(m.id));

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div
        style={styles.sheet}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Scrapbook"
      >
        <button style={styles.close} onClick={onClose} aria-label="close">
          ✕
        </button>
        <h2 style={styles.h}>Our little scrapbook</h2>
        <p style={styles.sub}>
          {opened.length} of {MEMORIES.length} memories · {hearts.length} hearts
        </p>

        <div style={styles.sectionLabel}>Memories</div>
        <div style={styles.grid}>
          {MEMORIES.map((m) => {
            const isOpen = opened.includes(m.id);
            return (
              <div
                key={m.id}
                style={{ ...styles.frame, opacity: isOpen ? 1 : 0.35 }}
              >
                <div style={styles.frameGlyph}>{isOpen ? "✦" : "·"}</div>
                <p style={styles.frameText}>
                  {isOpen ? fill(m.caption) : "something still waits here…"}
                </p>
              </div>
            );
          })}
        </div>

        {notes.length > 0 && (
          <>
            <div style={styles.sectionLabel}>Love notes</div>
            <div style={styles.grid}>
              {notes.map((n) => (
                <div key={n.id} style={styles.frame}>
                  <div style={styles.frameGlyph}>♡</div>
                  <p style={styles.frameText}>{fill(n.text)}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 38,
    background: "rgba(2,3,10,0.7)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    overflowY: "auto",
    padding: "24px 16px",
    animation: "fadeIn 0.4s ease",
  },
  sheet: {
    position: "relative",
    width: "100%",
    maxWidth: 620,
    borderRadius: 24,
    padding: "28px 22px 32px",
    background: "rgba(10,18,38,0.8)",
    border: "1px solid rgba(180,210,255,0.2)",
    boxShadow: "0 0 60px rgba(43,108,255,0.2)",
  },
  close: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "1px solid rgba(180,210,255,0.25)",
    background: "rgba(255,255,255,0.06)",
    color: "#eaf2ff",
    cursor: "pointer",
    fontSize: 14,
  },
  h: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(1.6rem, 6vw, 2.2rem)",
    color: "#eef5ff",
    textShadow: "0 0 24px rgba(127,211,255,0.4)",
  },
  sub: {
    fontSize: "0.8rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "rgba(200,222,255,0.6)",
    marginTop: 6,
    marginBottom: 18,
  },
  sectionLabel: {
    fontFamily: "var(--font-display)",
    fontStyle: "italic",
    fontSize: "1rem",
    color: "rgba(200,222,255,0.75)",
    margin: "16px 0 10px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: 12,
  },
  frame: {
    borderRadius: 14,
    padding: "16px 14px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(180,210,255,0.16)",
    minHeight: 110,
  },
  frameGlyph: {
    color: "#ffd9ec",
    textShadow: "0 0 12px rgba(255,199,230,0.6)",
    marginBottom: 8,
  },
  frameText: {
    fontFamily: "var(--font-display)",
    fontStyle: "italic",
    fontSize: "0.95rem",
    lineHeight: 1.4,
    color: "#eaf2ff",
  },
};
