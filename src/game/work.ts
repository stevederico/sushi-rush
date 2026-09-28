import { CHOP_INTERVAL, COOK_TIME, COOKER_PORTIONS, ROLL_TIME, SLICE_TIME } from './constants.ts';
import { emitAtTile } from './events.ts';
import { getMatFilling, isMatReady, isSliceable, makeRoll } from './items.ts';
import type { BoardStation, Chef, MatStation, World } from './types.ts';

function crossedInterval(before: number, after: number, duration: number): boolean {
  const beats = duration / CHOP_INTERVAL;
  return Math.floor(before * beats) !== Math.floor(after * beats);
}

function slice(world: World, chef: Chef, board: BoardStation, dt: number): void {
  if (!isSliceable(board.item)) {
    chef.working = -1;
    return;
  }
  const before = board.progress;
  board.progress = Math.min(1, before + dt / SLICE_TIME);
  if (crossedInterval(before, board.progress, SLICE_TIME)) emitAtTile(world, 'chop', board);
  if (board.progress < 1) return;
  board.item.sliced = true;
  board.progress = 0;
  chef.working = -1;
  emitAtTile(world, 'sliced', board);
}

function roll(world: World, chef: Chef, mat: MatStation, dt: number): void {
  const filling = getMatFilling(mat.parts);
  if (mat.roll !== null || filling === null || !isMatReady(mat.parts)) {
    chef.working = -1;
    return;
  }
  const before = mat.progress;
  mat.progress = Math.min(1, before + dt / ROLL_TIME);
  if (crossedInterval(before, mat.progress, ROLL_TIME)) emitAtTile(world, 'chop', mat);
  if (mat.progress < 1) return;
  mat.roll = makeRoll(filling);
  mat.parts = [];
  mat.progress = 0;
  chef.working = -1;
  emitAtTile(world, 'rolled', mat);
}

/** Advances the slicing or rolling job a chef is busy with. */
export function updateWork(world: World, chef: Chef, dt: number): void {
  const station = world.stations[chef.working];
  if (station === undefined) {
    chef.working = -1;
    return;
  }
  if (station.kind === 'board') slice(world, chef, station, dt);
  else if (station.kind === 'mat') roll(world, chef, station, dt);
  else chef.working = -1;
}

/** Counts down rice cookers and fills them when the rice is done. */
export function updateCookers(world: World, dt: number): void {
  for (const station of world.stations) {
    if (station.kind !== 'cooker' || station.state !== 'cooking') continue;
    station.timer -= dt;
    if (station.timer > 0) continue;
    station.timer = 0;
    station.state = 'ready';
    station.portions = COOKER_PORTIONS;
    emitAtTile(world, 'cookDone', station);
  }
}

/** Share of the cooking time that has passed, from 0 to 1. */
export function getCookProgress(timer: number): number {
  return Math.max(0, Math.min(1, 1 - timer / COOK_TIME));
}
