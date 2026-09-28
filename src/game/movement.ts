import { CHEF_RADIUS, CHEF_SPEED } from './constants.ts';
import { isWalkable } from './grid.ts';
import type { World } from './types.ts';

type Grid = Pick<World, 'tiles' | 'stations' | 'width' | 'height'>;

interface Body {
  x: number;
  y: number;
}

const EPSILON = 0.0001;
/** How strongly two touching chefs turn around each other, relative to the push apart. */
const SWIRL = 0.8;
/** How far off-centre a chef can be and still get steered through a gap. */
const NUDGE_RANGE = 0.45;

function isBoxFree(world: Grid, x: number, y: number): boolean {
  const left = Math.floor(x - CHEF_RADIUS);
  const right = Math.floor(x + CHEF_RADIUS);
  const top = Math.floor(y - CHEF_RADIUS);
  const bottom = Math.floor(y + CHEF_RADIUS);
  for (let ty = top; ty <= bottom; ty += 1) {
    for (let tx = left; tx <= right; tx += 1) {
      if (!isWalkable(world, tx, ty)) return false;
    }
  }
  return true;
}

function clampToTileEdge(position: number, delta: number): number {
  if (delta > 0) return Math.floor(position + delta + CHEF_RADIUS) - CHEF_RADIUS - EPSILON;
  return Math.floor(position + delta - CHEF_RADIUS) + 1 + CHEF_RADIUS + EPSILON;
}

function nudgeToward(value: number, target: number, step: number): number {
  const gap = target - value;
  if (Math.abs(gap) > NUDGE_RANGE) return value;
  return value + Math.sign(gap) * Math.min(Math.abs(gap), step);
}

function moveX(world: Grid, body: Body, dx: number, canNudge: boolean): void {
  if (dx === 0) return;
  if (isBoxFree(world, body.x + dx, body.y) || !isBoxFree(world, body.x, body.y)) {
    body.x += dx;
    return;
  }
  body.x = clampToTileEdge(body.x, dx);
  const row = Math.floor(body.y);
  const ahead = Math.floor(body.x + Math.sign(dx) * (CHEF_RADIUS + 0.1));
  if (!canNudge || !isWalkable(world, ahead, row)) return;
  const nudged = nudgeToward(body.y, row + 0.5, Math.abs(dx));
  if (isBoxFree(world, body.x, nudged)) body.y = nudged;
}

function moveY(world: Grid, body: Body, dy: number, canNudge: boolean): void {
  if (dy === 0) return;
  if (isBoxFree(world, body.x, body.y + dy) || !isBoxFree(world, body.x, body.y)) {
    body.y += dy;
    return;
  }
  body.y = clampToTileEdge(body.y, dy);
  const column = Math.floor(body.x);
  const ahead = Math.floor(body.y + Math.sign(dy) * (CHEF_RADIUS + 0.1));
  if (!canNudge || !isWalkable(world, column, ahead)) return;
  const nudged = nudgeToward(body.x, column + 0.5, Math.abs(dy));
  if (isBoxFree(world, nudged, body.y)) body.x = nudged;
}

/**
 * Moves a body by a delta, sliding along walls and counters.
 * A body that clips a corner is eased toward the open lane so gaps are easy to enter.
 * A body that somehow overlaps a wall already may move freely, so it can always get out.
 */
export function moveBody(world: Grid, body: Body, dx: number, dy: number): void {
  moveX(world, body, dx, dy === 0);
  moveY(world, body, dy, dx === 0);
}

/**
 * Pushes two overlapping chefs apart so they cannot stand inside each other.
 * The push also turns them a little around each other, so two chefs that meet
 * head on slide past instead of shoving in place forever.
 */
export function separateBodies(world: Grid, a: Body, b: Body, dt: number): void {
  const gapX = b.x - a.x;
  const gapY = b.y - a.y;
  const distance = Math.hypot(gapX, gapY);
  const overlap = CHEF_RADIUS * 2 - distance;
  if (overlap <= 0) return;
  const push = Math.min(overlap / 2, CHEF_SPEED * dt);
  const nx = distance > EPSILON ? gapX / distance : 1;
  const ny = distance > EPSILON ? gapY / distance : 0;
  const slide = push * SWIRL;
  moveBody(world, a, -nx * push + ny * slide, -ny * push - nx * slide);
  moveBody(world, b, nx * push - ny * slide, ny * push + nx * slide);
}
