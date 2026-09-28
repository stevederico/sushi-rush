import type { FoodToken, Recipe, RecipeId } from './types.ts';

export const RECIPES: Record<RecipeId, Recipe> = {
  salmonSashimi: { id: 'salmonSashimi', name: 'Salmon Sashimi', tokens: ['salmon'], points: 20, patience: 50 },
  tunaSashimi: { id: 'tunaSashimi', name: 'Tuna Sashimi', tokens: ['tuna'], points: 20, patience: 50 },
  salmonNigiri: { id: 'salmonNigiri', name: 'Salmon Nigiri', tokens: ['rice', 'salmon'], points: 35, patience: 60 },
  tunaNigiri: { id: 'tunaNigiri', name: 'Tuna Nigiri', tokens: ['rice', 'tuna'], points: 35, patience: 60 },
  cucumberMaki: { id: 'cucumberMaki', name: 'Cucumber Maki', tokens: ['roll:cucumber'], points: 50, patience: 85 },
  salmonMaki: { id: 'salmonMaki', name: 'Salmon Maki', tokens: ['roll:salmon'], points: 50, patience: 85 },
  tunaMaki: { id: 'tunaMaki', name: 'Tuna Maki', tokens: ['roll:tuna'], points: 50, patience: 85 },
  omakase: { id: 'omakase', name: 'Omakase Set', tokens: ['roll:salmon', 'rice', 'tuna'], points: 90, patience: 115 },
};

export const ALL_RECIPES: Recipe[] = Object.values(RECIPES);

/** True when every token in `part` is covered by `whole`, counting duplicates. */
export function isSubset(part: readonly FoodToken[], whole: readonly FoodToken[]): boolean {
  const remaining = [...whole];
  for (const token of part) {
    const index = remaining.indexOf(token);
    if (index === -1) return false;
    remaining.splice(index, 1);
  }
  return true;
}

/** True when both lists hold the same tokens, in any order. */
export function isSameDish(a: readonly FoodToken[], b: readonly FoodToken[]): boolean {
  return a.length === b.length && isSubset(a, b);
}

/** True when the plate could still grow into a real dish after adding `token`. */
export function canAddToPlate(contents: readonly FoodToken[], token: FoodToken): boolean {
  const next = [...contents, token];
  return ALL_RECIPES.some((recipe) => isSubset(next, recipe.tokens));
}

/** Finds the recipe a plate matches exactly, if any. */
export function findRecipe(contents: readonly FoodToken[]): Recipe | null {
  return ALL_RECIPES.find((recipe) => isSameDish(contents, recipe.tokens)) ?? null;
}
