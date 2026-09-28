import { isBeltWarning } from '../game/belts.ts';
import { FLOOR_BELT_SPEED } from '../game/constants.ts';
import { getBeltDirection, getTile } from '../game/grid.ts';
import type { Direction, Tile, World } from '../game/types.ts';
import { PALETTE } from './palette.ts';
import { line, roundRect } from './shapes.ts';
import type { Ctx } from './shapes.ts';

export const DIRECTION_ANGLES: Record<Direction, number> = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
};

const CHEVRON_GAP = 1 / 3;
const LIP = 0.16;

function drawPlanks(ctx: Ctx, x: number, y: number): void {
  ctx.fillStyle = (x + y) % 2 === 0 ? PALETTE.floorLight : PALETTE.floorDark;
  ctx.fillRect(x, y, 1.002, 1.002);
  line(ctx, x, y + 0.5, x + 1, y + 0.5, PALETTE.floorLine, 0.012);
  line(ctx, x, y, x + 1, y, PALETTE.floorLine, 0.012);
  const joint = x + (y % 2 === 0 ? 0.3 : 0.7);
  line(ctx, joint, y, joint, y + 0.5, PALETTE.floorLine, 0.012);
  line(ctx, x + 1 - (joint - x), y + 0.5, x + 1 - (joint - x), y + 1, PALETTE.floorLine, 0.012);
}

/** Draws arrow marks that slide along a belt. The frame must already point down the belt. */
export function drawChevrons(ctx: Ctx, travel: number, color: string, size: number): void {
  const shift = ((travel % CHEVRON_GAP) + CHEVRON_GAP) % CHEVRON_GAP;
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.05;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let mark = -2; mark <= 2; mark += 1) {
    const x = mark * CHEVRON_GAP + shift;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.5, -size);
    ctx.lineTo(x, 0);
    ctx.lineTo(x - size * 0.5, size);
    ctx.stroke();
  }
}

function drawFloorBelt(ctx: Ctx, world: World, direction: Direction, x: number, y: number, time: number): void {
  const isWarning = isBeltWarning(world) && Math.floor(time * 6) % 2 === 0;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, 1, 1);
  ctx.clip();
  ctx.translate(x + 0.5, y + 0.5);
  ctx.rotate(DIRECTION_ANGLES[direction]);
  ctx.fillStyle = PALETTE.floorBelt;
  ctx.fillRect(-0.51, -0.44, 1.02, 0.88);
  drawChevrons(ctx, time * FLOOR_BELT_SPEED * 0.5, isWarning ? PALETTE.floorBeltWarn : PALETTE.floorBeltMark, 0.17);
  ctx.fillStyle = isWarning ? PALETTE.floorBeltWarn : PALETTE.beltRail;
  ctx.fillRect(-0.51, -0.47, 1.02, 0.06);
  ctx.fillRect(-0.51, 0.41, 1.02, 0.06);
  ctx.restore();
}

function drawCatDoor(ctx: Ctx, x: number, y: number): void {
  roundRect(ctx, x + 0.2, y + 0.16, 0.6, 0.62, 0.3, PALETTE.wall);
  roundRect(ctx, x + 0.26, y + 0.22, 0.48, 0.56, 0.24, '#11131f');
  ctx.beginPath();
  ctx.moveTo(x + 0.36, y + 0.12);
  ctx.lineTo(x + 0.42, y + 0.02);
  ctx.lineTo(x + 0.48, y + 0.12);
  ctx.moveTo(x + 0.52, y + 0.12);
  ctx.lineTo(x + 0.58, y + 0.02);
  ctx.lineTo(x + 0.64, y + 0.12);
  ctx.fillStyle = PALETTE.wallTrim;
  ctx.fill();
}

function drawWall(ctx: Ctx, world: World, x: number, y: number, isDoor: boolean): void {
  const below = getTile(world, x, y + 1);
  const hasFace = below !== null && below.kind !== 'wall';
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(x, y, 1.002, 1.002);
  ctx.fillStyle = PALETTE.wallTop;
  ctx.fillRect(x, y, 1.002, hasFace ? 1 - LIP : 1.002);
  if (hasFace) line(ctx, x, y + 1 - LIP, x + 1, y + 1 - LIP, PALETTE.wallTrim, 0.03);
  if (isDoor) drawCatDoor(ctx, x, y);
}

function drawTile(ctx: Ctx, world: World, tile: Tile, x: number, y: number, time: number): void {
  if (tile.kind === 'wall') {
    const door = world.cat?.door;
    drawWall(ctx, world, x, y, door !== undefined && door.x === x && door.y === y);
    return;
  }
  drawPlanks(ctx, x, y);
  const direction = getBeltDirection(world, tile);
  if (direction !== null) drawFloorBelt(ctx, world, direction, x, y, time);
}

/** Paints the floor, the floor belts and the walls. Stations are drawn on top later. */
export function drawFloor(ctx: Ctx, world: World, time: number): void {
  world.tiles.forEach((row, y) => {
    row.forEach((tile, x) => drawTile(ctx, world, tile, x, y, time));
  });
}
