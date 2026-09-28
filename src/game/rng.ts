import type { World } from './types.ts';

const UINT32 = 4294967296;

/**
 * Returns the next seeded random number in [0, 1) and advances the world seed.
 * Uses mulberry32 so a shift replays the same way for a given seed.
 */
export function nextRandom(world: Pick<World, 'seed'>): number {
  world.seed = (world.seed + 0x6d2b79f5) | 0;
  let t = world.seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / UINT32;
}

/** Picks a random element, or undefined when the list is empty. */
export function pickRandom<T>(world: Pick<World, 'seed'>, list: readonly T[]): T | undefined {
  if (list.length === 0) return undefined;
  return list[Math.floor(nextRandom(world) * list.length)];
}
