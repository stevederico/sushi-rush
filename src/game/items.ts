import { canAddToPlate } from './recipes.ts';
import type { FillingId, FoodToken, IngredientId, IngredientItem, Item, PlateItem, RollItem } from './types.ts';

const FILLINGS: readonly IngredientId[] = ['salmon', 'tuna', 'cucumber'];

/** Creates a raw ingredient. Rice and nori are ready to use as they are. */
export function makeIngredient(id: IngredientId, sliced = false): IngredientItem {
  return { kind: 'ingredient', id, sliced };
}

/** Creates a plate, empty unless contents are given. */
export function makePlate(contents: FoodToken[] = []): PlateItem {
  return { kind: 'plate', contents: [...contents] };
}

/** Creates a finished roll. */
export function makeRoll(filling: FillingId): RollItem {
  return { kind: 'roll', filling };
}

/** Type guard for ingredients that can be sliced and rolled. */
export function isFilling(id: IngredientId): id is FillingId {
  return FILLINGS.includes(id);
}

/** True when the item still needs a trip to the cutting board. */
export function isSliceable(item: Item | null): item is IngredientItem {
  return item !== null && item.kind === 'ingredient' && isFilling(item.id) && !item.sliced;
}

/** The plate token an item turns into, or null when it cannot be plated. */
export function toFoodToken(item: Item): FoodToken | null {
  if (item.kind === 'roll') return `roll:${item.filling}`;
  if (item.kind === 'plate') return null;
  if (item.id === 'rice') return 'rice';
  if (item.sliced && (item.id === 'salmon' || item.id === 'tuna')) return item.id;
  return null;
}

/** Adds food to a plate when the result can still become a dish. */
export function addToPlate(plate: PlateItem, food: Item): boolean {
  const token = toFoodToken(food);
  if (token === null || !canAddToPlate(plate.contents, token)) return false;
  plate.contents.push(token);
  return true;
}

/** Which mat slot an ingredient fills: nori, rice, or the sliced filling. */
export type MatSlot = 'nori' | 'rice' | 'filling';

/** The mat slot an item belongs in, or null when it cannot go in a roll. */
export function toMatSlot(item: Item): MatSlot | null {
  if (item.kind !== 'ingredient') return null;
  if (item.id === 'nori') return 'nori';
  if (item.id === 'rice') return 'rice';
  return item.sliced && isFilling(item.id) ? 'filling' : null;
}

/** The filling on the mat, if one has been added. */
export function getMatFilling(parts: readonly IngredientItem[]): FillingId | null {
  for (const part of parts) {
    if (part.sliced && isFilling(part.id)) return part.id;
  }
  return null;
}

/** True when the mat holds nori, rice and a filling. */
export function isMatReady(parts: readonly IngredientItem[]): boolean {
  const slots = parts.map((part) => toMatSlot(part));
  return slots.includes('nori') && slots.includes('rice') && slots.includes('filling');
}

/** True when the ingredient fits an open slot on the mat. */
export function canAddToMat(parts: readonly IngredientItem[], item: Item): item is IngredientItem {
  const slot = toMatSlot(item);
  if (slot === null) return false;
  return !parts.some((part) => toMatSlot(part) === slot);
}

/** A short player-facing name for an item. */
export function describeItem(item: Item): string {
  if (item.kind === 'plate') return item.contents.length === 0 ? 'Plate' : 'Dish';
  if (item.kind === 'roll') return `${capitalize(item.filling)} Roll`;
  const name = capitalize(item.id);
  return item.sliced ? `Sliced ${name}` : name;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
