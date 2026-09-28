import { COOK_TIME } from './constants.ts';
import { emitAtTile } from './events.ts';
import { addToPlate, canAddToMat, isMatReady, makeIngredient, makePlate } from './items.ts';
import { serveDish } from './orders.ts';
import type { Chef, CookerStation, CrateStation, MatStation, Station, World } from './types.ts';

/** Rolling mat: lay parts down, roll them, or take the roll. */
export function useMat(world: World, chef: Chef, mat: MatStation, index: number): void {
  const held = chef.holding;
  if (held === null) {
    takeFromMat(world, chef, mat, index);
    return;
  }
  if (held.kind === 'plate' && mat.roll !== null && addToPlate(held, mat.roll)) {
    mat.roll = null;
    emitAtTile(world, 'plated', mat);
    return;
  }
  if (mat.roll === null && canAddToMat(mat.parts, held)) {
    mat.parts.push(held);
    mat.progress = 0;
    chef.holding = null;
    emitAtTile(world, 'drop', mat);
    return;
  }
  emitAtTile(world, 'nope', mat);
}

function takeFromMat(world: World, chef: Chef, mat: MatStation, index: number): void {
  if (mat.roll !== null) {
    chef.holding = mat.roll;
    mat.roll = null;
    emitAtTile(world, 'pickup', mat);
    return;
  }
  if (isMatReady(mat.parts)) {
    chef.working = index;
    return;
  }
  const part = mat.parts.pop();
  if (part === undefined) return;
  chef.holding = part;
  emitAtTile(world, 'pickup', mat);
}

/** Crate: take a raw ingredient, or put the same one back. */
export function useCrate(world: World, chef: Chef, crate: CrateStation): void {
  const held = chef.holding;
  if (held === null) {
    chef.holding = makeIngredient(crate.ingredient);
    emitAtTile(world, 'pickup', crate);
    return;
  }
  if (held.kind === 'ingredient' && held.id === crate.ingredient && !held.sliced) {
    chef.holding = null;
    emitAtTile(world, 'drop', crate);
    return;
  }
  emitAtTile(world, 'nope', crate);
}

/** Rice cooker: start it when empty, scoop rice when ready. */
export function useCooker(world: World, chef: Chef, cooker: CookerStation): void {
  if (cooker.state === 'empty') {
    cooker.state = 'cooking';
    cooker.timer = COOK_TIME;
    emitAtTile(world, 'cookStart', cooker);
    return;
  }
  if (cooker.state === 'cooking') {
    emitAtTile(world, 'nope', cooker);
    return;
  }
  const rice = makeIngredient('rice');
  const held = chef.holding;
  if (held === null) {
    chef.holding = rice;
    emitAtTile(world, 'pickup', cooker);
  } else if (held.kind === 'plate' && addToPlate(held, rice)) {
    emitAtTile(world, 'plated', cooker);
  } else {
    emitAtTile(world, 'nope', cooker);
    return;
  }
  cooker.portions -= 1;
  if (cooker.portions <= 0) cooker.state = 'empty';
}

/** Plate stack: take a plate, return an empty one, or plate what is held. */
export function usePlates(world: World, chef: Chef, station: Station): void {
  const held = chef.holding;
  if (held === null) {
    chef.holding = makePlate();
    emitAtTile(world, 'pickup', station);
    return;
  }
  if (held.kind === 'plate' && held.contents.length === 0) {
    chef.holding = null;
    emitAtTile(world, 'drop', station);
    return;
  }
  const plate = makePlate();
  if (held.kind !== 'plate' && addToPlate(plate, held)) {
    chef.holding = plate;
    emitAtTile(world, 'plated', station);
    return;
  }
  emitAtTile(world, 'nope', station);
}

/** Trash: throw away loose food, or scrape a plate clean. */
export function useTrash(world: World, chef: Chef, station: Station): void {
  const held = chef.holding;
  if (held === null) return;
  if (held.kind === 'plate' && held.contents.length > 0) {
    held.contents = [];
  } else {
    chef.holding = null;
  }
  emitAtTile(world, 'trash', station);
}

/** Serving window: hand over a dish that matches an open ticket. */
export function useServe(world: World, chef: Chef, station: Station): void {
  const held = chef.holding;
  if (held === null) return;
  if (held.kind === 'plate' && serveDish(world, held, station)) {
    chef.holding = null;
    return;
  }
  emitAtTile(world, 'rejected', station);
}
