import { DIRECTION_VECTORS, NEIGHBORS, getTile, isWalkable, reverseDirection } from './grid.ts';
import type { Vec, World } from './types.ts';

type Grid = Pick<World, 'tiles' | 'stations' | 'width' | 'height'> & Partial<Pick<World, 'isBeltReversed'>>;

/** Step costs, in half tiles, so every cost is a whole number. */
const FLOOR_COST = 2;
const BELT_WITH_COST = 3;
const BELT_ACROSS_COST = 4;
const BELT_AGAINST_COST = 8;
/** Extra cost for a tile another chef is standing on, so paths bend around them. */
const CROWD_COST = 10;

/**
 * What it costs to step onto a floor tile from a neighbour, `step` being the move.
 * Belts cost more than plain floor, most of all when walking into the push.
 */
export function getStepCost(world: Grid, to: Vec, step: Vec): number {
  const belt = getTile(world, to.x, to.y)?.belt ?? null;
  if (belt === null) return FLOOR_COST;
  const direction = world.isBeltReversed === true ? reverseDirection(belt) : belt;
  const push = DIRECTION_VECTORS[direction];
  const along = push.x * step.x + push.y * step.y;
  if (along > 0) return BELT_WITH_COST;
  return along < 0 ? BELT_AGAINST_COST : BELT_ACROSS_COST;
}

interface Search {
  cost: Map<number, number>;
  cameFrom: Map<number, number>;
}

/** Tiles that cost extra to step onto, keyed like the search keys. */
type Crowd = ReadonlySet<number>;

/**
 * Cheapest-first search over floor tiles, stopping early once a goal is settled.
 * Costs are small whole numbers, so a bucket per cost stands in for a priority queue.
 */
function search(world: Grid, start: Vec, goalKeys: ReadonlySet<number> | null, crowd: Crowd): Search & { goal: number } {
  const startKey = toKey(world, start);
  const found: Search & { goal: number } = {
    cost: new Map([[startKey, 0]]),
    cameFrom: new Map([[startKey, startKey]]),
    goal: -1,
  };
  const buckets: number[][] = [[startKey]];
  for (let cost = 0; cost < buckets.length; cost += 1) {
    for (const key of buckets[cost] ?? []) {
      if (found.cost.get(key) !== cost) continue;
      if (goalKeys?.has(key) === true) {
        found.goal = key;
        return found;
      }
      relax(world, found, buckets, key, cost, crowd);
    }
  }
  return found;
}

function relax(world: Grid, found: Search, buckets: number[][], key: number, cost: number, crowd: Crowd): void {
  const here = fromKey(world, key);
  for (const step of NEIGHBORS) {
    const next = { x: here.x + step.x, y: here.y + step.y };
    if (!isWalkable(world, next.x, next.y)) continue;
    const nextKey = toKey(world, next);
    const nextCost = cost + getStepCost(world, next, step) + (crowd.has(nextKey) ? CROWD_COST : 0);
    if (nextCost >= (found.cost.get(nextKey) ?? Infinity)) continue;
    found.cost.set(nextKey, nextCost);
    found.cameFrom.set(nextKey, key);
    const bucket = buckets[nextCost];
    if (bucket === undefined) {
      while (buckets.length < nextCost) buckets.push([]);
      buckets.push([nextKey]);
    } else {
      bucket.push(nextKey);
    }
  }
}

/**
 * Finds the cheapest walk from `start` to the nearest goal.
 * Tiles in `crowd` cost extra, so a chef walks around another chef when there is room.
 * Returns the tiles from start to goal, both included, or null when none is reachable.
 */
export function findPath(world: Grid, start: Vec, goals: readonly Vec[], crowd: readonly Vec[] = []): Vec[] | null {
  if (!isWalkable(world, start.x, start.y) || goals.length === 0) return null;
  const goalKeys = new Set(goals.filter((goal) => isInside(world, goal)).map((goal) => toKey(world, goal)));
  const crowdKeys = new Set(crowd.filter((tile) => isInside(world, tile)).map((tile) => toKey(world, tile)));
  const found = search(world, start, goalKeys, crowdKeys);
  return found.goal === -1 ? null : buildPath(world, found.cameFrom, found.goal);
}

/**
 * The cost of the cheapest walk from `start` to every reachable floor tile.
 * Returns a lookup that gives Infinity for tiles that cannot be reached.
 */
export function getTravelCosts(world: Grid, start: Vec): (tile: Vec) => number {
  if (!isWalkable(world, start.x, start.y)) return () => Infinity;
  const { cost } = search(world, start, null, new Set());
  return (tile) => (isInside(world, tile) ? (cost.get(toKey(world, tile)) ?? Infinity) : Infinity);
}

/** Floor tiles directly beside a tile, from which a chef could reach it. */
export function getAccessTiles(world: Grid, tile: Vec): Vec[] {
  return NEIGHBORS.map((step) => ({ x: tile.x + step.x, y: tile.y + step.y })).filter((spot) =>
    isWalkable(world, spot.x, spot.y),
  );
}

function isInside(world: Grid, tile: Vec): boolean {
  return tile.x >= 0 && tile.y >= 0 && tile.x < world.width && tile.y < world.height;
}

function toKey(world: Grid, tile: Vec): number {
  return tile.y * world.width + tile.x;
}

function fromKey(world: Grid, key: number): Vec {
  return { x: key % world.width, y: Math.floor(key / world.width) };
}

function buildPath(world: Grid, cameFrom: Map<number, number>, goalKey: number): Vec[] {
  const path: Vec[] = [];
  let key = goalKey;
  for (let guard = 0; guard <= world.width * world.height; guard += 1) {
    path.push(fromKey(world, key));
    const previous = cameFrom.get(key);
    if (previous === undefined || previous === key) break;
    key = previous;
  }
  return path.reverse();
}
