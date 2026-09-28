import type { Audio } from '../audio/audio.ts';
import { getLevel } from '../game/levels.ts';
import type { SaveData, Store } from '../game/save.ts';
import type { LevelDef } from '../game/types.ts';
import type { Keyboard } from '../input/keyboard.ts';
import type { Countdown } from '../ui/gameScreens.ts';
import type { Hud } from '../ui/hud.ts';
import { shouldTurn } from './layout.ts';
import { createSession, turnSession } from './session.ts';
import type { Session } from './session.ts';
import type { View } from './view.ts';

export type Phase = 'title' | 'howTo' | 'countdown' | 'playing' | 'paused' | 'results';

/** Everything the running game shares between its screens and its frame loop. */
export interface AppContext {
  view: View;
  overlay: HTMLElement;
  coach: HTMLElement;
  hud: Hud;
  audio: Audio;
  keyboard: Keyboard;
  store: Store | null;
  save: SaveData;
  /** True when the player asked their system for less motion. */
  isCalm: boolean;
  phase: Phase;
  chefCount: number;
  /** False on touch-only screens until a key press shows a keyboard is attached. */
  hasKeyboard: boolean;
  session: Session;
  countdown: Countdown | null;
  countTimer: number;
  /** Simulation time owed to the kitchen, in seconds. */
  backlog: number;
  isAutoplay: boolean;
}

/** Starts a shift laid out to suit the stage: wide as designed, or turned for upright phones. */
export function createFittedSession(canvas: HTMLCanvasElement, level: LevelDef, chefCount: number, isDemo: boolean): Session {
  const isTurned = shouldTurn(canvas.clientWidth, canvas.clientHeight, false);
  return createSession(level, chefCount, isDemo, isTurned);
}

/** A self-playing first shift to show behind the menus. */
export function createDemo(canvas: HTMLCanvasElement): Session {
  return createFittedSession(canvas, getLevel(1), 1, true);
}

/** Turns the running kitchen when the stage flips between upright and wide. */
export function refitSession(canvas: HTMLCanvasElement, session: Session): void {
  if (shouldTurn(canvas.clientWidth, canvas.clientHeight, session.isTurned) !== session.isTurned) turnSession(session);
}

/** Swaps the screen shown over the kitchen. Null clears it. */
export function setScreen(app: AppContext, screen: HTMLElement | null): void {
  app.overlay.replaceChildren();
  if (screen === null) return;
  app.overlay.appendChild(screen);
  app.overlay.scrollTop = 0;
  const focus = screen.querySelector('.button-primary');
  if (focus instanceof HTMLElement) focus.focus({ preventScroll: true });
}
