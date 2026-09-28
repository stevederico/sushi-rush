import { getTargetStation } from '../game/interact.ts';
import { getAccessTiles } from '../game/pathfinding.ts';
import type { Plan } from '../game/planner.ts';
import type { Chef, Station, Vec, World } from '../game/types.ts';
import { drawCat } from './catArt.ts';
import { drawChef } from './chefArt.ts';
import { drawEffects } from './effects.ts';
import type { Effects } from './effects.ts';
import { drawFloor } from './floorArt.ts';
import { PALETTE, PLAYER_COLORS } from './palette.ts';
import { polygon, progressBar, strokeRoundRect } from './shapes.ts';
import type { Ctx } from './shapes.ts';
import { drawStation, drawStationItem, getTopCenter } from './stationArt.ts';

/** The hint arrow hides when the chef is this close to where it would be drawn. */
const ARROW_CLEARANCE = 0.8;

export interface Frame {
  world: World;
  effects: Effects;
  /** Seconds since the page loaded, for looping animation. */
  time: number;
  /** Canvas size in device pixels. */
  width: number;
  height: number;
  hint: Plan | null;
}

export interface Layout {
  /** Device pixels per tile. */
  scale: number;
  offsetX: number;
  offsetY: number;
}

/** Fits the kitchen inside the canvas, centred, as large as it will go. */
export function getLayout(world: World, width: number, height: number): Layout {
  const scale = Math.min(width / world.width, height / world.height);
  return {
    scale,
    offsetX: (width - world.width * scale) / 2,
    offsetY: (height - world.height * scale) / 2,
  };
}

/** Converts a canvas position in device pixels to a grid tile. */
export function toTileFromPixels(layout: Layout, px: number, py: number): Vec {
  return { x: Math.floor((px - layout.offsetX) / layout.scale), y: Math.floor((py - layout.offsetY) / layout.scale) };
}

function drawHighlights(ctx: Ctx, world: World, time: number): void {
  const pulse = 0.55 + 0.45 * Math.sin(time * 7);
  for (const chef of world.chefs) {
    const station = world.stations[getTargetStation(world, chef)];
    if (station === undefined) continue;
    ctx.globalAlpha = 0.55 + pulse * 0.45;
    const color = PLAYER_COLORS[chef.id] ?? PALETTE.white;
    strokeRoundRect(ctx, station.x + 0.04, station.y + 0.04, 0.92, 0.92, 0.1, color, 0.07);
    ctx.globalAlpha = 1;
  }
}

function drawGoal(ctx: Ctx, chef: Chef, time: number): void {
  if (chef.goal === null || chef.goal.station !== null) return;
  const x = chef.goal.tile.x + 0.5;
  const y = chef.goal.tile.y + 0.5;
  ctx.beginPath();
  ctx.arc(x, y, 0.16 + 0.05 * Math.sin(time * 8), 0, Math.PI * 2);
  ctx.strokeStyle = PLAYER_COLORS[chef.id] ?? PALETTE.white;
  ctx.lineWidth = 0.05;
  ctx.stroke();
}

function drawProgress(ctx: Ctx, world: World, station: Station): void {
  if (station.kind !== 'board' && station.kind !== 'mat') return;
  if (station.progress <= 0) return;
  const center = getTopCenter(world, station);
  progressBar(ctx, center.x, Math.max(0.06, center.y - 0.52), 0.7, station.progress, PALETTE.good);
}

/** The floor tile beside a station that is closest to the first chef. */
function getApproach(world: World, station: Station): Vec | null {
  const chef = world.chefs[0];
  let best: Vec | null = null;
  let bestDistance = Infinity;
  for (const tile of getAccessTiles(world, station)) {
    const distance = chef === undefined ? 0 : Math.hypot(tile.x + 0.5 - chef.x, tile.y + 0.5 - chef.y);
    if (distance >= bestDistance) continue;
    best = tile;
    bestDistance = distance;
  }
  return best;
}

/** True when the first chef already stands on the tile, so an arrow there would cover them. */
function isChefOn(world: World, tile: Vec): boolean {
  const chef = world.chefs[0];
  if (chef === undefined) return false;
  return Math.hypot(tile.x + 0.5 - chef.x, tile.y + 0.5 - chef.y) < ARROW_CLEARANCE;
}

/** Points a bouncing arrow at the station the coach suggests, from the side a chef can stand on. */
function drawHint(ctx: Ctx, world: World, hint: Plan | null, time: number): void {
  const station = hint === null ? undefined : world.stations[hint.station];
  if (station === undefined) return;
  const from = getApproach(world, station);
  if (from === null) return;
  const pulse = 0.5 + 0.5 * Math.sin(time * 6);
  ctx.setLineDash([0.16, 0.1]);
  ctx.lineDashOffset = -time * 0.6;
  strokeRoundRect(ctx, station.x + 0.03, station.y + 0.03, 0.94, 0.94, 0.1, PALETTE.warn, 0.06);
  ctx.setLineDash([]);
  if (isChefOn(world, from)) return;
  const angle = Math.atan2(station.y - from.y, station.x - from.x);
  ctx.save();
  ctx.translate(station.x + 0.5, station.y + 0.5);
  ctx.rotate(angle);
  ctx.translate(-0.92 - pulse * 0.12, 0);
  polygon(ctx, [-0.24, -0.11, 0, -0.11, 0, -0.24, 0.27, 0, 0, 0.24, 0, 0.11, -0.24, 0.11], PALETTE.ink);
  polygon(ctx, [-0.19, -0.065, 0.045, -0.065, 0.045, -0.15, 0.2, 0, 0.045, 0.15, 0.045, 0.065, -0.19, 0.065], PALETTE.warn);
  ctx.restore();
}

function drawActors(ctx: Ctx, world: World, time: number): void {
  const chefs = [...world.chefs].sort((a, b) => a.y - b.y);
  if (world.cat !== null) drawCat(ctx, world.cat, time);
  for (const chef of chefs) drawChef(ctx, chef, time, world.chefs.length > 1);
}

/** Paints one frame of the kitchen. */
export function render(ctx: Ctx, frame: Frame): void {
  const { world, time } = frame;
  const layout = getLayout(world, frame.width, frame.height);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, frame.width, frame.height);
  ctx.setTransform(layout.scale, 0, 0, layout.scale, layout.offsetX, layout.offsetY);
  drawFloor(ctx, world, time);
  for (const station of world.stations) drawStation(ctx, world, station, time);
  drawHighlights(ctx, world, time);
  for (const station of world.stations) drawStationItem(ctx, world, station);
  for (const chef of world.chefs) drawGoal(ctx, chef, time);
  drawActors(ctx, world, time);
  for (const station of world.stations) drawProgress(ctx, world, station);
  drawHint(ctx, world, frame.hint, time);
  drawEffects(ctx, frame.effects);
  if (frame.effects.flash > 0) {
    ctx.fillStyle = `rgba(229, 72, 77, ${frame.effects.flash * 0.35})`;
    ctx.fillRect(0, 0, world.width, world.height);
  }
}
