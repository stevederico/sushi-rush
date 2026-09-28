import { describe, expect, it } from 'vitest';
import {
  addToPlate,
  canAddToMat,
  describeItem,
  getMatFilling,
  isMatReady,
  isSliceable,
  makeIngredient,
  makePlate,
  makeRoll,
  toFoodToken,
} from './items.ts';

describe('isSliceable', () => {
  it('accepts raw fish', () => {
    expect(isSliceable(makeIngredient('salmon'))).toBe(true);
  });

  it('rejects fish that is already sliced', () => {
    expect(isSliceable(makeIngredient('salmon', true))).toBe(false);
  });

  it('rejects rice', () => {
    expect(isSliceable(makeIngredient('rice'))).toBe(false);
  });

  it('rejects nothing at all', () => {
    expect(isSliceable(null)).toBe(false);
  });
});

describe('toFoodToken', () => {
  it('turns sliced tuna into a tuna token', () => {
    expect(toFoodToken(makeIngredient('tuna', true))).toBe('tuna');
  });

  it('keeps raw fish off the plate', () => {
    expect(toFoodToken(makeIngredient('tuna'))).toBeNull();
  });

  it('keeps sliced cucumber off the plate', () => {
    expect(toFoodToken(makeIngredient('cucumber', true))).toBeNull();
  });

  it('names a roll by its filling', () => {
    expect(toFoodToken(makeRoll('cucumber'))).toBe('roll:cucumber');
  });

  it('keeps plates off plates', () => {
    expect(toFoodToken(makePlate())).toBeNull();
  });
});

describe('addToPlate', () => {
  it('adds food that fits a dish', () => {
    const plate = makePlate(['rice']);
    addToPlate(plate, makeIngredient('salmon', true));
    expect(plate.contents).toEqual(['rice', 'salmon']);
  });

  it('refuses food that fits no dish', () => {
    const plate = makePlate(['salmon']);
    expect(addToPlate(plate, makeRoll('tuna'))).toBe(false);
  });

  it('leaves the plate alone after a refusal', () => {
    const plate = makePlate(['salmon']);
    addToPlate(plate, makeIngredient('nori'));
    expect(plate.contents).toEqual(['salmon']);
  });
});

describe('rolling mat', () => {
  const nori = makeIngredient('nori');
  const rice = makeIngredient('rice');
  const salmon = makeIngredient('salmon', true);

  it('takes nori on an empty mat', () => {
    expect(canAddToMat([], nori)).toBe(true);
  });

  it('refuses a second sheet of nori', () => {
    expect(canAddToMat([nori], makeIngredient('nori'))).toBe(false);
  });

  it('refuses raw filling', () => {
    expect(canAddToMat([nori], makeIngredient('salmon'))).toBe(false);
  });

  it('refuses a second filling', () => {
    expect(canAddToMat([salmon], makeIngredient('tuna', true))).toBe(false);
  });

  it('is not ready without rice', () => {
    expect(isMatReady([nori, salmon])).toBe(false);
  });

  it('is ready with all three parts', () => {
    expect(isMatReady([rice, salmon, nori])).toBe(true);
  });

  it('reports the filling', () => {
    expect(getMatFilling([nori, rice, salmon])).toBe('salmon');
  });
});

describe('describeItem', () => {
  it('names sliced fish', () => {
    expect(describeItem(makeIngredient('tuna', true))).toBe('Sliced Tuna');
  });

  it('names a loaded plate a dish', () => {
    expect(describeItem(makePlate(['rice']))).toBe('Dish');
  });
});
