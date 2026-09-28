import type { Chef } from '../game/types.ts';
import { drawItemAt } from './itemArt.ts';
import { PALETTE, PLAYER_COLORS } from './palette.ts';
import { circle, ellipse, roundRect } from './shapes.ts';
import type { Ctx } from './shapes.ts';
import { drawText } from './text.ts';

const HOLD_REACH = 0.36;

interface Pose {
  x: number;
  y: number;
  bob: number;
  stride: number;
  color: string;
  isWorking: boolean;
}

function drawFeet(ctx: Ctx, pose: Pose): void {
  ellipse(ctx, pose.x - 0.11, pose.y + 0.25 + pose.stride, 0.075, 0.05, PALETTE.ink);
  ellipse(ctx, pose.x + 0.11, pose.y + 0.25 - pose.stride, 0.075, 0.05, PALETTE.ink);
}

function drawBody(ctx: Ctx, pose: Pose): void {
  const y = pose.y + 0.07 + pose.bob;
  ellipse(ctx, pose.x, y + 0.02, 0.27, 0.22, PALETTE.coatShade);
  ellipse(ctx, pose.x, y, 0.26, 0.21, PALETTE.coat);
  roundRect(ctx, pose.x - 0.17, y + 0.02, 0.34, 0.17, 0.08, pose.color);
  ellipse(ctx, pose.x, y - 0.13, 0.17, 0.06, pose.color);
}

function drawHands(ctx: Ctx, chef: Chef, pose: Pose, time: number): void {
  const side = { x: -chef.facing.y, y: chef.facing.x };
  const chop = pose.isWorking ? Math.abs(Math.sin(time * 16)) * 0.07 : 0;
  const reach = 0.2 + chop;
  for (const hand of [-1, 1]) {
    const x = pose.x + chef.facing.x * reach + side.x * 0.2 * hand;
    const y = pose.y + 0.08 + pose.bob + chef.facing.y * reach * 0.8 + side.y * 0.2 * hand;
    circle(ctx, x, y, 0.065, PALETTE.skin);
  }
}

function drawHat(ctx: Ctx, x: number, y: number): void {
  circle(ctx, x - 0.1, y - 0.22, 0.09, PALETTE.coatShade);
  circle(ctx, x + 0.1, y - 0.22, 0.09, PALETTE.coatShade);
  circle(ctx, x, y - 0.27, 0.11, PALETTE.coatShade);
  circle(ctx, x - 0.1, y - 0.235, 0.085, PALETTE.coat);
  circle(ctx, x + 0.1, y - 0.235, 0.085, PALETTE.coat);
  circle(ctx, x, y - 0.285, 0.105, PALETTE.coat);
  roundRect(ctx, x - 0.15, y - 0.2, 0.3, 0.1, 0.03, PALETTE.coat);
  roundRect(ctx, x - 0.15, y - 0.12, 0.3, 0.025, 0.01, PALETTE.coatShade);
}

function drawHead(ctx: Ctx, chef: Chef, pose: Pose): void {
  const x = pose.x + chef.facing.x * 0.04;
  const y = pose.y - 0.17 + pose.bob + chef.facing.y * 0.03;
  circle(ctx, x, y, 0.175, PALETTE.skin);
  if (chef.facing.y > -0.6) {
    const lookX = chef.facing.x * 0.07;
    const lookY = Math.max(0, chef.facing.y) * 0.04;
    circle(ctx, x - 0.065 + lookX, y + 0.01 + lookY, 0.028, PALETTE.ink);
    circle(ctx, x + 0.065 + lookX, y + 0.01 + lookY, 0.028, PALETTE.ink);
    ellipse(ctx, x - 0.11 + lookX, y + 0.06 + lookY, 0.035, 0.02, 'rgba(255, 120, 120, 0.45)');
    ellipse(ctx, x + 0.11 + lookX, y + 0.06 + lookY, 0.035, 0.02, 'rgba(255, 120, 120, 0.45)');
  } else {
    ellipse(ctx, x, y + 0.04, 0.16, 0.12, '#4a3328');
  }
  drawHat(ctx, x, y);
}

function drawHeld(ctx: Ctx, chef: Chef, pose: Pose): void {
  if (chef.holding === null) return;
  const x = pose.x + chef.facing.x * HOLD_REACH;
  const y = pose.y + 0.08 + pose.bob + chef.facing.y * HOLD_REACH * 0.85;
  drawItemAt(ctx, chef.holding, x, y, 0.82);
}

/** Draws a chef with hat, hands and whatever they carry. */
export function drawChef(ctx: Ctx, chef: Chef, time: number, showTag: boolean): void {
  const color = PLAYER_COLORS[chef.id] ?? PALETTE.playerOne;
  const pose: Pose = {
    x: chef.x,
    y: chef.y - 0.08,
    bob: chef.isMoving ? Math.sin(chef.walkPhase * 2) * 0.02 : Math.sin(time * 2.4 + chef.id) * 0.008,
    stride: chef.isMoving ? Math.sin(chef.walkPhase) * 0.05 : 0,
    color,
    isWorking: chef.working !== -1,
  };
  const isFacingAway = chef.facing.y < -0.3;
  ellipse(ctx, chef.x, chef.y + 0.2, 0.3, 0.12, PALETTE.shadow);
  ctx.beginPath();
  ctx.ellipse(chef.x, chef.y + 0.2, 0.33, 0.14, 0, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.035;
  ctx.stroke();
  if (isFacingAway) {
    drawHeld(ctx, chef, pose);
    drawHands(ctx, chef, pose, time);
  }
  drawFeet(ctx, pose);
  drawBody(ctx, pose);
  drawHead(ctx, chef, pose);
  if (!isFacingAway) {
    drawHands(ctx, chef, pose, time);
    drawHeld(ctx, chef, pose);
  }
  if (showTag) drawText(ctx, `P${chef.id + 1}`, chef.x, chef.y - 0.72, 0.2, color);
}
