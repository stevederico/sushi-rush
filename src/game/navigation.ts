import { getBeltPush } from './belts.ts';
import { CHEF_SPEED } from './constants.ts';
import { getStationAt, isWalkable, tileCenter, toTile } from './grid.ts';
import { findPath, getAccessTiles } from './pathfinding.ts';
import type { Chef, ChefInput, Vec, World } from './types.ts';

/** How close to the goal tile's centre a chef must be before using a station. */
const STATION_ARRIVAL = 0.24;
const WALK_ARRIVAL = 0.08;
/** How far off the middle of its lane a chef may be before it lines up first. */
const LANE_SLACK = 0.18;

export interface NavStep {
  moveX: number;
  moveY: number;
  hasArrived: boolean;
}

const IDLE: NavStep = { moveX: 0, moveY: 0, hasArrived: false };

/**
 * Sends a chef to a tapped tile. Tapping a station walks to the nearest free side and uses it.
 * Returns false when the tile cannot be reached.
 */
export function commandChef(world: World, chef: Chef, tile: Vec): boolean {
  const start = toTile(chef.x, chef.y);
  if (isWalkable(world, tile.x, tile.y)) {
    if (findPath(world, start, [tile]) === null) return false;
    chef.goal = { tile, station: null };
    return true;
  }
  if (getStationAt(world, tile.x, tile.y) === null) return false;
  const path = findPath(world, start, getAccessTiles(world, tile));
  const last = path?.[path.length - 1];
  if (last === undefined) return false;
  chef.goal = { tile: last, station: tile };
  return true;
}

interface Steering {
  moveX: number;
  moveY: number;
  distance: number;
}

/** Walking input toward a point, leaning into any floor belt so the chef holds its line. */
function steer(world: World, chef: Chef, target: Vec, dt: number): Steering {
  const gapX = target.x - chef.x;
  const gapY = target.y - chef.y;
  const distance = Math.hypot(gapX, gapY);
  if (distance < 0.0001) return { moveX: 0, moveY: 0, distance };
  const pace = Math.min(1, distance / (CHEF_SPEED * dt));
  const push = getBeltPush(world, chef.x, chef.y);
  const moveX = (gapX / distance) * pace - push.x / CHEF_SPEED;
  const moveY = (gapY / distance) * pace - push.y / CHEF_SPEED;
  const length = Math.max(1, Math.hypot(moveX, moveY));
  return { moveX: moveX / length, moveY: moveY / length, distance };
}

/**
 * The point to walk to on the way to the next tile.
 * A chef that has drifted out of its lane lines up first, so it never snags on a corner.
 */
function getWaypoint(chef: Chef, next: Vec): Vec {
  const here = toTile(chef.x, chef.y);
  const lane = tileCenter(here.x, here.y);
  const target = tileCenter(next.x, next.y);
  if (next.y === here.y && Math.abs(lane.y - chef.y) > LANE_SLACK) return { x: chef.x, y: lane.y };
  if (next.x === here.x && Math.abs(lane.x - chef.x) > LANE_SLACK) return { x: lane.x, y: chef.y };
  return target;
}

/** Tiles where the other chefs stand. */
function getCrowd(world: World, chef: Chef): Vec[] {
  return world.chefs.filter((other) => other !== chef).map((other) => toTile(other.x, other.y));
}

/** The walking input that carries a chef one step closer to its tap goal. */
export function getNavStep(world: World, chef: Chef, dt: number): NavStep {
  const goal = chef.goal;
  if (goal === null) return IDLE;
  const path = findPath(world, toTile(chef.x, chef.y), [goal.tile], getCrowd(world, chef));
  if (path === null) {
    chef.goal = null;
    return IDLE;
  }
  const next = path[1];
  if (next !== undefined) {
    const step = steer(world, chef, getWaypoint(chef, next), dt);
    return { moveX: step.moveX, moveY: step.moveY, hasArrived: false };
  }
  const step = steer(world, chef, tileCenter(goal.tile.x, goal.tile.y), dt);
  const arrival = goal.station === null ? WALK_ARRIVAL : STATION_ARRIVAL;
  return { moveX: step.moveX, moveY: step.moveY, hasArrived: step.distance <= arrival };
}

/** Merges keyboard input with tap navigation. Keys always win and cancel the tap goal. */
export function resolveInput(world: World, chef: Chef, input: ChefInput, dt: number): ChefInput & { hasArrived: boolean } {
  if (input.moveX !== 0 || input.moveY !== 0 || input.interact) {
    chef.goal = null;
    return { ...input, hasArrived: false };
  }
  const step = getNavStep(world, chef, dt);
  return { moveX: step.moveX, moveY: step.moveY, interact: false, dash: input.dash, hasArrived: step.hasArrived };
}
