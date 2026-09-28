import { describe, expect, it } from 'vitest';
import { isCatBait } from './cat.ts';
import { CAT_FIRST_VISIT } from './constants.ts';
import { makeIngredient, makePlate } from './items.ts';
import { getChef, getStation, makeWorld, run, runUntil } from './testKit.ts';
import type { Cat, World } from './types.ts';

const MAP = ['#CCCCCC#', 'D......1', '########'];

function makeCatWorld(): World {
  return makeWorld(MAP, { hasCat: true });
}

function getCat(world: World): Cat {
  if (world.cat === null) throw new Error('No cat');
  return world.cat;
}

describe('isCatBait', () => {
  it('counts raw fish', () => {
    expect(isCatBait(makeIngredient('tuna'))).toBe(true);
  });

  it('counts sliced fish', () => {
    expect(isCatBait(makeIngredient('salmon', true))).toBe(true);
  });

  it('ignores cucumber', () => {
    expect(isCatBait(makeIngredient('cucumber'))).toBe(false);
  });

  it('ignores plated food', () => {
    expect(isCatBait(makePlate(['salmon']))).toBe(false);
  });
});

describe('cat thief', () => {
  it('exists only on levels that have one', () => {
    expect(makeWorld(MAP).cat).toBeNull();
  });

  it('stays away while there is no fish out', () => {
    const world = makeCatWorld();
    run(world, CAT_FIRST_VISIT + 5);
    expect(getCat(world).state).toBe('away');
  });

  it('comes in when fish is left out', () => {
    const world = makeCatWorld();
    getStation(world, 'counter', 1).item = makeIngredient('salmon');
    run(world, CAT_FIRST_VISIT + 0.5);
    expect(getCat(world).state).not.toBe('away');
  });

  it('steals unguarded fish', () => {
    const world = makeCatWorld();
    const counter = getStation(world, 'counter', 1);
    counter.item = makeIngredient('salmon');
    runUntil(world, () => counter.item === null, 40);
    expect(counter.item).toBeNull();
  });

  it('goes home after the theft', () => {
    const world = makeCatWorld();
    getStation(world, 'counter', 1).item = makeIngredient('salmon');
    run(world, CAT_FIRST_VISIT + 12);
    expect(getCat(world).state).toBe('away');
  });

  it('runs from a chef who stands guard', () => {
    const world = makeCatWorld();
    const counter = getStation(world, 'counter', 1);
    counter.item = makeIngredient('salmon');
    getChef(world).x = 2.5;
    run(world, CAT_FIRST_VISIT + 12);
    expect(counter.item).toEqual(makeIngredient('salmon'));
  });

  it('announces being shooed', () => {
    const world = makeCatWorld();
    getStation(world, 'counter', 1).item = makeIngredient('salmon');
    getChef(world).x = 2.5;
    run(world, CAT_FIRST_VISIT + 12);
    expect(world.events.some((event) => event.type === 'catShoo')).toBe(true);
  });

  it('gives up when the fish is picked up first', () => {
    const world = makeCatWorld();
    const counter = getStation(world, 'counter', 4);
    counter.item = makeIngredient('salmon');
    run(world, CAT_FIRST_VISIT + 0.6);
    counter.item = null;
    run(world, 8);
    expect(getCat(world).carrying).toBeNull();
  });
});
