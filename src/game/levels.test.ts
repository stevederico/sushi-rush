import { describe, expect, it } from 'vitest';
import { toFoodToken, makeIngredient } from './items.ts';
import { LEVELS, getLevel, turnLevel } from './levels.ts';
import { parseLevel } from './parse.ts';
import { findPath, getAccessTiles } from './pathfinding.ts';
import { RECIPES } from './recipes.ts';
import type { LevelDef, StationKind } from './types.ts';

function countStations(level: LevelDef, kind: StationKind): number {
  return parseLevel(level).stations.filter((station) => station.kind === kind).length;
}

function hasCrate(level: LevelDef, ingredient: string): boolean {
  return parseLevel(level).stations.some((station) => station.kind === 'crate' && station.ingredient === ingredient);
}

describe('getLevel', () => {
  it('finds a level by id', () => {
    expect(getLevel(2).name).toBe('Belt Line');
  });

  it('falls back to the first shift', () => {
    expect(getLevel(404).id).toBe(1);
  });
});

const TURNED_LEVELS = LEVELS.map((level) => ({ ...turnLevel(level), name: `${level.name} turned` }));

describe.each([...LEVELS, ...TURNED_LEVELS])('level $id: $name', (level) => {
  const parsed = parseLevel(level);

  it('has rows of equal width', () => {
    expect(new Set(level.map.map((row) => row.length)).size).toBe(1);
  });

  it('has a spawn for both chefs', () => {
    expect(parsed.spawns.filter((spawn) => spawn !== undefined)).toHaveLength(2);
  });

  it('has the stations every shift needs', () => {
    const kinds: StationKind[] = ['serve', 'plates', 'board', 'cooker', 'trash', 'counter'];
    expect(kinds.filter((kind) => countStations(level, kind) === 0)).toEqual([]);
  });

  it('lets the first chef reach every station', () => {
    const spawn = parsed.spawns[0] ?? { x: 0, y: 0 };
    const cutOff = parsed.stations.filter((station) => findPath(parsed, spawn, getAccessTiles(parsed, station)) === null);
    expect(cutOff).toEqual([]);
  });

  it('stocks the fish its recipes need', () => {
    const fish = level.recipes
      .flatMap((id) => RECIPES[id].tokens)
      .map((token) => token.replace('roll:', ''))
      .filter((name) => name !== 'rice');
    expect(fish.filter((name) => !hasCrate(level, name))).toEqual([]);
  });

  it('has a mat and nori when it sells rolls', () => {
    const sellsRolls = level.recipes.some((id) => RECIPES[id].tokens.some((token) => token.startsWith('roll:')));
    const canRoll = countStations(level, 'mat') > 0 && hasCrate(level, 'nori');
    expect(canRoll).toBe(sellsRolls || canRoll);
  });

  it('orders its star targets from low to high', () => {
    expect([...level.stars].sort((a, b) => a - b)).toEqual(level.stars);
  });

  it('has a cat door when the cat visits', () => {
    expect(parsed.catDoor !== null).toBe(level.hasCat);
  });
});

describe('parseLevel', () => {
  const level = getLevel(3);
  const parsed = parseLevel(level);

  it('reads floor belts with their direction', () => {
    expect(parsed.tiles[2]?.[5]?.belt).toBe('left');
  });

  it('reads item belts as stations', () => {
    expect(countStations(level, 'belt')).toBe(6);
  });

  it('turns unknown characters into walls', () => {
    const odd = parseLevel({ ...level, map: ['1?.'] });
    expect(odd.tiles[0]?.[1]?.kind).toBe('wall');
  });

  it('starts the rice cooker full', () => {
    const cooker = parsed.stations.find((station) => station.kind === 'cooker');
    expect(cooker).toMatchObject({ state: 'ready', portions: 4 });
  });

  it('keeps rice plateable, so a full cooker is useful', () => {
    expect(toFoodToken(makeIngredient('rice'))).toBe('rice');
  });
});

describe('turnLevel', () => {
  const level = getLevel(3);
  const turned = turnLevel(level);

  it('swaps width and height', () => {
    expect([turned.map.length, turned.map[0]?.length]).toEqual([13, 7]);
  });

  it('gives back the original when turned twice', () => {
    expect(turnLevel(turned).map).toEqual(level.map);
  });

  it('turns rightward floor belts downward', () => {
    expect(parseLevel(turned).tiles[5]?.[4]?.belt).toBe('down');
  });

  it('turns item belts too', () => {
    const belts = parseLevel(turned).stations.filter((station) => station.kind === 'belt');
    expect(new Set(belts.map((belt) => belt.direction))).toEqual(new Set(['down', 'up']));
  });

  it('keeps every station', () => {
    expect(parseLevel(turned).stations).toHaveLength(parseLevel(level).stations.length);
  });

  it('keeps the rules of the shift', () => {
    expect([turned.id, turned.duration, turned.stars]).toEqual([level.id, level.duration, level.stars]);
  });
});
