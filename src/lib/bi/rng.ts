/** Deterministic pseudo-random generator so sample numbers stay stable across renders. */
export function seeded(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (min: number, max: number) => min + next() * (max - min),
    int: (min: number, max: number) => Math.round(min + next() * (max - min)),
    /** base ± pct (e.g. 0.1 = ±10%) */
    vary: (base: number, pct = 0.1) => base * (1 + (next() * 2 - 1) * pct),
    pick: <T,>(arr: T[]): T => arr[Math.floor(next() * arr.length)] as T,
  };
}
export type Rng = ReturnType<typeof seeded>;
