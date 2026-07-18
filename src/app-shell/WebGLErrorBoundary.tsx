"use client";

import React from "react";
import { NAME } from "@/content/story";

// Graceful degradation (Blueprint §15): if WebGL is unavailable or the render
// tree throws, show a still, DOM-only "poster" so the gift still lands rather
// than a blank/broken screen.

function webglSupported(): boolean {
  if (typeof document === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

function Poster() {
  return (
    <div style={styles.poster} className="no-select">
      <div style={styles.kicker}>for</div>
      <div style={styles.name}>{NAME}</div>
      <p style={styles.msg}>
        Some stories are too beautiful for words. Tonight, an entire ocean of
        stars awakens for you — happy birthday.
      </p>
      <div style={styles.credit}>made with love ♡</div>
    </div>
  );
}

export default class WebGLErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    console.error("[WebGLErrorBoundary]", err);
  }
  render() {
    if (this.state.failed || !webglSupported()) return <Poster />;
    return this.props.children;
  }
}

const styles: Record<string, React.CSSProperties> = {
  poster: {
    position: "fixed",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "0 32px",
    background:
      "radial-gradient(circle at 50% 35%, #0a1730 0%, #03050f 70%)",
    color: "#eaf2ff",
  },
  kicker: {
    fontFamily: "var(--font-display)",
    fontStyle: "italic",
    letterSpacing: "0.35em",
    textTransform: "uppercase",
    fontSize: "0.9rem",
    color: "rgba(200,222,255,0.6)",
  },
  name: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(2.6rem, 11vw, 5rem)",
    fontWeight: 600,
    margin: "0.1em 0 0.6em",
    textShadow: "0 0 30px rgba(127,211,255,0.6)",
  },
  msg: {
    fontFamily: "var(--font-display)",
    fontStyle: "italic",
    fontSize: "clamp(1.1rem, 4.5vw, 1.5rem)",
    maxWidth: 520,
    lineHeight: 1.5,
    color: "rgba(226,236,255,0.85)",
  },
  credit: {
    marginTop: "2.5em",
    fontFamily: "var(--font-display)",
    fontStyle: "italic",
    letterSpacing: "0.08em",
    color: "rgba(200,222,255,0.6)",
  },
};
