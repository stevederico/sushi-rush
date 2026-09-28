import {
  CAT_FIRST_VISIT,
  CAT_FLEE_SPEED,
  CAT_SCARE_DISTANCE,
  CAT_SNATCH_TIME,
  CAT_SPEED,
  CAT_VISIT_EVERY,
} from './constants.ts';
import { emit } from './events.ts';
import { tileCenter, toTile } from './grid.ts';
import { findPath, getAccessTiles } from './pathfinding.ts';
import { nextRandom, pickRandom } from './rng.ts';
import type { Cat, Item, Station, Vec, World } from './types.ts';

const RETRY_DELAY = 3;
const ARRIVAL = 0.06;
const WALK_CYCLE = 14;

/** Creates the cat, waiting outside its door for the first visit. */
export function createCat(door: Vec): Cat {
  const home = tileCenter(door.x, door.y);
  return {
    state: 'away',
    x: home.x,
    y: home.y,
    facing: { x: 1, y: 0 },
    door,
    target: -1,
    timer: CAT_FIRST_VISIT,
    carrying: null,
    path: [],
    walkPhase: 0,
  };
}

/** True when an item is loose fish, the only thing the cat wants. */
export function isCatBait(item: Item | null): boolean {
  return item !== null && item.kind === 'ingredient' && (item.id === 'salmon' || item.id === 'tuna');
}

function getBait(station: Station | undefined): Item | null {
  if (station === undefined) return null;
  if (station.kind !== 'counter' && station.kind !== 'board' && station.kind !== 'belt') return null;
  return isCatBait(station.item) ? station.item : null;
}

function getEntry(world: World, cat: Cat): Vec | null {
  return getAccessTiles(world, cat.door)[0] ?? null;
}

function findTargets(world: World, entry: Vec): number[] {
  const targets: number[] = [];
  world.stations.forEach((station, index) => {
    if (getBait(station) === null) return;
    if (findPath(world, entry, getAccessTiles(world, station)) !== null) targets.push(index);
  });
  return targets;
}

function stepToward(cat: Cat, target: Vec, speed: number, dt: number): boolean {
  const gapX = target.x - cat.x;
  const gapY = target.y - cat.y;
  const distance = Math.hypot(gapX, gapY);
  if (distance <= ARRIVAL) return true;
  const step = Math.min(distance, speed * dt);
  cat.x += (gapX / distance) * step;
  cat.y += (gapY / distance) * step;
  cat.facing = { x: gapX / distance, y: gapY / distance };
  cat.walkPhase += dt * WALK_CYCLE;
  return distance - step <= ARRIVAL;
}

/** Walks the cat toward the nearest goal tile. Returns true once it stands on it. */
function follow(world: World, cat: Cat, goals: Vec[], speed: number, dt: number): boolean {
  const path = findPath(world, toTile(cat.x, cat.y), goals);
  cat.path = path ?? [];
  const next = path?.[1] ?? path?.[0];
  if (next === undefined) return true;
  const hasReached = stepToward(cat, tileCenter(next.x, next.y), speed, dt);
  return hasReached && path?.length === 1;
}

function isChefNear(world: World, cat: Cat): boolean {
  return world.chefs.some((chef) => Math.hypot(chef.x - cat.x, chef.y - cat.y) < CAT_SCARE_DISTANCE);
}

function flee(world: World, cat: Cat, wasShooed: boolean): void {
  cat.state = 'fleeing';
  cat.target = -1;
  if (wasShooed) emit(world, 'catShoo', cat.x, cat.y);
}

function visit(world: World, cat: Cat): void {
  const entry = getEntry(world, cat);
  const target = entry === null ? undefined : pickRandom(world, findTargets(world, entry));
  if (entry === null || target === undefined) {
    cat.timer = RETRY_DELAY;
    return;
  }
  const home = tileCenter(cat.door.x, cat.door.y);
  cat.x = home.x;
  cat.y = home.y;
  cat.target = target;
  cat.state = 'entering';
  emit(world, 'catIn', cat.x, cat.y);
}

function enter(world: World, cat: Cat, dt: number): void {
  const entry = getEntry(world, cat);
  if (entry === null || stepToward(cat, tileCenter(entry.x, entry.y), CAT_SPEED, dt)) cat.state = 'sneaking';
}

function sneak(world: World, cat: Cat, dt: number): void {
  const station = world.stations[cat.target];
  if (station === undefined || getBait(station) === null) {
    flee(world, cat, false);
    return;
  }
  if (!follow(world, cat, getAccessTiles(world, station), CAT_SPEED, dt)) return;
  cat.facing = { x: station.x + 0.5 - cat.x, y: station.y + 0.5 - cat.y };
  cat.state = 'snatching';
  cat.timer = CAT_SNATCH_TIME;
}

function snatch(world: World, cat: Cat, dt: number): void {
  const station = world.stations[cat.target];
  const bait = getBait(station);
  if (station === undefined || bait === null) {
    flee(world, cat, false);
    return;
  }
  cat.timer -= dt;
  if (cat.timer > 0) return;
  if (station.kind === 'counter' || station.kind === 'board' || station.kind === 'belt') station.item = null;
  cat.carrying = bait;
  emit(world, 'catSteal', cat.x, cat.y);
  flee(world, cat, false);
}

function runHome(world: World, cat: Cat, dt: number): void {
  const entry = getEntry(world, cat);
  const isAtEntry = entry === null || follow(world, cat, [entry], CAT_FLEE_SPEED, dt);
  if (!isAtEntry) return;
  cat.state = 'leaving';
}

function leave(world: World, cat: Cat, dt: number): void {
  if (!stepToward(cat, tileCenter(cat.door.x, cat.door.y), CAT_FLEE_SPEED, dt)) return;
  cat.state = 'away';
  cat.carrying = null;
  cat.timer = CAT_VISIT_EVERY * (0.8 + nextRandom(world) * 0.5);
}

/** Runs the fish thief: wait, sneak in, snatch loose fish, and bolt when a chef gets close. */
export function updateCat(world: World, dt: number): void {
  const cat = world.cat;
  if (cat === null) return;
  const isExposed = cat.state === 'sneaking' || cat.state === 'snatching';
  if (isExposed && isChefNear(world, cat)) flee(world, cat, true);
  switch (cat.state) {
    case 'away':
      cat.timer -= dt;
      if (cat.timer <= 0) visit(world, cat);
      break;
    case 'entering':
      enter(world, cat, dt);
      break;
    case 'sneaking':
      sneak(world, cat, dt);
      break;
    case 'snatching':
      snatch(world, cat, dt);
      break;
    case 'fleeing':
      runHome(world, cat, dt);
      break;
    case 'leaving':
      leave(world, cat, dt);
      break;
  }
}
