import type { QualityTier } from "@/types";
import { TIER_PROFILES, type TierProfile } from "@/constants";

// Device capability tiering (Blueprint §17). Classifies once at boot from cheap
// signals; a runtime frame probe (added in M2 with PerformanceMonitor) can
// demote/promote live. The pure `classifyFrom` is unit-testable; `detectTier`
// reads the real environment.

export interface CapabilitySignals {
  ua: string;
  deviceMemory?: number; // GB, where available
  hardwareConcurrency?: number;
  devicePixelRatio: number;
  coarsePointer: boolean;
  viewportWidth: number;
}

export function classifyFrom(s: CapabilitySignals): QualityTier {
  const mobile =
    /Android|iPhone|iPad|iPod|Mobile/i.test(s.ua) ||
    s.coarsePointer ||
    s.viewportWidth < 820;

  const mem = s.deviceMemory ?? (mobile ? 4 : 8);
  const cores = s.hardwareConcurrency ?? (mobile ? 4 : 8);

  if (!mobile && mem >= 8 && cores >= 8) return "high";
  if (mem <= 2 || cores <= 2) return "potato";
  if (mobile && (mem <= 3 || cores <= 4)) return "low";
  return "mid";
}

export function detectSignals(): CapabilitySignals {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return {
    ua: nav.userAgent,
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: nav.hardwareConcurrency,
    devicePixelRatio: window.devicePixelRatio || 1,
    coarsePointer:
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches,
    viewportWidth: window.innerWidth,
  };
}

export function detectTier(): QualityTier {
  try {
    return classifyFrom(detectSignals());
  } catch {
    return "mid";
  }
}

export function profileFor(tier: QualityTier): TierProfile {
  return TIER_PROFILES[tier];
}
