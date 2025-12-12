/**
 * Convert a string seed to a numeric hash using djb2 algorithm
 */
export function hashSeed(seedString: string): number {
  let hash = 5381;
  for (let i = 0; i < seedString.length; i++) {
    const char = seedString.charCodeAt(i);
    hash = ((hash << 5) + hash) ^ char;
  }
  return Math.abs(hash >>> 0);
}

/**
 * Create a seeded pseudo-random number generator using mulberry32 algorithm
 * Returns a function that generates random numbers between 0 and 1
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed;
  return function () {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
