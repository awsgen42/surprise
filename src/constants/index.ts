import type { QualityTier } from "@/types";

// Central tunables (Blueprint §13/§17, Master Plan §1 rule 12). Tiers are data,
// not scattered magic numbers, so the quality ladder can be tuned in one place.

export interface TierProfile {
  /** Multiplier applied to particle/creature counts. */
  density: number;
  /** Upper bound on device pixel ratio. */
  dprCap: number;
  /** Bloom strength ceiling. */
  bloom: number;
  antialias: boolean;
  godRays: boolean;
  rain: boolean;
}

export const TIER_PROFILES: Record<QualityTier, TierProfile> = {
  high: { density: 1.0, dprCap: 2.0, bloom: 0.55, antialias: true, godRays: true, rain: true },
  mid: { density: 0.7, dprCap: 1.6, bloom: 0.45, antialias: false, godRays: true, rain: true },
  low: { density: 0.45, dprCap: 1.25, bloom: 0.35, antialias: false, godRays: false, rain: false },
  potato: { density: 0.25, dprCap: 1.0, bloom: 0.0, antialias: false, godRays: false, rain: false },
};

/** Performance budget (Blueprint §13) — referenced by the perf test suite. */
export const BUDGET = {
  targetFps: 60,
  frameMs: 1000 / 60,
  initialJsGzipKb: 200,
} as const;

// The save format version lives in services/storage (single source of truth);
// import it from there rather than duplicating it here.
