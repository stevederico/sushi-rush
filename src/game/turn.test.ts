import { describe, expect, it } from 'vitest';
import { updateBot } from './bot.ts';
import { getLevel, turnLevel } from './levels.ts';
import { RECIPES } from './recipes.ts';
import { getChef, runUntil } from './testKit.ts';
import { turnWorld, turnVec } from './turn.ts';
import type { World } from './types.ts';
import { createWorld } from './world.ts';

function makeShift(levelId: number, chefCount = 1): World {
  const world = createWorld(getLevel(levelId), chefCount, 5);
  world.orderTimer = 100000;
  return world;
}

describe('turnVec', () => {
  it('swaps x and y', () => {
    expect(turnVec({ x: 2, y: 5 })).toEqual({ x: 5, y: 2 });
  });
});

describe('turnWorld', () => {
  it('swaps the size of the kitchen', () => {
    const world = makeShift(3);
    turnWorld(world);
    expect([world.width, world.height]).toEqual([7, 13]);
  });

  it('gives back the same kitchen when turned twice', () => {
    const world = makeShift(3, 2);
    getChef(world).goal = { tile: { x: 3, y: 1 }, station: { x: 3, y: 0 } };
    const before = structuredClone(world);
    turnWorld(world);
    turnWorld(world);
    expect(world).toEqual(before);
  });

  it('moves a chef to the mirrored spot', () => {
    const world = makeShift(1);
    const chef = getChef(world);
    chef.x = 3.25;
    chef.y = 1.75;
    turnWorld(world);
    expect([chef.x, chef.y]).toEqual([1.75, 3.25]);
  });

  it('keeps each station on the tile that points at it', () => {
    const world = makeShift(3);
    turnWorld(world);
    const misplaced = world.stations.filter((station, index) => world.tiles[station.y]?.[station.x]?.station !== index);
    expect(misplaced).toEqual([]);
  });

  it('turns floor belts with the room', () => {
    const world = makeShift(3);
    turnWorld(world);
    expect(world.tiles[5]?.[2]?.belt).toBe('up');
  });

  it('turns item belts with the room', () => {
    const world = makeShift(3);
    turnWorld(world);
    const belts = world.stations.filter((station) => station.kind === 'belt');
    expect(new Set(belts.map((belt) => belt.direction))).toEqual(new Set(['down', 'up']));
  });

  it('lays out tiles like a kitchen built turned from the start', () => {
    const world = makeShift(2);
    turnWorld(world);
    const shape = (tiles: World['tiles']): string[] => tiles.map((row) => row.map((tile) => `${tile.kind}:${tile.belt}`).join(' '));
    expect(shape(world.tiles)).toEqual(shape(createWorld(turnLevel(getLevel(2)), 1, 5).tiles));
  });

  it('places stations like a kitchen built turned from the start', () => {
    const world = makeShift(3);
    turnWorld(world);
    const built = createWorld(turnLevel(getLevel(3)), 1, 5);
    const spots = (stations: World['stations']): string[] => stations.map((st) => `${st.kind}@${st.x},${st.y}`).sort();
    expect(spots(world.stations)).toEqual(spots(built.stations));
  });

  it('lets a chef finish a dish started before the turn', () => {
    const world = makeShift(1);
    world.orders = [{ id: 1, recipe: RECIPES.salmonNigiri, timeLeft: 1000 }];
    const chef = getChef(world);
    runUntil(world, () => chef.holding !== null, 10, () => updateBot(world, chef));
    turnWorld(world);
    const isServed = runUntil(world, () => world.served === 1, 40, () => updateBot(world, chef));
    expect(isServed).toBe(true);
  });
});
