import { CHEF_SPEED, DASH_COOLDOWN, DASH_MULTIPLIER, DASH_TIME } from './constants.ts';
import { getBeltPush } from './belts.ts';
import { emit } from './events.ts';
import { getStationIndexAt } from './grid.ts';
import { getTargetStation, interact, useStation } from './interact.ts';
import { moveBody } from './movement.ts';
import { resolveInput } from './navigation.ts';
import type { Chef, ChefInput, Vec, World } from './types.ts';
import { updateWork } from './work.ts';

const WALK_CYCLE = 11;

/** Creates a chef standing in the middle of a spawn tile. */
export function createChef(id: number, spawn: Vec): Chef {
  return {
    id,
    x: spawn.x + 0.5,
    y: spawn.y + 0.5,
    facing: { x: 0, y: 1 },
    holding: null,
    working: -1,
    dashTime: 0,
    dashCooldown: 0,
    walkPhase: 0,
    isMoving: false,
    goal: null,
  };
}

function updateDash(world: World, chef: Chef, wantsDash: boolean, dt: number): void {
  chef.dashTime = Math.max(0, chef.dashTime - dt);
  chef.dashCooldown = Math.max(0, chef.dashCooldown - dt);
  if (!wantsDash || chef.dashCooldown > 0) return;
  chef.dashTime = DASH_TIME;
  chef.dashCooldown = DASH_COOLDOWN;
  emit(world, 'dash', chef.x, chef.y);
}

function walk(world: World, chef: Chef, moveX: number, moveY: number, dt: number): void {
  const length = Math.hypot(moveX, moveY);
  const scale = length > 1 ? 1 / length : 1;
  const isDashing = chef.dashTime > 0;
  const speed = CHEF_SPEED * (isDashing ? DASH_MULTIPLIER : 1);
  let stepX = moveX * scale * speed;
  let stepY = moveY * scale * speed;
  if (isDashing && length === 0) {
    stepX = chef.facing.x * speed;
    stepY = chef.facing.y * speed;
  }
  chef.isMoving = length > 0.01 || isDashing;
  if (length > 0.01) chef.facing = { x: moveX / length, y: moveY / length };
  if (chef.isMoving) chef.walkPhase += dt * WALK_CYCLE;
  const push = getBeltPush(world, chef.x, chef.y);
  moveBody(world, chef, (stepX + push.x) * dt, (stepY + push.y) * dt);
}

function arrive(world: World, chef: Chef): void {
  const goal = chef.goal;
  chef.goal = null;
  if (goal === null || goal.station === null) return;
  chef.facing = { x: goal.station.x - goal.tile.x, y: goal.station.y - goal.tile.y };
  const index = getStationIndexAt(world, goal.station.x, goal.station.y);
  if (index !== -1) useStation(world, chef, index);
}

/** Runs one chef for one step: dash, walk, use stations and keep working. */
export function updateChef(world: World, chef: Chef, input: ChefInput, dt: number): void {
  const resolved = resolveInput(world, chef, input, dt);
  updateDash(world, chef, resolved.dash, dt);
  walk(world, chef, resolved.moveX, resolved.moveY, dt);
  if (resolved.hasArrived) arrive(world, chef);
  if (resolved.interact) interact(world, chef);
  if (chef.working === -1) return;
  if (chef.holding !== null || getTargetStation(world, chef) !== chef.working) {
    chef.working = -1;
    return;
  }
  updateWork(world, chef, dt);
}
