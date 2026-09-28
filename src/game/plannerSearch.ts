import { toTile } from './grid.ts';
import { toFoodToken } from './items.ts';
import { getAccessTiles, getTravelCosts } from './pathfinding.ts';
import type { Chef, FillingId, FoodToken, IngredientId, Item, Station, World } from './types.ts';

export type StationTest = (station: Station) => boolean;

/** The loose item on a counter, board or item belt. */
export function getHeldItem(station: Station): Item | null {
  if (station.kind === 'counter' || station.kind === 'board' || station.kind === 'belt') return station.item;
  return null;
}

/** Index of the cheapest station to walk to that passes the test, or -1 when none is reachable. */
export function findNearest(world: World, chef: Chef, test: StationTest): number {
  const costTo = getTravelCosts(world, toTile(chef.x, chef.y));
  let best = -1;
  let bestCost = Infinity;
  world.stations.forEach((station, index) => {
    if (!test(station)) return;
    const cost = Math.min(...getAccessTiles(world, station).map(costTo));
    if (cost >= bestCost) return;
    best = index;
    bestCost = cost;
  });
  return best;
}

/** Matches a station showing food that is ready to go on a plate as `token`. */
export function hasFood(token: FoodToken): StationTest {
  return (station) => {
    if (station.kind === 'mat') return station.roll !== null && toFoodToken(station.roll) === token;
    if (token === 'rice' && station.kind === 'cooker') return station.state === 'ready';
    const item = getHeldItem(station);
    return item !== null && toFoodToken(item) === token;
  };
}

/** Matches a counter, board or belt holding a given ingredient. */
export function hasIngredient(id: IngredientId, sliced: boolean, onBoard: boolean | null = null): StationTest {
  return (station) => {
    if (onBoard !== null && (station.kind === 'board') !== onBoard) return false;
    const item = getHeldItem(station);
    return item !== null && item.kind === 'ingredient' && item.id === id && item.sliced === sliced;
  };
}

/** Matches the crate for an ingredient. */
export function isCrateOf(id: IngredientId): StationTest {
  return (station) => station.kind === 'crate' && station.ingredient === id;
}

/** Matches a mat that can still become a roll with this filling. */
export function isMatFor(filling: FillingId): StationTest {
  return (station) => {
    if (station.kind !== 'mat' || station.roll !== null) return false;
    return station.parts.every((part) => !part.sliced || part.id === filling);
  };
}

/** Matches an empty station of a kind that can hold an item. */
export function isEmpty(kind: 'counter' | 'board'): StationTest {
  return (station) => station.kind === kind && station.item === null;
}
