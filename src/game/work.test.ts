import { describe, expect, it } from 'vitest';
import { COOK_TIME, ROLL_TIME, SLICE_TIME } from './constants.ts';
import { useStation } from './interact.ts';
import { makeIngredient, makeRoll } from './items.ts';
import { IDLE, getChef, getStation, indexOf, makeWorld, run } from './testKit.ts';
import type { World } from './types.ts';
import { getCookProgress } from './work.ts';

const MAP = ['BMR', '1..'];

function startSlicing(world: World): void {
  const chef = getChef(world);
  chef.facing = { x: 0, y: -1 };
  getStation(world, 'board').item = makeIngredient('salmon');
  useStation(world, chef, indexOf(world, getStation(world, 'board')));
}

function startRolling(world: World): void {
  const chef = getChef(world);
  chef.x = 1.5;
  chef.facing = { x: 0, y: -1 };
  getStation(world, 'mat').parts = [makeIngredient('nori'), makeIngredient('rice'), makeIngredient('tuna', true)];
  useStation(world, chef, indexOf(world, getStation(world, 'mat')));
}

describe('slicing', () => {
  it('finishes after the slice time', () => {
    const world = makeWorld(MAP);
    startSlicing(world);
    run(world, SLICE_TIME + 0.1);
    expect(getStation(world, 'board').item).toEqual(makeIngredient('salmon', true));
  });

  it('is not done halfway', () => {
    const world = makeWorld(MAP);
    startSlicing(world);
    run(world, SLICE_TIME / 2);
    expect(getStation(world, 'board').progress).toBeCloseTo(0.5, 1);
  });

  it('frees the chef when done', () => {
    const world = makeWorld(MAP);
    startSlicing(world);
    run(world, SLICE_TIME + 0.1);
    expect(getChef(world).working).toBe(-1);
  });

  it('stops when the chef walks away', () => {
    const world = makeWorld(MAP);
    startSlicing(world);
    run(world, 0.3, [{ ...IDLE, moveY: 1 }]);
    expect(getChef(world).working).toBe(-1);
  });

  it('keeps its progress for later', () => {
    const world = makeWorld(MAP);
    startSlicing(world);
    run(world, SLICE_TIME / 2);
    run(world, 0.3, [{ ...IDLE, moveY: 1 }]);
    expect(getStation(world, 'board').progress).toBeGreaterThan(0.4);
  });

  it('makes chopping sounds along the way', () => {
    const world = makeWorld(MAP);
    startSlicing(world);
    run(world, SLICE_TIME + 0.1);
    expect(world.events.filter((event) => event.type === 'chop').length).toBeGreaterThan(3);
  });
});

describe('rolling', () => {
  it('turns the parts into a roll', () => {
    const world = makeWorld(MAP);
    startRolling(world);
    run(world, ROLL_TIME + 0.1);
    expect(getStation(world, 'mat').roll).toEqual(makeRoll('tuna'));
  });

  it('uses up the parts', () => {
    const world = makeWorld(MAP);
    startRolling(world);
    run(world, ROLL_TIME + 0.1);
    expect(getStation(world, 'mat').parts).toEqual([]);
  });
});

describe('rice cooker', () => {
  it('refills after the cook time', () => {
    const world = makeWorld(MAP);
    const cooker = getStation(world, 'cooker');
    cooker.state = 'empty';
    cooker.portions = 0;
    useStation(world, getChef(world), indexOf(world, cooker));
    run(world, COOK_TIME + 0.1);
    expect(cooker).toMatchObject({ state: 'ready', portions: 4 });
  });

  it('reports progress from zero to one', () => {
    expect([getCookProgress(COOK_TIME), getCookProgress(0)]).toEqual([0, 1]);
  });
});
