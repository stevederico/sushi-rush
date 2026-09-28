import type { ChefInput } from '../game/types.ts';
import { GAME_KEYS, readKeys } from './keymap.ts';

export interface Keyboard {
  /** Reads the input for a chef. A solo chef answers to both sets of keys. */
  read(player: number, isSolo: boolean): ChefInput;
  /** Forgets key presses once a simulation step has used them. */
  clearPresses(): void;
  /** Lets go of every key, for when the game loses focus or changes screen. */
  release(): void;
  dispose(): void;
}

const BUTTON_KEYS = ['Space', 'Enter'];

/** True when the key belongs to a focused control rather than the kitchen. */
function isForControl(event: KeyboardEvent): boolean {
  const target = event.target;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return true;
  return target instanceof HTMLButtonElement && BUTTON_KEYS.includes(event.code);
}

/** Listens for keys on the window and turns them into chef input. */
export function createKeyboard(target: Window): Keyboard {
  const held = new Set<string>();
  const pressed = new Set<string>();

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (!GAME_KEYS.has(event.code) || isForControl(event)) return;
    event.preventDefault();
    if (!event.repeat) pressed.add(event.code);
    held.add(event.code);
  };
  const handleKeyUp = (event: KeyboardEvent): void => {
    held.delete(event.code);
  };
  const release = (): void => {
    held.clear();
    pressed.clear();
  };

  target.addEventListener('keydown', handleKeyDown);
  target.addEventListener('keyup', handleKeyUp);
  target.addEventListener('blur', release);

  return {
    read: (player, isSolo) => readKeys(held, pressed, player, isSolo),
    clearPresses: () => pressed.clear(),
    release,
    dispose() {
      target.removeEventListener('keydown', handleKeyDown);
      target.removeEventListener('keyup', handleKeyUp);
      target.removeEventListener('blur', release);
    },
  };
}
