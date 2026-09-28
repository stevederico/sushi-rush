import { isMatReady, isSliceable, toMatSlot } from './items.ts';
import type { MatSlot } from './items.ts';
import { findNearest, getHeldItem, hasFood, hasIngredient, isCrateOf, isEmpty, isMatFor } from './plannerSearch.ts';
import type { StationTest } from './plannerSearch.ts';
import type { Chef, FillingId, FoodToken, Recipe, World } from './types.ts';

export interface Plan {
  /** Index of the station to use next. */
  station: number;
  /** Short coaching line for the player. */
  label: string;
  /** True when the step throws food away because this dish cannot use it. */
  isDiscard: boolean;
}

export interface Context {
  world: World;
  chef: Chef;
  recipe: Recipe;
  /** Tokens the dish still needs beyond what is already plated. */
  remaining: FoodToken[];
  /** Station holding the plate being built, or -1. */
  plateStation: number;
}

const SLOT_ORDER: readonly MatSlot[] = ['filling', 'nori', 'rice'];
const NAMES: Record<string, string> = { salmon: 'Salmon', tuna: 'Tuna', cucumber: 'Cucumber', rice: 'Rice', nori: 'Nori' };

/** Plans a trip to the nearest reachable station that passes the test. */
export function go(ctx: Context, test: StationTest, label: string, isDiscard = false): Plan | null {
  const station = findNearest(ctx.world, ctx.chef, test);
  return station === -1 ? null : { station, label, isDiscard };
}

/** The filling inside a roll token, or null for other food. */
export function toFilling(token: FoodToken): FillingId | null {
  const filling = token.startsWith('roll:') ? token.slice(5) : '';
  return filling === 'salmon' || filling === 'tuna' || filling === 'cucumber' ? filling : null;
}

function getRice(ctx: Context): Plan | null {
  const loose = go(ctx, hasIngredient('rice', false), 'Grab The Rice');
  if (loose !== null) return loose;
  return (
    go(ctx, (station) => station.kind === 'cooker' && station.state === 'ready', 'Scoop Some Rice') ??
    go(ctx, (station) => station.kind === 'cooker' && station.state === 'empty', 'Start The Rice Cooker')
  );
}

/**
 * Frees a cutting board when every one is taken: slice whatever raw food sits on one,
 * or lift off the leftovers so they can be used or thrown away.
 */
function clearBoard(ctx: Context): Plan | null {
  const isBoard: StationTest = (station) => station.kind === 'board';
  const hasLeftovers: StationTest = (station) => isBoard(station) && !isSliceable(getHeldItem(station));
  return (
    go(ctx, hasLeftovers, 'Clear A Cutting Board') ??
    go(ctx, (station) => isBoard(station) && isSliceable(getHeldItem(station)), 'Slice What Is On The Board')
  );
}

function getSliced(ctx: Context, id: FillingId, canGrab: boolean): Plan | null {
  const name = NAMES[id] ?? id;
  const sliced = canGrab ? go(ctx, hasIngredient(id, true), `Grab The Sliced ${name}`) : null;
  const onBoard = sliced ?? go(ctx, hasIngredient(id, false, true), `Slice The ${name}`);
  if (onBoard !== null) return onBoard;
  if (findNearest(ctx.world, ctx.chef, isEmpty('board')) === -1) return clearBoard(ctx);
  return go(ctx, hasIngredient(id, false, false), `Grab The ${name}`) ?? go(ctx, isCrateOf(id), `Grab ${name} From The Crate`);
}

function getMatPart(ctx: Context, slot: MatSlot, filling: FillingId): Plan | null {
  if (slot === 'filling') return getSliced(ctx, filling, true);
  if (slot === 'rice') return getRice(ctx);
  return go(ctx, hasIngredient('nori', false), 'Grab The Nori') ?? go(ctx, isCrateOf('nori'), 'Grab Nori From The Crate');
}

function prepareRoll(ctx: Context, filling: FillingId): Plan | null {
  const index = findNearest(ctx.world, ctx.chef, isMatFor(filling));
  const mat = ctx.world.stations[index];
  if (mat === undefined || mat.kind !== 'mat') return null;
  if (isMatReady(mat.parts)) return { station: index, label: 'Roll It Up', isDiscard: false };
  const filled = mat.parts.map((part) => toMatSlot(part));
  for (const slot of SLOT_ORDER) {
    if (filled.includes(slot)) continue;
    const plan = getMatPart(ctx, slot, filling);
    if (plan !== null) return plan;
  }
  return null;
}

/** The next empty-handed step toward making a token ready to plate. */
export function prepare(ctx: Context, token: FoodToken): Plan | null {
  if (token === 'rice') return getRice(ctx);
  if (token === 'salmon' || token === 'tuna') return getSliced(ctx, token, false);
  const filling = toFilling(token);
  return filling === null ? null : prepareRoll(ctx, filling);
}

/** True when food for the token is already sitting somewhere, ready to plate. */
export function isReady(ctx: Context, token: FoodToken): boolean {
  return findNearest(ctx.world, ctx.chef, hasFood(token)) !== -1;
}
