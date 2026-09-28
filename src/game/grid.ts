import type { Direction, Station, Tile, Vec, World } from './types.ts';

export const DIRECTION_VECTORS: Record<Direction, Vec> = {
  right: { x: 1, y: 0 },
  left: { x: -1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
};

export const NEIGHBORS: readonly Vec[] = Object.values(DIRECTION_VECTORS);

const OPPOSITES: Record<Direction, Direction> = {
  right: 'left',
  left: 'right',
  up: 'down',
  down: 'up',
};

type Grid = Pick<World, 'tiles' | 'stations' | 'width' | 'height'>;

/** Flips a direction. */
export function reverseDirection(direction: Direction): Direction {
  return OPPOSITES[direction];
}

/** The tile at a grid position, or null outside the kitchen. */
export function getTile(world: Grid, x: number, y: number): Tile | null {
  return world.tiles[y]?.[x] ?? null;
}

/** True when chefs and the cat can stand on the tile. */
export function isWalkable(world: Grid, x: number, y: number): boolean {
  return getTile(world, x, y)?.kind === 'floor';
}

/** The station on a tile, or null. */
export function getStationAt(world: Grid, x: number, y: number): Station | null {
  const tile = getTile(world, x, y);
  if (tile === null || tile.kind !== 'station') return null;
  return world.stations[tile.station] ?? null;
}

/** Index of the station on a tile, or -1. */
export function getStationIndexAt(world: Grid, x: number, y: number): number {
  const tile = getTile(world, x, y);
  return tile !== null && tile.kind === 'station' ? tile.station : -1;
}

/** The centre of a tile in world units. */
export function tileCenter(x: number, y: number): Vec {
  return { x: x + 0.5, y: y + 0.5 };
}

/** The grid tile that contains a world position. */
export function toTile(x: number, y: number): Vec {
  return { x: Math.floor(x), y: Math.floor(y) };
}

/** The direction a floor belt pushes right now, honouring reversals. */
export function getBeltDirection(world: Pick<World, 'isBeltReversed'>, tile: Tile): Direction | null {
  if (tile.belt === null) return null;
  return world.isBeltReversed ? reverseDirection(tile.belt) : tile.belt;
}
