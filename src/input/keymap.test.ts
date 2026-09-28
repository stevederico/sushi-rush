import { describe, expect, it } from 'vitest';
import { GAME_KEYS, readKeys } from './keymap.ts';

const NONE = new Set<string>();

function keys(...codes: string[]): Set<string> {
  return new Set(codes);
}

describe('readKeys for two players', () => {
  it('moves player one with W A S D', () => {
    expect(readKeys(keys('KeyD', 'KeyW'), NONE, 0, false)).toMatchObject({ moveX: 1, moveY: -1 });
  });

  it('moves player two with the arrows', () => {
    expect(readKeys(keys('ArrowLeft', 'ArrowDown'), NONE, 1, false)).toMatchObject({ moveX: -1, moveY: 1 });
  });

  it('keeps player one still when only arrows are held', () => {
    expect(readKeys(keys('ArrowLeft'), NONE, 0, false)).toMatchObject({ moveX: 0, moveY: 0 });
  });

  it('keeps player two still when only W A S D are held', () => {
    expect(readKeys(keys('KeyW'), NONE, 1, false)).toMatchObject({ moveX: 0, moveY: 0 });
  });

  it('lets player one use stations with E', () => {
    expect(readKeys(NONE, keys('KeyE'), 0, false).interact).toBe(true);
  });

  it('lets player two use stations with Enter', () => {
    expect(readKeys(NONE, keys('Enter'), 1, false).interact).toBe(true);
  });

  it('keeps Enter away from player one', () => {
    expect(readKeys(NONE, keys('Enter'), 0, false).interact).toBe(false);
  });

  it('gives each player a shift key to dash', () => {
    const dashes = [readKeys(NONE, keys('ShiftLeft'), 0, false).dash, readKeys(NONE, keys('ShiftRight'), 1, false).dash];
    expect(dashes).toEqual([true, true]);
  });

  it('cancels out opposite directions', () => {
    expect(readKeys(keys('KeyA', 'KeyD'), NONE, 0, false).moveX).toBe(0);
  });
});

describe('readKeys for a solo chef', () => {
  it('accepts W A S D', () => {
    expect(readKeys(keys('KeyS'), NONE, 0, true).moveY).toBe(1);
  });

  it('accepts the arrows too', () => {
    expect(readKeys(keys('ArrowUp'), NONE, 0, true).moveY).toBe(-1);
  });

  it('does not double the speed when both sets are held', () => {
    expect(readKeys(keys('KeyD', 'ArrowRight'), NONE, 0, true).moveX).toBe(1);
  });

  it('accepts Space and Enter to use stations', () => {
    const uses = [readKeys(NONE, keys('Space'), 0, true).interact, readKeys(NONE, keys('Enter'), 0, true).interact];
    expect(uses).toEqual([true, true]);
  });

  it('does not act on a key that is only held', () => {
    expect(readKeys(keys('Space'), NONE, 0, true).interact).toBe(false);
  });
});

describe('GAME_KEYS', () => {
  it('covers the movement keys of both players', () => {
    const wanted = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    expect(wanted.filter((code) => !GAME_KEYS.has(code))).toEqual([]);
  });

  it('leaves browser keys like Tab alone', () => {
    expect(GAME_KEYS.has('Tab')).toBe(false);
  });
});
