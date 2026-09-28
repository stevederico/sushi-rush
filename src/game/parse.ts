import { COOKER_PORTIONS } from './constants.ts';
import type { Direction, LevelDef, Station, Tile, Vec } from './types.ts';

export interface ParsedLevel {
  width: number;
  height: number;
  tiles: Tile[][];
  stations: Station[];
  spawns: Vec[];
  catDoor: Vec | null;
}

const FLOOR_BELTS: Record<string, Direction> = { '>': 'right', '<': 'left', '^': 'up', v: 'down' };
const ITEM_BELTS: Record<string, Direction> = { '}': 'right', '{': 'left', ']': 'down', '[': 'up' };
const SPAWNS = ['1', '2'];

function createStation(char: string, x: number, y: number): Station | null {
  const itemBelt = ITEM_BELTS[char];
  if (itemBelt !== undefined) return { kind: 'belt', x, y, direction: itemBelt, item: null, offset: 0 };
  switch (char) {
    case 'C': return { kind: 'counter', x, y, item: null };
    case 'B': return { kind: 'board', x, y, item: null, progress: 0 };
    case 'M': return { kind: 'mat', x, y, parts: [], roll: null, progress: 0 };
    case 'S': return { kind: 'crate', x, y, ingredient: 'salmon' };
    case 'T': return { kind: 'crate', x, y, ingredient: 'tuna' };
    case 'U': return { kind: 'crate', x, y, ingredient: 'cucumber' };
    case 'N': return { kind: 'crate', x, y, ingredient: 'nori' };
    case 'R': return { kind: 'cooker', x, y, state: 'ready', timer: 0, portions: COOKER_PORTIONS };
    case 'P': return { kind: 'plates', x, y };
    case 'V': return { kind: 'serve', x, y };
    case 'X': return { kind: 'trash', x, y };
    default: return null;
  }
}

function createFloor(char: string): Tile | null {
  if (char === '.' || SPAWNS.includes(char)) return { kind: 'floor', belt: null, station: -1 };
  const belt = FLOOR_BELTS[char];
  return belt === undefined ? null : { kind: 'floor', belt, station: -1 };
}

/**
 * Turns a level's text map into tiles, stations and spawn points.
 * Unknown characters become walls so a typo can never open a hole in the kitchen.
 */
export function parseLevel(level: LevelDef): ParsedLevel {
  const parsed: ParsedLevel = {
    width: Math.max(...level.map.map((row) => row.length)),
    height: level.map.length,
    tiles: [],
    stations: [],
    spawns: [],
    catDoor: null,
  };
  level.map.forEach((row, y) => {
    const tiles: Tile[] = [];
    for (let x = 0; x < parsed.width; x += 1) {
      tiles.push(parseTile(parsed, row.charAt(x), x, y));
    }
    parsed.tiles.push(tiles);
  });
  return parsed;
}

function parseTile(parsed: ParsedLevel, char: string, x: number, y: number): Tile {
  const floor = createFloor(char);
  if (floor !== null) {
    const spawn = SPAWNS.indexOf(char);
    if (spawn !== -1) parsed.spawns[spawn] = { x, y };
    return floor;
  }
  const station = createStation(char, x, y);
  if (station !== null) {
    parsed.stations.push(station);
    return { kind: 'station', belt: null, station: parsed.stations.length - 1 };
  }
  if (char === 'D') parsed.catDoor = { x, y };
  return { kind: 'wall', belt: null, station: -1 };
}
