import {
  CO_OP_ORDER_FACTOR,
  EXPIRE_PENALTY,
  ORDER_RAMP,
  STREAK_MAX,
  TIP_MAX,
} from './constants.ts';
import { emit, emitAtTile } from './events.ts';
import { RECIPES, isSameDish } from './recipes.ts';
import { nextRandom, pickRandom } from './rng.ts';
import type { Order, PlateItem, Recipe, Vec, World } from './types.ts';

/** Most tickets for the same dish that can be open at once. */
const MAX_DUPLICATES = 2;
/** With an empty rail the next ticket arrives at least this soon. */
const EMPTY_RAIL_DELAY = 2;

/** The tip multiplier earned by a run of tickets served without a miss. */
export function getStreakMultiplier(streak: number): number {
  return Math.min(Math.max(streak, 0) + 1, STREAK_MAX);
}

/** Points for a served ticket: the dish price plus a tip for speed, scaled by the streak. */
export function scoreOrder(order: Order, streak: number): number {
  const freshness = Math.max(0, Math.min(1, order.timeLeft / order.recipe.patience));
  const tip = Math.round(TIP_MAX * freshness) * getStreakMultiplier(streak);
  return order.recipe.points + tip;
}

/** Seconds until the next ticket, shrinking as the shift goes on. */
export function getOrderInterval(world: World): number {
  const progress = Math.min(1, world.elapsed / world.level.duration);
  const ramp = 1 - (1 - ORDER_RAMP) * progress;
  const crew = world.chefs.length > 1 ? CO_OP_ORDER_FACTOR : 1;
  const jitter = 0.85 + nextRandom(world) * 0.3;
  return world.level.orderInterval * ramp * crew * jitter;
}

function pickRecipe(world: World): Recipe | null {
  const pool = world.level.recipes.filter((id) => {
    const open = world.orders.filter((order) => order.recipe.id === id).length;
    return open < MAX_DUPLICATES;
  });
  const id = pickRandom(world, pool);
  return id === undefined ? null : RECIPES[id];
}

/** Adds a ticket to the rail. Returns null when every dish is already at its limit. */
export function spawnOrder(world: World): Order | null {
  const recipe = pickRecipe(world);
  if (recipe === null) return null;
  const order: Order = { id: world.nextOrderId, recipe, timeLeft: recipe.patience };
  world.nextOrderId += 1;
  world.orders.push(order);
  emit(world, 'newOrder', 0, 0);
  return order;
}

function expireOrders(world: World): void {
  const open: Order[] = [];
  for (const order of world.orders) {
    if (order.timeLeft > 0) {
      open.push(order);
      continue;
    }
    world.expired += 1;
    world.streak = 0;
    world.score = Math.max(0, world.score - EXPIRE_PENALTY);
    emit(world, 'expired', 0, 0, -EXPIRE_PENALTY);
  }
  world.orders = open;
}

/** Ticks ticket timers, drops expired tickets and brings in new ones. */
export function updateOrders(world: World, dt: number): void {
  for (const order of world.orders) order.timeLeft -= dt;
  expireOrders(world);
  world.orderTimer -= dt;
  if (world.orders.length === 0) world.orderTimer = Math.min(world.orderTimer, EMPTY_RAIL_DELAY);
  if (world.orderTimer > 0 || world.orders.length >= world.level.maxOrders) return;
  if (spawnOrder(world) !== null) world.orderTimer = getOrderInterval(world);
}

/**
 * Hands a plate to the pass. The most urgent matching ticket is closed and scored.
 * Returns false when no open ticket wants the dish.
 */
export function serveDish(world: World, plate: PlateItem, at: Vec): boolean {
  const matches = world.orders.filter((order) => isSameDish(plate.contents, order.recipe.tokens));
  matches.sort((a, b) => a.timeLeft - b.timeLeft);
  const order = matches[0];
  if (order === undefined) return false;
  const points = scoreOrder(order, world.streak);
  world.orders = world.orders.filter((open) => open.id !== order.id);
  world.score += points;
  world.streak += 1;
  world.served += 1;
  emitAtTile(world, 'served', at, points);
  return true;
}
