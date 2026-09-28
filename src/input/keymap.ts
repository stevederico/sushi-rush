import type { ChefInput } from '../game/types.ts';

export interface KeyMap {
  up: string[];
  down: string[];
  left: string[];
  right: string[];
  interact: string[];
  dash: string[];
}

export const PLAYER_ONE_KEYS: KeyMap = {
  up: ['KeyW'],
  down: ['KeyS'],
  left: ['KeyA'],
  right: ['KeyD'],
  interact: ['KeyE', 'Space'],
  dash: ['KeyQ', 'ShiftLeft'],
};

export const PLAYER_TWO_KEYS: KeyMap = {
  up: ['ArrowUp'],
  down: ['ArrowDown'],
  left: ['ArrowLeft'],
  right: ['ArrowRight'],
  interact: ['Enter', 'Period'],
  dash: ['ShiftRight', 'Slash'],
};

const MAPS = [PLAYER_ONE_KEYS, PLAYER_TWO_KEYS];

/** Every key code the game listens for. */
export const GAME_KEYS: ReadonlySet<string> = new Set(MAPS.flatMap((map) => Object.values(map).flat()));

type Keys = ReadonlySet<string>;

function hasAny(keys: Keys, codes: string[]): boolean {
  return codes.some((code) => keys.has(code));
}

function readMap(map: KeyMap, held: Keys, pressed: Keys): ChefInput {
  return {
    moveX: (hasAny(held, map.right) ? 1 : 0) - (hasAny(held, map.left) ? 1 : 0),
    moveY: (hasAny(held, map.down) ? 1 : 0) - (hasAny(held, map.up) ? 1 : 0),
    interact: hasAny(pressed, map.interact),
    dash: hasAny(pressed, map.dash),
  };
}

/**
 * Turns the keys that are down into input for one chef.
 * `held` drives movement. `pressed` holds keys that went down since the last step, for one-shot actions.
 * A solo chef answers to both players' keys.
 */
export function readKeys(held: Keys, pressed: Keys, player: number, isSolo: boolean): ChefInput {
  const own = readMap(MAPS[player] ?? PLAYER_ONE_KEYS, held, pressed);
  if (!isSolo) return own;
  const other = readMap(PLAYER_TWO_KEYS, held, pressed);
  return {
    moveX: Math.sign(own.moveX + other.moveX),
    moveY: Math.sign(own.moveY + other.moveY),
    interact: own.interact || other.interact,
    dash: own.dash || other.dash,
  };
}
