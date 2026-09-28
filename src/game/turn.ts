import { turnLevel } from './levels.ts';
import type { Cat, Chef, Direction, Station, Tile, Vec, World } from './types.ts';

/** How a direction reads after the kitchen is flipped along its diagonal. */
const TURNED: Record<Direction, Direction> = { right: 'down', down: 'right', left: 'up', up: 'left' };

/** Mirrors a point along the diagonal. */
export function turnVec(point: Vec): Vec {
  return { x: point.y, y: point.x };
}

function turnInPlace(point: Vec): void {
  const { x } = point;
  point.x = point.y;
  point.y = x;
}

function turnTiles(world: World): Tile[][] {
  const tiles: Tile[][] = [];
  for (let x = 0; x < world.width; x += 1) {
    tiles.push(
      world.tiles.map((row) => {
        const tile = row[x];
        if (tile === undefined) return { kind: 'wall', belt: null, station: -1 };
        return { ...tile, belt: tile.belt === null ? null : TURNED[tile.belt] };
      }),
    );
  }
  return tiles;
}

function turnStation(station: Station): void {
  turnInPlace(station);
  if (station.kind === 'belt') station.direction = TURNED[station.direction];
}

function turnChef(chef: Chef): void {
  turnInPlace(chef);
  turnInPlace(chef.facing);
  if (chef.goal === null) return;
  turnInPlace(chef.goal.tile);
  if (chef.goal.station !== null) turnInPlace(chef.goal.station);
}

function turnCat(cat: Cat): void {
  turnInPlace(cat);
  turnInPlace(cat.facing);
  turnInPlace(cat.door);
  for (const step of cat.path) turnInPlace(step);
}

/**
 * Flips a running kitchen along its diagonal, so a wide room becomes a tall one or back.
 * Everything keeps its place relative to everything else, so play carries on mid-shift.
 * Turning twice gives back the kitchen you started with.
 */
export function turnWorld(world: World): void {
  world.tiles = turnTiles(world);
  const { width } = world;
  world.width = world.height;
  world.height = width;
  world.level = turnLevel(world.level);
  world.stations.forEach(turnStation);
  world.chefs.forEach(turnChef);
  if (world.cat !== null) turnCat(world.cat);
  for (const event of world.events) turnInPlace(event);
}
