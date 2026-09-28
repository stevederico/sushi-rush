import { describe, expect, it } from 'vitest';
import { makePlate } from './items.ts';
import { getOrderInterval, getStreakMultiplier, scoreOrder, serveDish, spawnOrder, updateOrders } from './orders.ts';
import { RECIPES } from './recipes.ts';
import { makeWorld, run } from './testKit.ts';
import type { Order } from './types.ts';
import { getStarTargets, getStars } from './world.ts';

const MAP = ['1..', 'V..'];
const SPOT = { x: 0, y: 1 };

function makeOrder(timeLeft: number, id = 1): Order {
  return { id, recipe: RECIPES.salmonNigiri, timeLeft };
}

describe('getStreakMultiplier', () => {
  it('starts at one', () => {
    expect(getStreakMultiplier(0)).toBe(1);
  });

  it('grows with the streak', () => {
    expect(getStreakMultiplier(2)).toBe(3);
  });

  it('tops out at four', () => {
    expect(getStreakMultiplier(9)).toBe(4);
  });
});

describe('scoreOrder', () => {
  it('pays the full tip for a fresh ticket', () => {
    expect(scoreOrder(makeOrder(RECIPES.salmonNigiri.patience), 0)).toBe(35 + 8);
  });

  it('pays no tip at the last second', () => {
    expect(scoreOrder(makeOrder(0), 0)).toBe(35);
  });

  it('multiplies the tip by the streak', () => {
    expect(scoreOrder(makeOrder(RECIPES.salmonNigiri.patience), 3)).toBe(35 + 32);
  });
});

describe('serveDish', () => {
  it('adds the points to the score', () => {
    const world = makeWorld(MAP);
    world.orders = [makeOrder(RECIPES.salmonNigiri.patience)];
    serveDish(world, makePlate(['rice', 'salmon']), SPOT);
    expect(world.score).toBe(43);
  });

  it('grows the streak', () => {
    const world = makeWorld(MAP);
    world.orders = [makeOrder(55)];
    serveDish(world, makePlate(['rice', 'salmon']), SPOT);
    expect(world.streak).toBe(1);
  });

  it('closes the most urgent matching ticket', () => {
    const world = makeWorld(MAP);
    world.orders = [makeOrder(40, 1), makeOrder(12, 2)];
    serveDish(world, makePlate(['rice', 'salmon']), SPOT);
    expect(world.orders.map((order) => order.id)).toEqual([1]);
  });

  it('refuses a dish with no ticket', () => {
    const world = makeWorld(MAP);
    world.orders = [makeOrder(40)];
    expect(serveDish(world, makePlate(['tuna']), SPOT)).toBe(false);
  });
});

describe('updateOrders', () => {
  it('removes a ticket when its time runs out', () => {
    const world = makeWorld(MAP);
    world.orders = [makeOrder(0.5)];
    updateOrders(world, 1);
    expect(world.orders).toHaveLength(0);
  });

  it('charges a penalty for a missed ticket', () => {
    const world = makeWorld(MAP);
    world.score = 50;
    world.orders = [makeOrder(0.5)];
    updateOrders(world, 1);
    expect(world.score).toBe(35);
  });

  it('never drops the score below zero', () => {
    const world = makeWorld(MAP);
    world.orders = [makeOrder(0.5)];
    updateOrders(world, 1);
    expect(world.score).toBe(0);
  });

  it('resets the streak on a miss', () => {
    const world = makeWorld(MAP);
    world.streak = 3;
    world.orders = [makeOrder(0.5)];
    updateOrders(world, 1);
    expect(world.streak).toBe(0);
  });

  it('brings in a ticket when the timer runs out', () => {
    const world = makeWorld(MAP);
    world.orderTimer = 0.5;
    updateOrders(world, 1);
    expect(world.orders).toHaveLength(1);
  });

  it('holds new tickets while the rail is full', () => {
    const world = makeWorld(MAP, { maxOrders: 1 });
    world.orders = [makeOrder(40)];
    world.orderTimer = 0;
    updateOrders(world, 1);
    expect(world.orders).toHaveLength(1);
  });

  it('hurries the next ticket when the rail is empty', () => {
    const world = makeWorld(MAP);
    updateOrders(world, 0.1);
    expect(world.orderTimer).toBeLessThanOrEqual(2);
  });
});

describe('spawnOrder', () => {
  it('draws only from the level menu', () => {
    const world = makeWorld(MAP, { recipes: ['tunaMaki'] });
    expect(spawnOrder(world)?.recipe.id).toBe('tunaMaki');
  });

  it('caps repeats of the same dish', () => {
    const world = makeWorld(MAP, { recipes: ['tunaMaki'] });
    spawnOrder(world);
    spawnOrder(world);
    expect(spawnOrder(world)).toBeNull();
  });

  it('gives each ticket its own id', () => {
    const world = makeWorld(MAP);
    const ids = [spawnOrder(world)?.id, spawnOrder(world)?.id];
    expect(ids).toEqual([1, 2]);
  });

  it('plays out the same way for the same seed', () => {
    const menu = { recipes: [...makeWorld(MAP).level.recipes, 'tunaNigiri' as const, 'tunaSashimi' as const] };
    const names = [makeWorld(MAP, menu), makeWorld(MAP, menu)].map((world) =>
      [spawnOrder(world), spawnOrder(world), spawnOrder(world)].map((order) => order?.recipe.id),
    );
    expect(names[0]).toEqual(names[1]);
  });
});

describe('getOrderInterval', () => {
  it('shrinks as the shift goes on', () => {
    const early = makeWorld(MAP, { orderInterval: 20 });
    const late = makeWorld(MAP, { orderInterval: 20 });
    late.elapsed = late.level.duration;
    expect(getOrderInterval(late)).toBeLessThan(getOrderInterval(early));
  });

  it('is shorter for two chefs', () => {
    const solo = makeWorld(MAP, { orderInterval: 20 });
    const duo = makeWorld(['1.2', 'V..'], { orderInterval: 20 }, 2);
    expect(getOrderInterval(duo)).toBeLessThan(getOrderInterval(solo));
  });
});

describe('shift clock', () => {
  it('ends the shift when time is up', () => {
    const world = makeWorld(MAP, { duration: 1 });
    run(world, 1.2);
    expect(world.isOver).toBe(true);
  });

  it('freezes the world after the shift', () => {
    const world = makeWorld(MAP, { duration: 1 });
    run(world, 3);
    expect(world.elapsed).toBeCloseTo(1, 1);
  });
});

describe('stars', () => {
  const level = makeWorld(MAP).level;

  it('gives no stars below the first target', () => {
    expect(getStars(level, 9, 1)).toBe(0);
  });

  it('gives three stars at the top target', () => {
    expect(getStars(level, 30, 1)).toBe(3);
  });

  it('asks more of two chefs', () => {
    expect(getStarTargets(level, 2)).toEqual([15, 30, 45]);
  });
});
