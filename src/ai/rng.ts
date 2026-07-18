// Small seedable RNG (mulberry32) so dialogue selection can be made
// deterministic in tests (Blueprint §18) while feeling random in play.

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rng = () => number;

/** Default non-deterministic RNG for gameplay. */
export const defaultRng: Rng = Math.random;

export function pick<T>(arr: T[], rng: Rng = defaultRng): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Weighted pick. Items with higher weight are more likely. */
export function weightedPick<T>(
  items: { item: T; weight: number }[],
  rng: Rng = defaultRng
): T | null {
  const total = items.reduce((s, i) => s + Math.max(0, i.weight), 0);
  if (total <= 0) return null;
  let r = rng() * total;
  for (const i of items) {
    r -= Math.max(0, i.weight);
    if (r <= 0) return i.item;
  }
  return items[items.length - 1].item;
}
