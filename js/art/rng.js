/**
 * js/art/rng.js
 * Lightweight, deterministic Mulberry32 Pseudo-Random Number Generator.
 */

export function createPRNG(seedInput) {
  let seed = 0;
  if (typeof seedInput === 'number') {
    seed = seedInput;
  } else if (typeof seedInput === 'string') {
    for (let i = 0; i < seedInput.length; i++) {
      seed = (Math.imul(31, seed) + seedInput.charCodeAt(i)) | 0;
    }
  } else {
    seed = 1337;
  }

  // Ensure non-zero seed state
  let state = seed ^ 0xDEADBEEF;

  function next() {
    let t = (state += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    /** Returns float in [0, 1) */
    random: next,
    /** Returns integer in [min, max] inclusive */
    rangeInt(min, max) {
      return Math.floor(next() * (max - min + 1)) + min;
    },
    /** Returns float in [min, max) */
    rangeFloat(min, max) {
      return next() * (max - min) + min;
    },
    /** Picks a random element from an array */
    pick(arr) {
      if (!arr || arr.length === 0) return null;
      return arr[Math.floor(next() * arr.length)];
    },
    /** Shuffles an array deterministically */
    shuffle(arr) {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }
  };
}
