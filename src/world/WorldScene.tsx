"use client";

import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { WorldEngine, type WorldOptions } from "./World";

/**
 * The R3F bridge: adopts the Canvas's renderer/scene/camera into the imperative
 * WorldEngine (which hosts every shader system + the exact Part 1 post-processing
 * pipeline), resizes it, and advances it once per frame with a render priority so
 * R3F yields rendering to our composer (ADR-0003).
 */
export default function WorldScene({
  opts,
  onReady,
  reducedMotion = false,
}: {
  opts: WorldOptions;
  onReady: (engine: WorldEngine) => void;
  reducedMotion?: boolean;
}) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);

  const engineRef = useRef<WorldEngine | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const engine = new WorldEngine(
      { gl, scene, camera, width, height },
      opts
    );
    engineRef.current = engine;
    onReadyRef.current(engine);
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
    // create exactly once; gl/scene/camera are stable for the Canvas lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engineRef.current?.resize(width, height);
  }, [width, height]);

  useEffect(() => {
    engineRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  useFrame((_state, delta) => {
    engineRef.current?.update(delta);
  }, 1);

  return null;
}
