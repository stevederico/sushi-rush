import { describe, expect, it } from 'vitest';
import { CHEF_RADIUS } from './constants.ts';
import { moveBody, separateBodies } from './movement.ts';
import { IDLE, getChef, makeWorld, run } from './testKit.ts';

const ROOM = ['#####', '#1..#', '#...#', '#####'];

describe('moveBody', () => {
  it('moves freely over open floor', () => {
    const world = makeWorld(ROOM);
    const body = { x: 1.5, y: 1.5 };
    moveBody(world, body, 0.4, 0.2);
    expect(body).toEqual({ x: 1.9, y: 1.7 });
  });

  it('stops at a wall', () => {
    const world = makeWorld(ROOM);
    const body = { x: 1.5, y: 1.5 };
    moveBody(world, body, -0.9, 0);
    expect(body.x).toBeCloseTo(1 + CHEF_RADIUS, 3);
  });

  it('slides along a wall when moving diagonally', () => {
    const world = makeWorld(ROOM);
    const body = { x: 1.5, y: 1.5 };
    moveBody(world, body, 0.3, -0.9);
    expect(body.x).toBeCloseTo(1.8, 5);
  });

  it('stops at the edge of the map', () => {
    const world = makeWorld(['1..']);
    const body = { x: 2.5, y: 0.5 };
    moveBody(world, body, 0.9, 0);
    expect(body.x).toBeCloseTo(3 - CHEF_RADIUS, 3);
  });

  it('lets a body that overlaps a wall walk back out', () => {
    const world = makeWorld(ROOM);
    const body = { x: 1.1, y: 1.5 };
    moveBody(world, body, 0.3, 0);
    expect(body.x).toBeCloseTo(1.4, 5);
  });

  it('eases a chef into a gap it clips', () => {
    const world = makeWorld(['1.#', '...', '..#']);
    const body = { x: 1.5, y: 1.25 };
    for (let step = 0; step < 30; step += 1) moveBody(world, body, 0.05, 0);
    expect(body.x).toBeGreaterThan(2);
  });
});

describe('separateBodies', () => {
  it('pushes overlapping chefs apart', () => {
    const world = makeWorld(ROOM);
    const a = { x: 2, y: 2 };
    const b = { x: 2.2, y: 2 };
    for (let step = 0; step < 30; step += 1) separateBodies(world, a, b, 1 / 60);
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeCloseTo(CHEF_RADIUS * 2, 2);
  });

  it('leaves distant chefs alone', () => {
    const world = makeWorld(ROOM);
    const a = { x: 1.5, y: 1.5 };
    const b = { x: 3.5, y: 1.5 };
    separateBodies(world, a, b, 1 / 60);
    expect(a.x).toBe(1.5);
  });
});

describe('chef walking', () => {
  it('walks right at walking speed', () => {
    const world = makeWorld(['1.........']);
    run(world, 1, [{ ...IDLE, moveX: 1 }]);
    expect(getChef(world).x).toBeCloseTo(0.5 + 4.2, 1);
  });

  it('does not walk faster diagonally', () => {
    const world = makeWorld(['1....', '.....', '.....', '.....', '.....']);
    run(world, 0.5, [{ ...IDLE, moveX: 1, moveY: 1 }]);
    const chef = getChef(world);
    expect(Math.hypot(chef.x - 0.5, chef.y - 0.5)).toBeCloseTo(2.1, 1);
  });

  it('faces the way it walks', () => {
    const world = makeWorld(['1..']);
    run(world, 0.1, [{ ...IDLE, moveX: 1 }]);
    expect(getChef(world).facing).toEqual({ x: 1, y: 0 });
  });

  it('covers extra ground with a dash', () => {
    const plain = makeWorld(['1.........']);
    const dashing = makeWorld(['1.........']);
    run(plain, 0.2, [{ ...IDLE, moveX: 1 }]);
    run(dashing, 0.2, [{ ...IDLE, moveX: 1, dash: true }]);
    expect(getChef(dashing).x - getChef(plain).x).toBeGreaterThan(0.8);
  });

  it('lets two chefs squeeze past each other in a narrow lane', () => {
    const world = makeWorld(['1...2'], {}, 2);
    run(world, 1.5, [{ ...IDLE, moveX: 1 }, { ...IDLE, moveX: -1 }]);
    expect(getChef(world, 1).x).toBeLessThan(getChef(world, 0).x);
  });

  it('keeps two chefs from sharing a spot', () => {
    const world = makeWorld(['.....', '..1..', '.....', '.....', '..2..'], {}, 2);
    run(world, 1.5, [{ ...IDLE, moveY: 1 }, { ...IDLE, moveY: -1 }]);
    const [a, b] = [getChef(world, 0), getChef(world, 1)];
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(CHEF_RADIUS * 2 - 0.05);
  });

  it('turns two chefs meeting head on around each other in open floor', () => {
    const world = makeWorld(['.....', '..1..', '.....', '.....', '..2..'], {}, 2);
    run(world, 2, [{ ...IDLE, moveY: 1 }, { ...IDLE, moveY: -1 }]);
    expect(getChef(world, 0).y).toBeGreaterThan(getChef(world, 1).y);
  });
});
