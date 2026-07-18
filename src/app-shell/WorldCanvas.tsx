"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import WorldScene from "@/world/WorldScene";
import type { WorldEngine, WorldOptions } from "@/world/World";
import WebGLErrorBoundary from "./WebGLErrorBoundary";

// The single persistent WebGL surface (Blueprint §3). R3F owns the renderer,
// canvas, camera and frame loop; the WorldEngine (hosted by WorldScene) runs the
// systems + post-processing. dpr/antialias mirror Part 1 exactly for identical
// output; dynamic-resolution tuning is deferred to M13 (ADR-0003).

function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    window.innerWidth < 820
  );
}

export default function WorldCanvas({
  opts,
  onReady,
  reducedMotion = false,
}: {
  opts: WorldOptions;
  onReady: (engine: WorldEngine) => void;
  reducedMotion?: boolean;
}) {
  const mobile = isMobile();
  const dpr = Math.min(
    typeof window !== "undefined" ? window.devicePixelRatio : 1,
    mobile ? 1.6 : 2
  );

  return (
    <WebGLErrorBoundary>
      <Canvas
        dpr={dpr}
        frameloop="always"
        gl={{
          antialias: !mobile,
          powerPreference: "high-performance",
          alpha: false,
        }}
        camera={{ fov: 60, near: 0.1, far: 1200, position: [0, 5, 46] }}
        // engine sets tone mapping/exposure/colour-space to match Part 1 exactly
        style={{ position: "absolute", inset: 0, display: "block" }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(0x03040c), 1);
        }}
      >
        <WorldScene opts={opts} onReady={onReady} reducedMotion={reducedMotion} />
      </Canvas>
    </WebGLErrorBoundary>
  );
}
