import { makeIngredient, makePlate } from '../game/items.ts';
import type { FoodToken, IngredientItem, Item, Recipe } from '../game/types.ts';
import { drawItem } from '../render/itemArt.ts';

/** Tile units shown across an icon. Items are about 0.6 wide, so this leaves a small margin. */
const ICON_SPAN = 0.72;

/** Draws an item onto a small canvas of its own, sharp on high density screens. */
export function createItemIcon(item: Item, size: number, className = 'item-icon', span = ICON_SPAN): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const density = Math.min(3, window.devicePixelRatio || 1);
  canvas.width = Math.round(size * density);
  canvas.height = Math.round(size * density);
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  canvas.className = className;
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  if (ctx === null) return canvas;
  const scale = canvas.width / span;
  ctx.setTransform(scale, 0, 0, scale, canvas.width / 2, canvas.height / 2);
  drawItem(ctx, item);
  return canvas;
}

/** Draws a finished dish on its plate. */
export function createDishIcon(tokens: readonly FoodToken[], size: number): HTMLCanvasElement {
  return createItemIcon(makePlate([...tokens]), size, 'dish-icon');
}

function toIngredients(token: FoodToken): IngredientItem[] {
  if (token === 'rice') return [makeIngredient('rice')];
  if (token === 'salmon' || token === 'tuna') return [makeIngredient(token)];
  const filling = token === 'roll:salmon' ? 'salmon' : token === 'roll:tuna' ? 'tuna' : 'cucumber';
  return [makeIngredient('nori'), makeIngredient('rice'), makeIngredient(filling)];
}

/** The raw ingredients a chef has to fetch for a dish, in cooking order. */
export function getShoppingList(recipe: Recipe): IngredientItem[] {
  return recipe.tokens.flatMap(toIngredients);
}
