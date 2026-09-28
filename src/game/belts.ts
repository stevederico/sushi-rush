import { BELT_WARNING, FLOOR_BELT_SPEED, ITEM_BELT_SPEED } from './constants.ts';
import { emit, emitAtTile } from './events.ts';
import { DIRECTION_VECTORS, getBeltDirection, getStationAt, getTile } from './grid.ts';
import type { BeltStation, Station, Vec, World } from './types.ts';

/** Where an item parks on the last tile of an item belt: the middle. */
const END_OF_LINE = 0.5;

/** The push a floor belt gives to anything standing at a position, in tiles per second. */
export function getBeltPush(world: World, x: number, y: number): Vec {
  const tile = getTile(world, Math.floor(x), Math.floor(y));
  const direction = tile === null ? null : getBeltDirection(world, tile);
  if (direction === null) return { x: 0, y: 0 };
  const vector = DIRECTION_VECTORS[direction];
  return { x: vector.x * FLOOR_BELT_SPEED, y: vector.y * FLOOR_BELT_SPEED };
}

/** True while flipping belts are about to change direction. */
export function isBeltWarning(world: World): boolean {
  return world.level.beltFlipEvery > 0 && world.beltTimer <= BELT_WARNING;
}

/** Counts down to the next floor belt reversal on levels that have one. */
export function updateFloorBelts(world: World, dt: number): void {
  if (world.level.beltFlipEvery <= 0) return;
  const before = world.beltTimer;
  world.beltTimer -= dt;
  if (before > BELT_WARNING && world.beltTimer <= BELT_WARNING) emit(world, 'beltWarn', 0, 0);
  if (world.beltTimer > 0) return;
  world.isBeltReversed = !world.isBeltReversed;
  world.beltTimer = world.level.beltFlipEvery;
  emit(world, 'beltFlip', 0, 0);
}

/** The belt or trash an item belt feeds into, or null at the end of the line. */
function getOutlet(world: World, belt: BeltStation): Station | null {
  const step = DIRECTION_VECTORS[belt.direction];
  const next = getStationAt(world, belt.x + step.x, belt.y + step.y);
  return next !== null && (next.kind === 'belt' || next.kind === 'trash') ? next : null;
}

function passAlong(world: World, belt: BeltStation, outlet: Station): void {
  if (outlet.kind === 'trash') {
    belt.item = null;
    emitAtTile(world, 'trash', outlet);
    return;
  }
  if (outlet.kind !== 'belt' || outlet.item !== null) return;
  outlet.item = belt.item;
  outlet.offset = 0;
  belt.item = null;
}

/** Slides items along counter-height conveyors, one item per tile. Items park at the end of the line. */
export function updateItemBelts(world: World, dt: number): void {
  for (const station of world.stations) {
    if (station.kind !== 'belt' || station.item === null) continue;
    const outlet = getOutlet(world, station);
    const limit = outlet === null ? END_OF_LINE : 1;
    if (station.offset < limit) station.offset = Math.min(limit, station.offset + ITEM_BELT_SPEED * dt);
    if (outlet !== null && station.offset >= 1) passAlong(world, station, outlet);
  }
}
