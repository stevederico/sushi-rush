import type { Chef, ChefInput, LevelDef, RecipeId, Station, StationKind, World } from './types.ts';
import { createWorld, updateWorld } from './world.ts';

const STEP = 1 / 60;

export const IDLE: ChefInput = { moveX: 0, moveY: 0, interact: false, dash: false };

/** Builds a level definition around a text map, for tests. */
export function makeLevel(map: string[], overrides: Partial<LevelDef> = {}): LevelDef {
  const recipes: RecipeId[] = ['salmonNigiri'];
  return {
    id: 99,
    name: 'Test Kitchen',
    tagline: '',
    map,
    recipes,
    duration: 600,
    orderInterval: 1000,
    maxOrders: 4,
    stars: [10, 20, 30],
    beltFlipEvery: 0,
    hasCat: false,
    ...overrides,
  };
}

/** Builds a quiet world with no tickets arriving on their own. */
export function makeWorld(map: string[], overrides: Partial<LevelDef> = {}, chefCount = 1): World {
  const world = createWorld(makeLevel(map, overrides), chefCount, 7);
  world.orderTimer = 100000;
  return world;
}

/** The first chef. Throws when the map has no spawn, which is a broken test. */
export function getChef(world: World, index = 0): Chef {
  const chef = world.chefs[index];
  if (chef === undefined) throw new Error(`No chef ${index}`);
  return chef;
}

/** The first station of a kind, narrowed to its type. */
export function getStation<K extends StationKind>(world: World, kind: K, nth = 0): Extract<Station, { kind: K }> {
  const matches = world.stations.filter((station): station is Extract<Station, { kind: K }> => station.kind === kind);
  const station = matches[nth];
  if (station === undefined) throw new Error(`No ${kind} station ${nth}`);
  return station;
}

/** Index of a station in the world. */
export function indexOf(world: World, station: Station): number {
  return world.stations.indexOf(station);
}

/** Runs the world for a number of seconds with the same input every step. */
export function run(world: World, seconds: number, inputs: ChefInput[] = [IDLE, IDLE]): void {
  const steps = Math.round(seconds / STEP);
  for (let step = 0; step < steps; step += 1) updateWorld(world, inputs, STEP);
}

/** Runs the world until the test passes or the time limit is hit. Returns true on success. */
export function runUntil(world: World, isDone: () => boolean, limit: number, each: () => void = () => {}): boolean {
  const steps = Math.round(limit / STEP);
  for (let step = 0; step < steps; step += 1) {
    if (isDone()) return true;
    each();
    updateWorld(world, [IDLE, IDLE], STEP);
  }
  return isDone();
}
