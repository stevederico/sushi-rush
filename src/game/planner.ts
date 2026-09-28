import { isFilling, toFoodToken, toMatSlot } from './items.ts';
import { findNearest, getHeldItem, hasFood, isEmpty, isMatFor } from './plannerSearch.ts';
import type { StationTest } from './plannerSearch.ts';
import { go, isReady, prepare, toFilling } from './plannerSteps.ts';
import type { Context, Plan } from './plannerSteps.ts';
import { isSameDish, isSubset } from './recipes.ts';
import type { Chef, FoodToken, Item, PlateItem, Recipe, World } from './types.ts';

export type { Plan } from './plannerSteps.ts';

function subtract(whole: readonly FoodToken[], part: readonly FoodToken[]): FoodToken[] {
  const rest = [...whole];
  for (const token of part) {
    const index = rest.indexOf(token);
    if (index !== -1) rest.splice(index, 1);
  }
  return rest;
}

function isPlateFor(recipe: Recipe, isDone: boolean): StationTest {
  return (station) => {
    const item = getHeldItem(station);
    if (item === null || item.kind !== 'plate') return false;
    return isDone ? isSameDish(item.contents, recipe.tokens) : isSubset(item.contents, recipe.tokens);
  };
}

/** The plate to build on: a finished one if any is waiting, else the nearest that still fits. */
function findPlate(world: World, chef: Chef, recipe: Recipe): number {
  const done = findNearest(world, chef, isPlateFor(recipe, true));
  return done !== -1 ? done : findNearest(world, chef, isPlateFor(recipe, false));
}

function planEmptyHanded(ctx: Context): Plan | null {
  for (const token of ctx.remaining) {
    if (isReady(ctx, token)) continue;
    const plan = prepare(ctx, token);
    if (plan !== null) return plan;
  }
  const isPlateDone = ctx.plateStation !== -1 && ctx.remaining.length === 0;
  if (!isPlateDone && !ctx.remaining.some((token) => isReady(ctx, token))) return null;
  if (ctx.plateStation !== -1) return { station: ctx.plateStation, label: 'Pick Up The Plate', isDiscard: false };
  return go(ctx, (station) => station.kind === 'plates', 'Grab A Plate');
}

function planWithPlate(ctx: Context, plate: PlateItem): Plan | null {
  if (isSameDish(plate.contents, ctx.recipe.tokens)) {
    return go(ctx, (station) => station.kind === 'serve', 'Serve It At The Window');
  }
  if (!isSubset(plate.contents, ctx.recipe.tokens)) {
    return go(ctx, (station) => station.kind === 'trash', 'Scrape The Plate', true);
  }
  for (const token of subtract(ctx.recipe.tokens, plate.contents)) {
    const plan = go(ctx, hasFood(token), 'Add It To The Plate');
    if (plan !== null) return plan;
  }
  return go(ctx, isEmpty('counter'), 'Set The Plate Down');
}

/** Index of a mat that still needs this item for the dish, or -1. */
function getMatFor(ctx: Context, item: Item): number {
  const slot = toMatSlot(item);
  if (slot === null || item.kind !== 'ingredient') return -1;
  for (const token of ctx.remaining) {
    const filling = toFilling(token);
    if (filling === null || isReady(ctx, token)) continue;
    if (slot === 'filling' && item.id !== filling) continue;
    const isOpen: StationTest = (station) =>
      isMatFor(filling)(station) && station.kind === 'mat' && !station.parts.some((part) => toMatSlot(part) === slot);
    const mat = findNearest(ctx.world, ctx.chef, isOpen);
    if (mat !== -1) return mat;
  }
  return -1;
}

function isRawAndWanted(ctx: Context, item: Item): boolean {
  if (item.kind !== 'ingredient' || item.sliced || !isFilling(item.id)) return false;
  return ctx.recipe.tokens.some((token) => token === item.id || toFilling(token) === item.id);
}

function planWithFood(ctx: Context, item: Item): Plan | null {
  if (isRawAndWanted(ctx, item)) {
    return go(ctx, isEmpty('board'), 'Put It On A Cutting Board') ?? go(ctx, isEmpty('counter'), 'Set It Down');
  }
  const mat = getMatFor(ctx, item);
  if (mat !== -1) return { station: mat, label: 'Lay It On The Rolling Mat', isDiscard: false };
  const token = toFoodToken(item);
  if (token !== null && ctx.remaining.includes(token)) {
    if (ctx.plateStation !== -1) return { station: ctx.plateStation, label: 'Add It To The Plate', isDiscard: false };
    return go(ctx, (station) => station.kind === 'plates', 'Put It On A Plate');
  }
  return go(ctx, (station) => station.kind === 'trash', 'Toss It In The Trash', true);
}

/**
 * Works out the next station a chef should use to finish a dish.
 * Returns null when the only thing left to do is wait, for example while rice cooks.
 */
export function planNextStep(world: World, chef: Chef, recipe: Recipe): Plan | null {
  const held = chef.holding;
  const plateStation = findPlate(world, chef, recipe);
  const plateHost = world.stations[plateStation];
  const plated = plateHost === undefined ? null : getHeldItem(plateHost);
  const onPlate = held?.kind === 'plate' ? held.contents : plated?.kind === 'plate' ? plated.contents : [];
  const ctx: Context = { world, chef, recipe, plateStation, remaining: subtract(recipe.tokens, onPlate) };
  if (held === null) return planEmptyHanded(ctx);
  if (held.kind === 'plate') return planWithPlate(ctx, held);
  return planWithFood(ctx, held);
}
