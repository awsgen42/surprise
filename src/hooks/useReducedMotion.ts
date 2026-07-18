"use client";

import { useEffect, useState } from "react";
import { useSettingsStore } from "@/stores/settings";

/**
 * Effective reduced-motion: the explicit settings override if set, otherwise the
 * OS `prefers-reduced-motion` preference (Blueprint §14).
 */
export function useReducedMotion(): boolean {
  const override = useSettingsStore((s) => s.reducedMotionOverride);
  const [system, setSystem] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setSystem(mq.matches);
    const handler = () => setSystem(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return override == null ? system : override;
}
