import { REACH, REACH_TOLERANCE } from './constants.ts';
import { emitAtTile } from './events.ts';
import { getStationIndexAt } from './grid.ts';
import { addToPlate, isMatReady, isSliceable } from './items.ts';
import { useCooker, useCrate, useMat, usePlates, useServe, useTrash } from './stationActions.ts';
import type { BeltStation, BoardStation, Chef, CounterStation, Station, World } from './types.ts';

type Holder = CounterStation | BoardStation | BeltStation;

/** Index of the station in front of the chef's hands, or -1 when nothing is in reach. */
export function getTargetStation(world: World, chef: Chef): number {
  const reachX = chef.x + chef.facing.x * REACH;
  const reachY = chef.y + chef.facing.y * REACH;
  const tileX = Math.floor(chef.x);
  const tileY = Math.floor(chef.y);
  let best = -1;
  let bestDistance = REACH_TOLERANCE;
  for (let y = tileY - 1; y <= tileY + 1; y += 1) {
    for (let x = tileX - 1; x <= tileX + 1; x += 1) {
      const index = getStationIndexAt(world, x, y);
      if (index === -1) continue;
      const distance = Math.hypot(x + 0.5 - reachX, y + 0.5 - reachY);
      if (distance < bestDistance) {
        best = index;
        bestDistance = distance;
      }
    }
  }
  return best;
}

/** Tries to merge what the chef holds with what sits on a station. */
function combine(world: World, chef: Chef, station: Holder): boolean {
  const held = chef.holding;
  const placed = station.item;
  if (held === null || placed === null) return false;
  if (held.kind === 'plate' && addToPlate(held, placed)) {
    station.item = null;
    emitAtTile(world, 'plated', station);
    return true;
  }
  if (placed.kind === 'plate' && addToPlate(placed, held)) {
    chef.holding = null;
    emitAtTile(world, 'plated', station);
    return true;
  }
  return false;
}

function useHolder(world: World, chef: Chef, station: Holder, index: number): void {
  if (chef.holding === null) {
    if (station.item === null) return;
    if (station.kind === 'board' && isSliceable(station.item)) {
      chef.working = index;
      return;
    }
    chef.holding = station.item;
    station.item = null;
    emitAtTile(world, 'pickup', station);
    return;
  }
  if (station.item === null) {
    station.item = chef.holding;
    chef.holding = null;
    if (station.kind === 'board') station.progress = 0;
    if (station.kind === 'belt') station.offset = 0.5;
    emitAtTile(world, 'drop', station);
    return;
  }
  if (!combine(world, chef, station)) emitAtTile(world, 'nope', station);
}

/** True when a chef's free hands would start slicing or rolling at the station. */
export function isWorkable(station: Station): boolean {
  if (station.kind === 'board') return isSliceable(station.item);
  if (station.kind === 'mat') return station.roll === null && isMatReady(station.parts);
  return false;
}

/** Runs the chef's one-button action on a station: grab, drop, combine, start work or serve. */
export function useStation(world: World, chef: Chef, index: number): void {
  const station = world.stations[index];
  if (station === undefined) return;
  chef.working = -1;
  switch (station.kind) {
    case 'counter':
    case 'board':
    case 'belt':
      useHolder(world, chef, station, index);
      break;
    case 'mat':
      useMat(world, chef, station, index);
      break;
    case 'crate':
      useCrate(world, chef, station);
      break;
    case 'cooker':
      useCooker(world, chef, station);
      break;
    case 'plates':
      usePlates(world, chef, station);
      break;
    case 'trash':
      useTrash(world, chef, station);
      break;
    case 'serve':
      useServe(world, chef, station);
      break;
  }
}

/** Uses whatever station is in front of the chef. */
export function interact(world: World, chef: Chef): void {
  const index = getTargetStation(world, chef);
  if (index !== -1) useStation(world, chef, index);
}
