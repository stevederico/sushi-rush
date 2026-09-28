import { describe, expect, it } from 'vitest';
import { makeIngredient } from './items.ts';
import { commandChef } from './navigation.ts';
import { IDLE, getChef, getStation, makeWorld, run, runUntil } from './testKit.ts';

const MAP = ['#S#B#', '1....', '.###.', '....V', '>>>>>', '##C##'];

describe('commandChef', () => {
  it('accepts a reachable floor tile', () => {
    const world = makeWorld(MAP);
    expect(commandChef(world, getChef(world), { x: 3, y: 3 })).toBe(true);
  });

  it('rejects a wall', () => {
    const world = makeWorld(MAP);
    expect(commandChef(world, getChef(world), { x: 1, y: 2 })).toBe(false);
  });

  it('rejects a tile outside the kitchen', () => {
    const world = makeWorld(MAP);
    expect(commandChef(world, getChef(world), { x: 40, y: 1 })).toBe(false);
  });

  it('aims for the floor beside a station', () => {
    const world = makeWorld(MAP);
    commandChef(world, getChef(world), { x: 1, y: 0 });
    expect(getChef(world).goal).toEqual({ tile: { x: 1, y: 1 }, station: { x: 1, y: 0 } });
  });
});

describe('tap navigation', () => {
  it('walks to a tapped floor tile', () => {
    const world = makeWorld(MAP);
    const chef = getChef(world);
    commandChef(world, chef, { x: 0, y: 3 });
    runUntil(world, () => chef.goal === null, 5);
    expect([Math.floor(chef.x), Math.floor(chef.y)]).toEqual([0, 3]);
  });

  it('uses a tapped station on arrival', () => {
    const world = makeWorld(MAP);
    const chef = getChef(world);
    commandChef(world, chef, { x: 1, y: 0 });
    runUntil(world, () => chef.goal === null, 5);
    expect(chef.holding).toEqual(makeIngredient('salmon'));
  });

  it('starts slicing at a tapped board', () => {
    const world = makeWorld(MAP);
    const board = getStation(world, 'board');
    board.item = makeIngredient('tuna');
    commandChef(world, getChef(world), { x: 3, y: 0 });
    run(world, 4);
    expect(board.item).toEqual(makeIngredient('tuna', true));
  });

  it('reaches a station that sits behind a floor belt', () => {
    const world = makeWorld(MAP);
    const chef = getChef(world);
    chef.holding = makeIngredient('salmon');
    commandChef(world, chef, { x: 2, y: 5 });
    runUntil(world, () => chef.holding === null, 8);
    expect(getStation(world, 'counter').item).toEqual(makeIngredient('salmon'));
  });

  it('escapes the end of a belt that pins it against a counter', () => {
    const world = makeWorld(['1.v', '..v', 'CCv']);
    const chef = getChef(world);
    chef.x = 2.3;
    chef.y = 2.69;
    commandChef(world, chef, { x: 0, y: 0 });
    runUntil(world, () => chef.goal === null, 4);
    expect([Math.floor(chef.x), Math.floor(chef.y)]).toEqual([0, 0]);
  });

  it('holds its place on a belt long enough to use a station', () => {
    const world = makeWorld(['1....', '>>>>>', '##C##']);
    const chef = getChef(world);
    chef.holding = makeIngredient('tuna');
    commandChef(world, chef, { x: 2, y: 2 });
    runUntil(world, () => chef.holding === null, 4);
    expect(getStation(world, 'counter').item).toEqual(makeIngredient('tuna'));
  });

  it('gives way to the keyboard', () => {
    const world = makeWorld(MAP);
    const chef = getChef(world);
    commandChef(world, chef, { x: 0, y: 3 });
    run(world, 0.1, [{ ...IDLE, moveX: 1 }]);
    expect(chef.goal).toBeNull();
  });
});
