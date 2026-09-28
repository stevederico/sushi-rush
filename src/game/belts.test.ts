import { describe, expect, it } from 'vitest';
import { getBeltPush, isBeltWarning } from './belts.ts';
import { makeIngredient } from './items.ts';
import { IDLE, getChef, getStation, makeWorld, run } from './testKit.ts';

describe('floor belts', () => {
  it('carry an idle chef along', () => {
    const world = makeWorld(['1>>>>>.']);
    getChef(world).x = 1.5;
    run(world, 1);
    expect(getChef(world).x).toBeGreaterThan(3.5);
  });

  it('leave chefs on plain floor alone', () => {
    const world = makeWorld(['1..', '>>>']);
    run(world, 1);
    expect(getChef(world).x).toBe(0.5);
  });

  it('slow a chef who walks against them', () => {
    const world = makeWorld(['1<<<<<<<<<']);
    getChef(world).x = 1.5;
    run(world, 1, [{ ...IDLE, moveX: 1 }]);
    expect(getChef(world).x).toBeCloseTo(1.5 + 4.2 - 2.6, 1);
  });

  it('push nothing on plain floor', () => {
    const world = makeWorld(['1..']);
    expect(getBeltPush(world, 0.5, 0.5)).toEqual({ x: 0, y: 0 });
  });

  it('push down on a downward belt', () => {
    const world = makeWorld(['1v.']);
    expect(getBeltPush(world, 1.5, 0.5).y).toBeGreaterThan(0);
  });
});

describe('flipping belts', () => {
  const MAP = ['1>>>.'];

  it('reverse after the flip time', () => {
    const world = makeWorld(MAP, { beltFlipEvery: 5 });
    run(world, 5.1);
    expect(getBeltPush(world, 1.5, 0.5).x).toBeLessThan(0);
  });

  it('flip back after two periods', () => {
    const world = makeWorld(MAP, { beltFlipEvery: 5 });
    run(world, 10.2);
    expect(world.isBeltReversed).toBe(false);
  });

  it('warn shortly before a flip', () => {
    const world = makeWorld(MAP, { beltFlipEvery: 5 });
    run(world, 3);
    expect(isBeltWarning(world)).toBe(true);
  });

  it('stay quiet early in the period', () => {
    const world = makeWorld(MAP, { beltFlipEvery: 5 });
    run(world, 1);
    expect(isBeltWarning(world)).toBe(false);
  });

  it('never flip on a steady level', () => {
    const world = makeWorld(MAP);
    run(world, 20);
    expect(world.isBeltReversed).toBe(false);
  });
});

describe('item belts', () => {
  it('carry an item to the end of the line', () => {
    const world = makeWorld(['}}}', '1..']);
    getStation(world, 'belt', 0).item = makeIngredient('salmon');
    run(world, 4);
    expect(getStation(world, 'belt', 2).item).toEqual(makeIngredient('salmon'));
  });

  it('park the item in the middle of the last tile', () => {
    const world = makeWorld(['}}}', '1..']);
    getStation(world, 'belt', 0).item = makeIngredient('salmon');
    run(world, 6);
    expect(getStation(world, 'belt', 2).offset).toBe(0.5);
  });

  it('queue items behind a parked one', () => {
    const world = makeWorld(['}}}', '1..']);
    getStation(world, 'belt', 2).item = makeIngredient('tuna');
    getStation(world, 'belt', 0).item = makeIngredient('salmon');
    run(world, 6);
    expect(getStation(world, 'belt', 1).item).toEqual(makeIngredient('salmon'));
  });

  it('run leftward too', () => {
    const world = makeWorld(['{{{', '1..']);
    getStation(world, 'belt', 2).item = makeIngredient('nori');
    run(world, 4);
    expect(getStation(world, 'belt', 0).item).toEqual(makeIngredient('nori'));
  });

  it('run downward in a turned kitchen', () => {
    const world = makeWorld([']1', '].', '].']);
    getStation(world, 'belt', 0).item = makeIngredient('nori');
    run(world, 4);
    expect(getStation(world, 'belt', 2).item).toEqual(makeIngredient('nori'));
  });

  it('drop items into a trash at the end', () => {
    const world = makeWorld(['}}X', '1..']);
    getStation(world, 'belt', 0).item = makeIngredient('salmon');
    run(world, 4);
    expect([getStation(world, 'belt', 0).item, getStation(world, 'belt', 1).item]).toEqual([null, null]);
  });
});
