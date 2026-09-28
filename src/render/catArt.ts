import { CAT_SNATCH_TIME } from '../game/constants.ts';
import type { Cat } from '../game/types.ts';
import { drawItemAt } from './itemArt.ts';
import { PALETTE } from './palette.ts';
import { circle, ellipse, line, polygon, progressBar } from './shapes.ts';
import type { Ctx } from './shapes.ts';
import { drawText } from './text.ts';

function drawLegs(ctx: Ctx, stride: number): void {
  for (const leg of [-0.14, -0.05, 0.07, 0.16]) {
    const swing = Math.sin(stride + leg * 20) * 0.04;
    line(ctx, leg, 0.06, leg + swing, 0.2, PALETTE.cat, 0.06);
    circle(ctx, leg + swing, 0.21, 0.035, PALETTE.catLight);
  }
}

function drawHead(ctx: Ctx): void {
  polygon(ctx, [0.13, -0.17, 0.15, -0.31, 0.23, -0.2], PALETTE.cat);
  polygon(ctx, [0.25, -0.2, 0.34, -0.3, 0.35, -0.16], PALETTE.cat);
  polygon(ctx, [0.16, -0.2, 0.17, -0.27, 0.21, -0.21], PALETTE.catPink);
  circle(ctx, 0.24, -0.1, 0.13, PALETTE.cat);
  ellipse(ctx, 0.28, -0.05, 0.07, 0.055, PALETTE.catLight);
  circle(ctx, 0.2, -0.13, 0.03, '#d8f26b');
  circle(ctx, 0.31, -0.13, 0.03, '#d8f26b');
  circle(ctx, 0.205, -0.13, 0.014, PALETTE.ink);
  circle(ctx, 0.315, -0.13, 0.014, PALETTE.ink);
  circle(ctx, 0.29, -0.07, 0.018, PALETTE.catPink);
}

function drawBody(ctx: Ctx, cat: Cat, time: number): void {
  const sway = Math.sin(time * 5) * 0.06;
  ctx.beginPath();
  ctx.moveTo(-0.2, 0);
  ctx.quadraticCurveTo(-0.38, -0.05, -0.34 + sway, -0.3);
  ctx.strokeStyle = PALETTE.cat;
  ctx.lineWidth = 0.06;
  ctx.lineCap = 'round';
  ctx.stroke();
  drawLegs(ctx, cat.walkPhase);
  ellipse(ctx, 0, 0.02, 0.24, 0.14, PALETTE.cat);
  ellipse(ctx, 0.1, 0.08, 0.1, 0.06, PALETTE.catLight);
  drawHead(ctx);
  if (cat.carrying !== null) drawItemAt(ctx, cat.carrying, 0.36, -0.02, 0.6);
}

/** Draws the fish thief, with a warning while it paws at the counter. */
export function drawCat(ctx: Ctx, cat: Cat, time: number): void {
  if (cat.state === 'away') return;
  ellipse(ctx, cat.x, cat.y + 0.2, 0.26, 0.08, PALETTE.shadow);
  ctx.save();
  ctx.translate(cat.x, cat.y);
  if (cat.facing.x < 0) ctx.scale(-1, 1);
  drawBody(ctx, cat, time);
  ctx.restore();
  if (cat.state !== 'snatching') return;
  drawText(ctx, '!', cat.x, cat.y - 0.62 + Math.sin(time * 10) * 0.03, 0.34, PALETTE.bad);
  progressBar(ctx, cat.x, cat.y - 0.42, 0.5, 1 - cat.timer / CAT_SNATCH_TIME, PALETTE.bad);
}
