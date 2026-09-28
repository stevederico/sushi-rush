import type { FillingId, IngredientItem } from '../game/types.ts';
import { PALETTE } from './palette.ts';
import { circle, ellipse, line, polygon, roundRect, withTransform } from './shapes.ts';
import type { Ctx } from './shapes.ts';

export interface Tones {
  base: string;
  light: string;
  dark: string;
}

export const TONES: Record<FillingId, Tones> = {
  salmon: { base: PALETTE.salmon, light: PALETTE.salmonLight, dark: PALETTE.salmonDark },
  tuna: { base: PALETTE.tuna, light: PALETTE.tunaLight, dark: PALETTE.tunaDark },
  cucumber: { base: PALETTE.cucumber, light: PALETTE.cucumberLight, dark: PALETTE.cucumberDark },
};

function drawShadow(ctx: Ctx, rx: number, ry: number, y: number): void {
  ellipse(ctx, 0, y, rx, ry, PALETTE.shadow);
}

function drawFish(ctx: Ctx, tones: Tones): void {
  drawShadow(ctx, 0.24, 0.07, 0.1);
  polygon(ctx, [0.13, 0, 0.3, -0.13, 0.26, 0, 0.3, 0.13], tones.dark);
  polygon(ctx, [-0.04, -0.1, 0.06, -0.19, 0.1, -0.08], tones.dark);
  ellipse(ctx, -0.04, 0, 0.23, 0.12, tones.base);
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(-0.04, 0, 0.23, 0.12, 0, 0, Math.PI * 2);
  ctx.clip();
  ellipse(ctx, -0.04, 0.1, 0.26, 0.09, tones.light);
  ctx.restore();
  line(ctx, -0.13, -0.07, -0.13, 0.07, tones.dark, 0.02);
  circle(ctx, -0.19, -0.03, 0.03, PALETTE.white);
  circle(ctx, -0.195, -0.03, 0.016, PALETTE.ink);
}

/** A slab of sliced fish with pale stripes. */
export function drawSlab(ctx: Ctx, tones: Tones, width: number, height: number): void {
  roundRect(ctx, -width / 2, -height / 2, width, height, height * 0.45, tones.base);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(-width / 2, -height / 2, width, height, height * 0.45);
  ctx.clip();
  for (let stripe = -2; stripe <= 2; stripe += 1) {
    const x = stripe * width * 0.2;
    line(ctx, x - 0.04, height / 2, x + 0.04, -height / 2, tones.light, 0.022);
  }
  ctx.restore();
}

/** Three slices fanned out, as for sashimi. */
export function drawSlices(ctx: Ctx, tones: Tones): void {
  drawShadow(ctx, 0.22, 0.06, 0.1);
  for (let slice = 0; slice < 3; slice += 1) {
    withTransform(ctx, -0.1 + slice * 0.1, 0.04 - slice * 0.035, 1, -0.5, () => drawSlab(ctx, tones, 0.28, 0.12));
  }
}

function drawCucumber(ctx: Ctx): void {
  drawShadow(ctx, 0.22, 0.06, 0.09);
  withTransform(ctx, 0, 0, 1, -0.35, () => {
    roundRect(ctx, -0.24, -0.075, 0.48, 0.15, 0.075, PALETTE.cucumber);
    roundRect(ctx, -0.2, -0.05, 0.4, 0.035, 0.02, PALETTE.cucumberLight);
    for (let bump = -2; bump <= 2; bump += 1) circle(ctx, bump * 0.08, 0.03, 0.012, PALETTE.cucumberDark);
  });
}

function drawCucumberSlices(ctx: Ctx): void {
  drawShadow(ctx, 0.2, 0.06, 0.1);
  const spots = [-0.11, 0.05, 0.11, 0.05, 0, -0.06];
  for (let index = 0; index < spots.length; index += 2) {
    const x = spots[index] ?? 0;
    const y = spots[index + 1] ?? 0;
    circle(ctx, x, y, 0.1, PALETTE.cucumberDark);
    circle(ctx, x, y, 0.08, PALETTE.cucumberLight);
    circle(ctx, x, y, 0.03, '#e9f7d3');
  }
}

/** A mound of rice. */
export function drawRice(ctx: Ctx): void {
  drawShadow(ctx, 0.2, 0.06, 0.11);
  ellipse(ctx, 0, 0.02, 0.19, 0.14, PALETTE.riceShade);
  ellipse(ctx, 0, -0.01, 0.18, 0.125, PALETTE.rice);
  const grains = [-0.09, -0.02, 0.05, -0.06, 0.08, 0.03, -0.03, 0.05, 0, -0.03];
  for (let index = 0; index < grains.length; index += 2) {
    ellipse(ctx, grains[index] ?? 0, grains[index + 1] ?? 0, 0.028, 0.013, PALETTE.riceShade, index);
  }
}

function drawNori(ctx: Ctx): void {
  drawShadow(ctx, 0.2, 0.05, 0.13);
  withTransform(ctx, 0, 0, 1, -0.12, () => {
    roundRect(ctx, -0.18, -0.16, 0.36, 0.32, 0.03, PALETTE.nori);
    roundRect(ctx, -0.15, -0.13, 0.3, 0.05, 0.02, PALETTE.noriLight);
    line(ctx, -0.12, 0.04, 0.12, 0.04, PALETTE.noriLight, 0.012);
    line(ctx, -0.12, 0.1, 0.06, 0.1, PALETTE.noriLight, 0.012);
  });
}

function drawMakiPiece(ctx: Ctx, x: number, y: number, radius: number, tones: Tones): void {
  circle(ctx, x, y + radius * 0.22, radius, '#122a1f');
  circle(ctx, x, y, radius, PALETTE.nori);
  circle(ctx, x, y, radius * 0.76, PALETTE.rice);
  circle(ctx, x, y, radius * 0.36, tones.base);
  circle(ctx, x - radius * 0.1, y - radius * 0.1, radius * 0.13, tones.light);
}

/** Three pieces of maki. */
export function drawRoll(ctx: Ctx, filling: FillingId): void {
  const tones = TONES[filling];
  drawShadow(ctx, 0.22, 0.06, 0.14);
  drawMakiPiece(ctx, -0.11, -0.05, 0.105, tones);
  drawMakiPiece(ctx, 0.11, -0.05, 0.105, tones);
  drawMakiPiece(ctx, 0, 0.07, 0.105, tones);
}

/** Draws a raw or sliced ingredient centred on the origin. */
export function drawIngredient(ctx: Ctx, item: IngredientItem): void {
  if (item.id === 'rice') drawRice(ctx);
  else if (item.id === 'nori') drawNori(ctx);
  else if (item.id === 'cucumber') item.sliced ? drawCucumberSlices(ctx) : drawCucumber(ctx);
  else item.sliced ? drawSlices(ctx, TONES[item.id]) : drawFish(ctx, TONES[item.id]);
}
