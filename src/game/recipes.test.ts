import { describe, expect, it } from 'vitest';
import { ALL_RECIPES, RECIPES, canAddToPlate, findRecipe, isSameDish, isSubset } from './recipes.ts';

describe('isSubset', () => {
  it('accepts an empty plate', () => {
    expect(isSubset([], ['rice', 'salmon'])).toBe(true);
  });

  it('accepts tokens in any order', () => {
    expect(isSubset(['salmon', 'rice'], ['rice', 'salmon'])).toBe(true);
  });

  it('rejects a duplicate the dish does not have', () => {
    expect(isSubset(['rice', 'rice'], ['rice', 'salmon'])).toBe(false);
  });

  it('rejects a token the dish does not have', () => {
    expect(isSubset(['tuna'], ['rice', 'salmon'])).toBe(false);
  });
});

describe('isSameDish', () => {
  it('matches the same tokens in another order', () => {
    expect(isSameDish(['tuna', 'rice', 'roll:salmon'], RECIPES.omakase.tokens)).toBe(true);
  });

  it('rejects a partial dish', () => {
    expect(isSameDish(['rice'], RECIPES.salmonNigiri.tokens)).toBe(false);
  });
});

describe('canAddToPlate', () => {
  it('lets rice start a plate', () => {
    expect(canAddToPlate([], 'rice')).toBe(true);
  });

  it('lets fish join rice', () => {
    expect(canAddToPlate(['rice'], 'tuna')).toBe(true);
  });

  it('blocks two kinds of fish on one plate', () => {
    expect(canAddToPlate(['salmon'], 'tuna')).toBe(false);
  });

  it('blocks a second helping of rice', () => {
    expect(canAddToPlate(['rice'], 'rice')).toBe(false);
  });

  it('blocks a cucumber roll next to rice', () => {
    expect(canAddToPlate(['rice'], 'roll:cucumber')).toBe(false);
  });
});

describe('findRecipe', () => {
  it('finds nigiri', () => {
    expect(findRecipe(['salmon', 'rice'])?.id).toBe('salmonNigiri');
  });

  it('finds sashimi for fish alone', () => {
    expect(findRecipe(['tuna'])?.id).toBe('tunaSashimi');
  });

  it('returns null for plain rice', () => {
    expect(findRecipe(['rice'])).toBeNull();
  });

  it('gives every recipe a unique set of tokens', () => {
    const found = ALL_RECIPES.map((recipe) => findRecipe(recipe.tokens)?.id);
    expect(found).toEqual(ALL_RECIPES.map((recipe) => recipe.id));
  });
});
