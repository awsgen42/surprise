"use client";

import { useState } from "react";
import { useSettingsStore } from "@/stores/settings";
import { resetSave } from "@/services/storage";

// Compact accessibility & preferences menu (Blueprint §14): reduced motion,
// high contrast, captions, and a save reset. Kept unobtrusive.

export default function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const s = useSettingsStore();

  const rmChecked =
    s.reducedMotionOverride == null ? false : s.reducedMotionOverride;

  return (
    <div style={{ position: "relative" }}>
      <button
        aria-label="settings"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={styles.iconBtn}
      >
        ⚙
      </button>

      {open && (
        <div style={styles.panel} role="menu" className="no-select">
          <div style={styles.title}>comfort</div>

          <Toggle
            label="Reduce motion"
            checked={rmChecked}
            onChange={(v) => s.setReducedMotionOverride(v)}
          />
          <Toggle
            label="High contrast text"
            checked={s.highContrast}
            onChange={s.setHighContrast}
          />
          <Toggle
            label="Captions"
            checked={s.captions}
            onChange={s.setCaptions}
          />

          <button
            style={styles.reset}
            onClick={() => {
              if (
                confirm(
                  "Start the journey over? This clears your memories and progress."
                )
              ) {
                resetSave();
                location.reload();
              }
            }}
          >
            start over
          </button>
        </div>
      )}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label style={styles.row}>
      <span>{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        style={{
          ...styles.switch,
          background: checked
            ? "rgba(86,240,214,0.55)"
            : "rgba(255,255,255,0.12)",
        }}
      >
        <span
          style={{
            ...styles.knob,
            transform: checked ? "translateX(16px)" : "translateX(0)",
          }}
        />
      </button>
    </label>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
  panel: {
    position: "absolute",
    top: 52,
    right: 0,
    width: 230,
    padding: "16px 16px 14px",
    borderRadius: 16,
    background: "rgba(8,14,30,0.72)",
    border: "1px solid rgba(160,200,255,0.22)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
  },
  title: {
    fontSize: "0.68rem",
    letterSpacing: "0.24em",
    textTransform: "uppercase",
    color: "rgba(200,222,255,0.6)",
    marginBottom: 12,
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: "0.9rem",
    color: "#eaf2ff",
    padding: "7px 0",
  },
  switch: {
    position: "relative",
    width: 38,
    height: 22,
    borderRadius: 999,
    border: "none",
    cursor: "pointer",
    transition: "background 0.25s ease",
    padding: 0,
    flexShrink: 0,
  },
  knob: {
    position: "absolute",
    top: 3,
    left: 3,
    width: 16,
    height: 16,
    borderRadius: "50%",
    background: "#fff",
    transition: "transform 0.25s ease",
  },
  reset: {
    marginTop: 14,
    width: "100%",
    background: "transparent",
    border: "1px solid rgba(255,150,170,0.35)",
    color: "rgba(255,190,200,0.9)",
    borderRadius: 10,
    padding: "8px 0",
    fontSize: "0.8rem",
    letterSpacing: "0.08em",
    cursor: "pointer",
  },
};
