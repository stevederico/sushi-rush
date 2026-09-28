import { updateFloorBelts, updateItemBelts } from './belts.ts';
import { createCat, updateCat } from './cat.ts';
import { createChef, updateChef } from './chef.ts';
import { CO_OP_STAR_FACTOR, FIRST_ORDER_DELAY, MAX_STEP } from './constants.ts';
import { emit } from './events.ts';
import { separateBodies } from './movement.ts';
import { updateOrders } from './orders.ts';
import { parseLevel } from './parse.ts';
import type { ChefInput, GameEvent, LevelDef, Vec, World } from './types.ts';
import { updateCookers } from './work.ts';

const NO_INPUT: ChefInput = { moveX: 0, moveY: 0, interact: false, dash: false };
const FINAL_COUNTDOWN = 10;
const FALLBACK_SPAWN: Vec = { x: 1, y: 1 };

/** Builds a fresh shift for one or two chefs. The seed fixes the order of tickets. */
export function createWorld(level: LevelDef, chefCount: number, seed: number): World {
  const parsed = parseLevel(level);
  const first = parsed.spawns[0] ?? FALLBACK_SPAWN;
  const spawns = [first, parsed.spawns[1] ?? first];
  const chefs = spawns.slice(0, Math.max(1, Math.min(2, chefCount))).map((spawn, id) => createChef(id, spawn));
  return {
    level,
    width: parsed.width,
    height: parsed.height,
    tiles: parsed.tiles,
    stations: parsed.stations,
    chefs,
    orders: [],
    cat: level.hasCat && parsed.catDoor !== null ? createCat(parsed.catDoor) : null,
    events: [],
    score: 0,
    streak: 0,
    served: 0,
    expired: 0,
    timeLeft: level.duration,
    elapsed: 0,
    orderTimer: FIRST_ORDER_DELAY,
    nextOrderId: 1,
    beltTimer: level.beltFlipEvery,
    isBeltReversed: false,
    isOver: false,
    seed,
  };
}

function updateClock(world: World, dt: number): void {
  const before = world.timeLeft;
  world.elapsed += dt;
  world.timeLeft = Math.max(0, before - dt);
  const isLastSeconds = world.timeLeft <= FINAL_COUNTDOWN && world.timeLeft > 0;
  if (isLastSeconds && Math.ceil(before) !== Math.ceil(world.timeLeft)) emit(world, 'tick', 0, 0);
  if (world.timeLeft > 0) return;
  world.isOver = true;
  emit(world, 'timeUp', 0, 0);
}

/**
 * Advances the whole kitchen by one step.
 * `inputs` holds one entry per chef. Long steps are clamped so nothing tunnels through a wall.
 */
export function updateWorld(world: World, inputs: readonly ChefInput[], dt: number): void {
  if (world.isOver) return;
  const step = Math.min(dt, MAX_STEP);
  updateFloorBelts(world, step);
  world.chefs.forEach((chef, index) => updateChef(world, chef, inputs[index] ?? NO_INPUT, step));
  const [first, second] = world.chefs;
  if (first !== undefined && second !== undefined) separateBodies(world, first, second, step);
  updateItemBelts(world, step);
  updateCookers(world, step);
  updateOrders(world, step);
  updateCat(world, step);
  updateClock(world, step);
}

/** Hands over the queued events and clears the queue. */
export function drainEvents(world: World): GameEvent[] {
  const events = world.events;
  world.events = [];
  return events;
}

/** Stars earned for a score: 0 to 3. Two chefs need more points for each star. */
export function getStars(level: LevelDef, score: number, chefCount: number): number {
  const factor = chefCount > 1 ? CO_OP_STAR_FACTOR : 1;
  return level.stars.filter((threshold) => score >= Math.round(threshold * factor)).length;
}

/** The score needed for each star, adjusted for the crew size. */
export function getStarTargets(level: LevelDef, chefCount: number): number[] {
  const factor = chefCount > 1 ? CO_OP_STAR_FACTOR : 1;
  return level.stars.map((threshold) => Math.round(threshold * factor));
}
