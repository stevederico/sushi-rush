import { describe, expect, it } from 'vitest';
import { findPath, getAccessTiles, getStepCost, getTravelCosts } from './pathfinding.ts';
import { makeWorld } from './testKit.ts';

const MAP = ['#####', '#1.C#', '#.#.#', '#...#', '#####'];

describe('findPath', () => {
  const world = makeWorld(MAP);

  it('returns a single tile when already there', () => {
    expect(findPath(world, { x: 1, y: 1 }, [{ x: 1, y: 1 }])).toEqual([{ x: 1, y: 1 }]);
  });

  it('walks around obstacles', () => {
    const path = findPath(world, { x: 1, y: 1 }, [{ x: 3, y: 2 }]);
    expect(path).toHaveLength(6);
  });

  it('ends on the goal', () => {
    const path = findPath(world, { x: 1, y: 1 }, [{ x: 3, y: 3 }]);
    expect(path?.[path.length - 1]).toEqual({ x: 3, y: 3 });
  });

  it('picks the nearest of several goals', () => {
    const path = findPath(world, { x: 1, y: 1 }, [{ x: 3, y: 3 }, { x: 2, y: 1 }]);
    expect(path).toEqual([{ x: 1, y: 1 }, { x: 2, y: 1 }]);
  });

  it('returns null for a goal inside a wall', () => {
    expect(findPath(world, { x: 1, y: 1 }, [{ x: 0, y: 0 }])).toBeNull();
  });

  it('returns null when starting inside a wall', () => {
    expect(findPath(world, { x: 0, y: 0 }, [{ x: 1, y: 1 }])).toBeNull();
  });

  it('returns null without goals', () => {
    expect(findPath(world, { x: 1, y: 1 }, [])).toBeNull();
  });

  it('does not wrap around the edge of the map', () => {
    const open = makeWorld(['1..', '###', '...']);
    expect(findPath(open, { x: 0, y: 0 }, [{ x: 0, y: 2 }])).toBeNull();
  });
});

describe('getAccessTiles', () => {
  it('lists the floor beside a station', () => {
    const world = makeWorld(MAP);
    expect(getAccessTiles(world, { x: 3, y: 1 })).toEqual([{ x: 2, y: 1 }, { x: 3, y: 2 }]);
  });
});

describe('getStepCost', () => {
  const world = makeWorld(['1.>.']);

  it('charges the least for plain floor', () => {
    expect(getStepCost(world, { x: 1, y: 0 }, { x: 1, y: 0 })).toBe(2);
  });

  it('charges a little more to ride a belt', () => {
    expect(getStepCost(world, { x: 2, y: 0 }, { x: 1, y: 0 })).toBe(3);
  });

  it('charges more to cross a belt', () => {
    expect(getStepCost(world, { x: 2, y: 0 }, { x: 0, y: 1 })).toBe(4);
  });

  it('charges the most to walk into the push', () => {
    expect(getStepCost(world, { x: 2, y: 0 }, { x: -1, y: 0 })).toBe(8);
  });

  it('follows a reversed belt', () => {
    const flipped = makeWorld(['1.>.']);
    flipped.isBeltReversed = true;
    expect(getStepCost(flipped, { x: 2, y: 0 }, { x: -1, y: 0 })).toBe(3);
  });
});

describe('findPath with belts', () => {
  const MAP = ['.....', '.<<<.', '.###.', '.>>>.', '.....'];

  it('rides the belt that goes its way', () => {
    const world = makeWorld(['1....', ...MAP.slice(1)]);
    const path = findPath(world, { x: 4, y: 2 }, [{ x: 0, y: 2 }]);
    expect(path?.some((tile) => tile.y === 1)).toBe(true);
  });

  it('takes the other lane when heading the opposite way', () => {
    const world = makeWorld(['1....', ...MAP.slice(1)]);
    const path = findPath(world, { x: 0, y: 2 }, [{ x: 4, y: 2 }]);
    expect(path?.some((tile) => tile.y === 3)).toBe(true);
  });

  it('walks around a short belt rather than against it', () => {
    const world = makeWorld(['1....', '.<<<.', '.....']);
    const path = findPath(world, { x: 0, y: 1 }, [{ x: 4, y: 1 }]);
    expect(path?.filter((tile) => tile.y === 1 && tile.x > 0 && tile.x < 4)).toEqual([]);
  });

  it('still crosses a belt when there is no way around', () => {
    const world = makeWorld(['1', 'v', '.']);
    expect(findPath(world, { x: 0, y: 2 }, [{ x: 0, y: 0 }])).toHaveLength(3);
  });
});

describe('getTravelCosts', () => {
  it('prices the start at zero', () => {
    const world = makeWorld(MAP);
    expect(getTravelCosts(world, { x: 1, y: 1 })({ x: 1, y: 1 })).toBe(0);
  });

  it('prices a tile by its cheapest walk', () => {
    const world = makeWorld(MAP);
    expect(getTravelCosts(world, { x: 1, y: 1 })({ x: 3, y: 3 })).toBe(8);
  });

  it('prices walls as unreachable', () => {
    const world = makeWorld(MAP);
    expect(getTravelCosts(world, { x: 1, y: 1 })({ x: 2, y: 2 })).toBe(Infinity);
  });

  it('prices tiles outside the map as unreachable', () => {
    const world = makeWorld(MAP);
    expect(getTravelCosts(world, { x: 1, y: 1 })({ x: -1, y: 9 })).toBe(Infinity);
  });
});
