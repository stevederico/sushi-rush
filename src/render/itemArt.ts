import type { FoodToken, Item } from '../game/types.ts';
import { TONES, drawIngredient, drawRice, drawRoll, drawSlab, drawSlices } from './ingredientArt.ts';
import { PALETTE } from './palette.ts';
import { circle, ellipse, roundRect, strokeRoundRect, withTransform } from './shapes.ts';
import type { Ctx } from './shapes.ts';

function drawNigiri(ctx: Ctx, fish: 'salmon' | 'tuna'): void {
  roundRect(ctx, -0.15, -0.02, 0.3, 0.14, 0.06, PALETTE.riceShade);
  roundRect(ctx, -0.15, -0.04, 0.3, 0.13, 0.06, PALETTE.rice);
  withTransform(ctx, 0, -0.06, 1, -0.08, () => drawSlab(ctx, TONES[fish], 0.36, 0.14));
}

type Part = () => void;

function getFish(tokens: readonly FoodToken[]): 'salmon' | 'tuna' | null {
  if (tokens.includes('salmon')) return 'salmon';
  return tokens.includes('tuna') ? 'tuna' : null;
}

/** Groups plate tokens into the pieces a guest would see: nigiri, sashimi, rice, maki. */
function getParts(ctx: Ctx, tokens: readonly FoodToken[]): Part[] {
  const parts: Part[] = [];
  for (const token of tokens) {
    if (token === 'roll:salmon') parts.push(() => drawRoll(ctx, 'salmon'));
    if (token === 'roll:tuna') parts.push(() => drawRoll(ctx, 'tuna'));
    if (token === 'roll:cucumber') parts.push(() => drawRoll(ctx, 'cucumber'));
  }
  const fish = getFish(tokens);
  const hasRice = tokens.includes('rice');
  if (fish !== null && hasRice) parts.push(() => drawNigiri(ctx, fish));
  else if (fish !== null) parts.push(() => drawSlices(ctx, TONES[fish]));
  else if (hasRice) parts.push(() => drawRice(ctx));
  return parts;
}

/** Draws food arranged the way it sits on a plate, centred on the origin. */
export function drawDish(ctx: Ctx, tokens: readonly FoodToken[]): void {
  const parts = getParts(ctx, tokens);
  const scale = parts.length > 1 ? 0.7 : 0.95;
  const spread = parts.length > 1 ? 0.13 : 0;
  parts.forEach((part, index) => {
    const x = parts.length > 1 ? (index === 0 ? -spread : spread) : 0;
    withTransform(ctx, x, -0.01, scale, 0, part);
  });
}

function drawPlate(ctx: Ctx, tokens: readonly FoodToken[]): void {
  ellipse(ctx, 0, 0.06, 0.3, 0.27, PALETTE.shadow);
  circle(ctx, 0, 0, 0.3, PALETTE.plateRim);
  circle(ctx, 0, -0.012, 0.29, PALETTE.plate);
  circle(ctx, 0, -0.012, 0.21, PALETTE.plateInner);
  strokeRoundRect(ctx, -0.21, -0.222, 0.42, 0.42, 0.21, PALETTE.plateRim, 0.012);
  drawDish(ctx, tokens);
}

/** Draws any item centred on the origin, about half a tile wide. */
export function drawItem(ctx: Ctx, item: Item): void {
  if (item.kind === 'plate') drawPlate(ctx, item.contents);
  else if (item.kind === 'roll') drawRoll(ctx, item.filling);
  else drawIngredient(ctx, item);
}

/** Draws an item at a position and scale. */
export function drawItemAt(ctx: Ctx, item: Item, x: number, y: number, scale = 1): void {
  withTransform(ctx, x, y, scale, 0, () => drawItem(ctx, item));
}
