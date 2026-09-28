import { describe, expect, it } from 'vitest';
import { getFocusOrder, getHint, updateBot } from './bot.ts';
import { makeIngredient, makePlate } from './items.ts';
import { LEVELS, turnLevel } from './levels.ts';
import { RECIPES } from './recipes.ts';
import { getChef, makeWorld, runUntil } from './testKit.ts';
import type { LevelDef, RecipeId, World } from './types.ts';
import { createWorld, getStars } from './world.ts';

/** Seconds a lone bot gets to cook one dish, as a share of the customer's patience. */
const PATIENCE_SHARE = 0.85;

function cookOne(level: LevelDef, recipe: RecipeId): { world: World; isServed: boolean } {
  const world = createWorld(level, 1, 3);
  world.orderTimer = 100000;
  world.orders = [{ id: 1, recipe: RECIPES[recipe], timeLeft: 1000 }];
  const chef = getChef(world);
  const limit = RECIPES[recipe].patience * PATIENCE_SHARE;
  const isServed = runUntil(world, () => world.served === 1, limit, () => updateBot(world, chef));
  return { world, isServed };
}

function playShift(level: LevelDef, seed: number, chefCount = 1): World {
  const world = createWorld(level, chefCount, seed);
  runUntil(world, () => world.isOver, level.duration + 1, () => {
    for (const chef of world.chefs) updateBot(world, chef);
  });
  return world;
}

describe('getFocusOrder', () => {
  it('picks the oldest ticket', () => {
    const world = makeWorld(['1.V']);
    world.orders = [
      { id: 5, recipe: RECIPES.tunaMaki, timeLeft: 10 },
      { id: 2, recipe: RECIPES.tunaNigiri, timeLeft: 50 },
    ];
    expect(getFocusOrder(world)?.id).toBe(2);
  });

  it('returns null with an empty rail', () => {
    expect(getFocusOrder(makeWorld(['1.V']))).toBeNull();
  });
});

describe('getHint', () => {
  it('starts a nigiri at the fish crate', () => {
    const world = createWorld(LEVELS[0] ?? makeWorld(['1']).level, 1, 1);
    world.orders = [{ id: 1, recipe: RECIPES.salmonNigiri, timeLeft: 50 }];
    expect(getHint(world, getChef(world))?.label).toBe('Grab Salmon From The Crate');
  });

  it('looks past the oldest ticket when it cannot use what the chef holds', () => {
    const world = createWorld(LEVELS[0] ?? makeWorld(['1']).level, 1, 1);
    world.orders = [
      { id: 1, recipe: RECIPES.tunaSashimi, timeLeft: 50 },
      { id: 2, recipe: RECIPES.salmonNigiri, timeLeft: 50 },
    ];
    getChef(world).holding = makeIngredient('salmon');
    expect(getHint(world, getChef(world))?.label).toBe('Put It On A Cutting Board');
  });

  it('suggests the trash only when no ticket wants the food', () => {
    const world = createWorld(LEVELS[0] ?? makeWorld(['1']).level, 1, 1);
    world.orders = [{ id: 1, recipe: RECIPES.tunaSashimi, timeLeft: 50 }];
    getChef(world).holding = makeIngredient('salmon');
    expect(getHint(world, getChef(world))?.isDiscard).toBe(true);
  });

  it('sends the chef to a finished dish left on a counter', () => {
    const world = createWorld(LEVELS[0] ?? makeWorld(['1']).level, 1, 1);
    world.orders = [{ id: 1, recipe: RECIPES.salmonNigiri, timeLeft: 50 }];
    const counter = world.stations.find((station) => station.kind === 'counter');
    if (counter?.kind === 'counter') counter.item = makePlate(['rice', 'salmon']);
    expect(getHint(world, getChef(world))?.label).toBe('Pick Up The Plate');
  });

  it('clears a cutting board when leftovers fill every one', () => {
    const world = createWorld(LEVELS[0] ?? makeWorld(['1']).level, 1, 1);
    world.orders = [{ id: 1, recipe: RECIPES.tunaSashimi, timeLeft: 50 }];
    for (const station of world.stations) {
      if (station.kind === 'board') station.item = makeIngredient('salmon', true);
    }
    expect(getHint(world, getChef(world))?.label).toBe('Clear A Cutting Board');
  });

  it('gives the second chef the second ticket', () => {
    const world = createWorld(LEVELS[0] ?? makeWorld(['1']).level, 2, 1);
    world.orders = [
      { id: 1, recipe: RECIPES.salmonSashimi, timeLeft: 50 },
      { id: 2, recipe: RECIPES.tunaSashimi, timeLeft: 50 },
    ];
    expect(getHint(world, getChef(world, 1))?.label).toBe('Grab Tuna From The Crate');
  });

  it('has nothing to say without tickets', () => {
    const world = makeWorld(['1.V']);
    expect(getHint(world, getChef(world))).toBeNull();
  });
});

const KITCHENS = [...LEVELS, ...LEVELS.map((level) => ({ ...turnLevel(level), name: `${level.name} turned` }))];

describe.each(KITCHENS)('bot on level $id: $name', (level) => {
  it.each(level.recipes)('cooks and serves %s within the customer patience', (recipe) => {
    expect(cookOne(level, recipe).isServed).toBe(true);
  });

  it('earns at least one star over a full shift', () => {
    const world = playShift(level, 11);
    expect(getStars(level, world.score, 1)).toBeGreaterThanOrEqual(1);
  });

  it('earns at least two stars with two chefs sharing the work', () => {
    const world = playShift(level, 2, 2);
    expect(getStars(level, world.score, 2)).toBeGreaterThanOrEqual(2);
  });

  it('serves more dishes with two chefs than with one', () => {
    expect(playShift(level, 2, 2).served).toBeGreaterThan(playShift(level, 2, 1).served);
  });
});
