import { describe, expect, it } from 'vitest';
import { shouldTurn } from './layout.ts';

describe('shouldTurn', () => {
  it('keeps a wide stage wide', () => {
    expect(shouldTurn(1280, 800, false)).toBe(false);
  });

  it('turns an upright phone', () => {
    expect(shouldTurn(390, 844, false)).toBe(true);
  });

  it('turns back when the phone lies down', () => {
    expect(shouldTurn(844, 390, true)).toBe(false);
  });

  it('keeps a square stage the way it is when wide', () => {
    expect(shouldTurn(700, 700, false)).toBe(false);
  });

  it('keeps a square stage the way it is when upright', () => {
    expect(shouldTurn(700, 700, true)).toBe(true);
  });

  it('keeps its layout while the stage has no size yet', () => {
    expect(shouldTurn(0, 0, true)).toBe(true);
  });
});
