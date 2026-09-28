import { makeIngredient } from '../game/items.ts';
import type { CookerStation, CrateStation, MatStation, Vec } from '../game/types.ts';
import { getCookProgress } from '../game/work.ts';
import { drawItemAt } from './itemArt.ts';
import { PALETTE } from './palette.ts';
import { circle, ellipse, line, roundRect, strokeRoundRect } from './shapes.ts';
import type { Ctx } from './shapes.ts';

/** A cutting board, with a knife resting on it while it is empty. */
export function drawBoard(ctx: Ctx, center: Vec, isEmpty: boolean): void {
  roundRect(ctx, center.x - 0.38, center.y - 0.29, 0.76, 0.6, 0.08, PALETTE.boardEdge);
  roundRect(ctx, center.x - 0.38, center.y - 0.31, 0.76, 0.58, 0.08, PALETTE.board);
  circle(ctx, center.x + 0.29, center.y - 0.22, 0.035, PALETTE.boardEdge);
  if (!isEmpty) return;
  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate(-0.5);
  roundRect(ctx, -0.26, -0.05, 0.34, 0.1, 0.03, PALETTE.steel);
  roundRect(ctx, -0.26, 0.02, 0.34, 0.03, 0.01, PALETTE.steelDark);
  roundRect(ctx, 0.08, -0.04, 0.2, 0.08, 0.03, PALETTE.ink);
  ctx.restore();
}

/** A bamboo rolling mat with its parts or finished roll. */
export function drawMat(ctx: Ctx, center: Vec, mat: MatStation): void {
  roundRect(ctx, center.x - 0.39, center.y - 0.32, 0.78, 0.64, 0.05, PALETTE.matLine);
  roundRect(ctx, center.x - 0.37, center.y - 0.3, 0.74, 0.6, 0.04, PALETTE.mat);
  for (let slat = 1; slat < 8; slat += 1) {
    const x = center.x - 0.37 + slat * (0.74 / 8);
    line(ctx, x, center.y - 0.28, x, center.y + 0.28, PALETTE.matLine, 0.014);
  }
  if (mat.roll !== null) {
    drawItemAt(ctx, mat.roll, center.x, center.y);
    return;
  }
  const sorted = [...mat.parts].sort((a, b) => rank(a.id) - rank(b.id));
  sorted.forEach((part, index) => drawItemAt(ctx, part, center.x, center.y - index * 0.015, 1 - index * 0.22));
}

function rank(id: string): number {
  if (id === 'nori') return 0;
  return id === 'rice' ? 1 : 2;
}

/** An ingredient crate. Fish crates are packed with ice. */
export function drawCrate(ctx: Ctx, center: Vec, crate: CrateStation): void {
  const isChilled = crate.ingredient === 'salmon' || crate.ingredient === 'tuna';
  roundRect(ctx, center.x - 0.4, center.y - 0.34, 0.8, 0.7, 0.06, PALETTE.crateWoodDark);
  roundRect(ctx, center.x - 0.4, center.y - 0.36, 0.8, 0.68, 0.06, PALETTE.crateWood);
  roundRect(ctx, center.x - 0.32, center.y - 0.29, 0.64, 0.54, 0.04, isChilled ? PALETTE.ice : '#f4e7c8');
  if (isChilled) {
    circle(ctx, center.x - 0.2, center.y - 0.16, 0.05, PALETTE.white);
    circle(ctx, center.x + 0.22, center.y + 0.14, 0.06, PALETTE.white);
    circle(ctx, center.x + 0.18, center.y - 0.2, 0.035, PALETTE.white);
  }
  drawItemAt(ctx, makeIngredient(crate.ingredient), center.x, center.y - 0.02, 0.95);
}

function drawCookerLight(ctx: Ctx, center: Vec, cooker: CookerStation, time: number): void {
  if (cooker.state === 'ready') {
    for (let pip = 0; pip < cooker.portions; pip += 1) {
      circle(ctx, center.x - 0.15 + pip * 0.1, center.y + 0.2, 0.036, PALETTE.good);
    }
    return;
  }
  if (cooker.state === 'empty') {
    circle(ctx, center.x, center.y + 0.2, 0.04, PALETTE.bad);
    return;
  }
  const pulse = 0.6 + 0.4 * Math.sin(time * 9);
  ctx.globalAlpha = pulse;
  circle(ctx, center.x, center.y + 0.2, 0.04, PALETTE.warn);
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(center.x, center.y - 0.03, 0.2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * getCookProgress(cooker.timer));
  ctx.strokeStyle = PALETTE.warn;
  ctx.lineWidth = 0.05;
  ctx.lineCap = 'round';
  ctx.stroke();
}

/** A rice cooker with a status light and one dot per scoop left. */
export function drawCooker(ctx: Ctx, center: Vec, cooker: CookerStation, time: number): void {
  ellipse(ctx, center.x, center.y + 0.05, 0.38, 0.34, PALETTE.shadow);
  roundRect(ctx, center.x - 0.36, center.y - 0.34, 0.72, 0.66, 0.2, PALETTE.steelDark);
  roundRect(ctx, center.x - 0.36, center.y - 0.36, 0.72, 0.64, 0.2, PALETTE.steel);
  circle(ctx, center.x, center.y - 0.03, 0.26, PALETTE.white);
  circle(ctx, center.x, center.y - 0.03, 0.26 - 0.03, cooker.state === 'ready' ? PALETTE.rice : PALETTE.coatShade);
  if (cooker.state === 'ready') {
    ellipse(ctx, center.x - 0.06, center.y - 0.06, 0.05, 0.025, PALETTE.riceShade, 0.4);
    ellipse(ctx, center.x + 0.08, center.y, 0.05, 0.025, PALETTE.riceShade, -0.5);
    ellipse(ctx, center.x, center.y + 0.08, 0.05, 0.025, PALETTE.riceShade, 0.1);
  } else {
    roundRect(ctx, center.x - 0.07, center.y - 0.06, 0.14, 0.06, 0.03, PALETTE.steelDark);
  }
  drawCookerLight(ctx, center, cooker, time);
}

/** A stack of clean plates. */
export function drawPlateStack(ctx: Ctx, center: Vec): void {
  for (let plate = 0; plate < 3; plate += 1) {
    const y = center.y + 0.1 - plate * 0.07;
    ellipse(ctx, center.x, y + 0.03, 0.32, 0.27, PALETTE.plateRim);
    ellipse(ctx, center.x, y, 0.32, 0.27, PALETTE.plate);
  }
  ellipse(ctx, center.x, center.y - 0.04, 0.22, 0.18, PALETTE.plateInner);
}

/** The serving window: a tray with a bell. */
export function drawServe(ctx: Ctx, center: Vec, time: number): void {
  const glow = 0.5 + 0.5 * Math.sin(time * 3);
  roundRect(ctx, center.x - 0.44, center.y - 0.38, 0.88, 0.76, 0.1, PALETTE.serve);
  roundRect(ctx, center.x - 0.36, center.y - 0.3, 0.72, 0.6, 0.07, PALETTE.serveLight);
  strokeRoundRect(ctx, center.x - 0.36, center.y - 0.3, 0.72, 0.6, 0.07, `rgba(216, 67, 47, ${0.25 + glow * 0.4})`, 0.035);
  ellipse(ctx, center.x, center.y + 0.13, 0.2, 0.05, '#b98a1e');
  ctx.beginPath();
  ctx.arc(center.x, center.y + 0.1, 0.17, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = '#f0b429';
  ctx.fill();
  circle(ctx, center.x, center.y - 0.1, 0.04, '#b98a1e');
  circle(ctx, center.x - 0.06, center.y, 0.03, '#ffe08a');
}

/** The trash bin. */
export function drawTrash(ctx: Ctx, center: Vec): void {
  roundRect(ctx, center.x - 0.33, center.y - 0.3, 0.66, 0.62, 0.12, PALETTE.trashDark);
  roundRect(ctx, center.x - 0.33, center.y - 0.33, 0.66, 0.6, 0.12, PALETTE.trash);
  roundRect(ctx, center.x - 0.22, center.y - 0.22, 0.44, 0.38, 0.08, '#1d1f28');
  line(ctx, center.x - 0.1, center.y - 0.12, center.x + 0.1, center.y + 0.06, PALETTE.trash, 0.04);
  line(ctx, center.x + 0.1, center.y - 0.12, center.x - 0.1, center.y + 0.06, PALETTE.trash, 0.04);
}
