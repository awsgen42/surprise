"use client";

import { useUIStore, type RevealCard as Card } from "@/stores/ui";

// Displays a memory or the birthday letter as a glass card. `onClose` lets the
// parent chain behavior (e.g. the letter closing leads to Mubi's farewell).

export default function RevealCard({
  onClose,
}: {
  onClose?: (card: Card) => void;
}) {
  const activeCard = useUIStore((s) => s.activeCard);
  const hideCard = useUIStore((s) => s.hideCard);

  if (!activeCard) return null;

  const close = () => {
    const card = activeCard;
    hideCard();
    onClose?.(card);
  };

  const isLetter = activeCard.kind === "letter";
  const isLove = activeCard.kind === "love";
  const glyph = isLetter ? "✉" : isLove ? "♡" : "✦";
  const closeLabel = isLetter
    ? "close, with all my heart"
    : isLove
      ? "♡"
      : "keep it";

  return (
    <div style={styles.backdrop} className="no-select" onClick={close}>
      <div
        style={styles.card}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={isLetter ? "A letter" : "A memory"}
      >
        <div style={styles.glyph}>{glyph}</div>
        {activeCard.title && <div style={styles.title}>{activeCard.title}</div>}
        {activeCard.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={activeCard.image} alt="" style={styles.image} />
        )}
        <p style={styles.body}>{activeCard.body}</p>
        <button style={styles.close} onClick={close}>
          {closeLabel}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "rgba(2,3,10,0.55)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    animation: "fadeIn 0.5s ease",
  },
  card: {
    maxWidth: 480,
    width: "100%",
    borderRadius: 24,
    padding: "34px 30px 26px",
    textAlign: "center",
    background: "rgba(10,18,38,0.72)",
    border: "1px solid rgba(180,210,255,0.22)",
    boxShadow: "0 0 60px rgba(43,108,255,0.22)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
  },
  glyph: {
    fontSize: 26,
    color: "#ffd9ec",
    textShadow: "0 0 18px rgba(255,199,230,0.7)",
    marginBottom: 14,
  },
  title: {
    fontFamily: "var(--font-display)",
    fontSize: "1.4rem",
    color: "#eef5ff",
    marginBottom: 10,
  },
  image: {
    width: "100%",
    borderRadius: 14,
    marginBottom: 16,
    maxHeight: 260,
    objectFit: "cover",
  },
  body: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(1.15rem, 4.4vw, 1.4rem)",
    lineHeight: 1.5,
    color: "#eaf2ff",
    fontStyle: "italic",
    textShadow: "0 0 20px rgba(127,211,255,0.25)",
  },
  close: {
    marginTop: 22,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(180,210,255,0.3)",
    color: "#eaf2ff",
    borderRadius: 999,
    padding: "9px 20px",
    fontSize: "0.85rem",
    fontFamily: "var(--font-display)",
    fontStyle: "italic",
    letterSpacing: "0.04em",
    cursor: "pointer",
  },
};
