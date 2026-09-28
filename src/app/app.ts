import { createAudio } from '../audio/audio.ts';
import { commandChef } from '../game/navigation.ts';
import { loadSave } from '../game/save.ts';
import type { Store } from '../game/save.ts';
import type { LevelDef } from '../game/types.ts';
import { isTouchOnly } from '../input/device.ts';
import { createKeyboard } from '../input/keyboard.ts';
import { listenForTaps } from '../input/pointer.ts';
import { addNote } from '../render/effects.ts';
import { PALETTE } from '../render/palette.ts';
import { getLayout, toTileFromPixels } from '../render/renderer.ts';
import { getElement } from '../ui/dom.ts';
import { createHud } from '../ui/hud.ts';
import { createDemo } from './context.ts';
import type { AppContext, Phase } from './context.ts';
import { beginPlay, closeHowTo, pause, resume, showTitle, startLevel, toggleMute } from './flow.ts';
import { MAX_FRAME, STEP, draw, runStep, update } from './loop.ts';
import { ageEffects } from './session.ts';
import type { Session } from './session.ts';
import { createView } from './view.ts';

export interface App {
  getPhase(): Phase;
  getSession(): Session;
  startLevel(level: LevelDef, chefCount: number): void;
  /** Skips the get-ready countdown. */
  skipCountdown(): void;
  /** Lets the bot play the current shift, for demos and automated checks. */
  setAutoplay(isOn: boolean): void;
  /** Runs the shift forward without waiting, for automated checks. */
  fastForward(seconds: number): void;
  /** Sends the first chef to a tile, as a tap would. */
  tapTile(x: number, y: number): boolean;
}

/** Floats over a tapped spot the chef cannot walk to or use. */
const BLOCKED_NOTE = "Can't Go There";

function getStore(): Store | null {
  try {
    return window.localStorage;
  } catch (error) {
    console.error('Progress will not be saved in this browser', error);
    return null;
  }
}

function createContext(): AppContext {
  const canvas = getElement('kitchen');
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error('The kitchen must be a canvas');
  const store = getStore();
  const save = loadSave(store);
  const app: AppContext = {
    view: createView(canvas),
    overlay: getElement('overlay'),
    coach: getElement('coach'),
    hud: createHud(getElement('hud'), { handlePause: () => pause(app), handleMute: () => toggleMute(app) }),
    audio: createAudio(save.isMuted),
    keyboard: createKeyboard(window),
    store,
    save,
    isCalm: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    phase: 'title',
    chefCount: 1,
    hasKeyboard: !isTouchOnly(),
    session: createDemo(canvas),
    countdown: null,
    countTimer: 0,
    backlog: 0,
    isAutoplay: false,
  };
  app.hud.setMuted(save.isMuted);
  return app;
}

function tapTile(app: AppContext, x: number, y: number): boolean {
  const { world } = app.session;
  const chef = world.chefs[0];
  if (app.phase !== 'playing' || chef === undefined) return false;
  if (commandChef(world, chef, { x, y })) return true;
  const isInside = x >= 0 && y >= 0 && x < world.width && y < world.height;
  if (isInside) {
    addNote(app.session.effects, x + 0.5, y + 0.5, BLOCKED_NOTE, PALETTE.bad);
    app.audio.playEvent('nope');
  }
  return false;
}

function listen(app: AppContext): void {
  const { canvas } = app.view;
  listenForTaps(canvas, (px, py) => {
    app.audio.unlock();
    const tile = toTileFromPixels(getLayout(app.session.world, canvas.width, canvas.height), px, py);
    tapTile(app, tile.x, tile.y);
  });
  window.addEventListener('keydown', (event) => {
    app.audio.unlock();
    if (!app.hasKeyboard) {
      app.hasKeyboard = true;
      if (app.phase === 'title') showTitle(app);
    }
    if (event.code !== 'Escape' && event.code !== 'KeyP') return;
    if (app.phase === 'playing') pause(app);
    else if (app.phase === 'paused') resume(app);
    else if (event.code === 'Escape') closeHowTo(app);
  });
  window.addEventListener('pointerdown', () => app.audio.unlock());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause(app);
  });
}

function startLoop(app: AppContext): void {
  let lastTime = performance.now();
  const frame = (now: number): void => {
    const dt = Math.min(MAX_FRAME, Math.max(0, (now - lastTime) / 1000));
    lastTime = now;
    try {
      update(app, dt);
      draw(app, now / 1000);
    } catch (error) {
      console.error('The kitchen hit a snag', error);
    }
    window.requestAnimationFrame(frame);
  };
  window.requestAnimationFrame(frame);
}

/** Boots the game: wires input, sound, menus and the frame loop. */
export function createApp(): App {
  const app = createContext();
  listen(app);
  showTitle(app);
  startLoop(app);
  return {
    getPhase: () => app.phase,
    getSession: () => app.session,
    startLevel: (level, chefCount) => startLevel(app, level, chefCount),
    skipCountdown: () => beginPlay(app),
    setAutoplay: (isOn) => {
      app.isAutoplay = isOn;
    },
    fastForward: (seconds) => {
      for (let time = 0; time < seconds && app.phase === 'playing' && !app.session.world.isOver; time += STEP) {
        runStep(app);
        ageEffects(app.session, STEP);
      }
    },
    tapTile: (x, y) => tapTile(app, x, y),
  };
}
