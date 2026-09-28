import { getBest, recordScore, toCrew, writeSave } from '../game/save.ts';
import type { LevelDef } from '../game/types.ts';
import { getStars } from '../game/world.ts';
import { createCountdown, createPauseScreen, createResultScreen } from '../ui/gameScreens.ts';
import { createHowToScreen } from '../ui/howToScreen.ts';
import { createTitleScreen } from '../ui/titleScreen.ts';
import { createDemo, createFittedSession, setScreen } from './context.ts';
import type { AppContext } from './context.ts';

const COUNT_FROM = 3;
/** Seconds each countdown number stays up. */
export const COUNT_PACE = 0.75;

/** Flips sound on or off and remembers the choice. */
export function toggleMute(app: AppContext): void {
  app.save.isMuted = !app.save.isMuted;
  app.audio.setMuted(app.save.isMuted);
  app.hud.setMuted(app.save.isMuted);
  writeSave(app.store, app.save);
  if (app.phase === 'title') showTitle(app);
}

/** Shows the title screen over a self-playing kitchen. */
export function showTitle(app: AppContext): void {
  app.phase = 'title';
  app.isAutoplay = false;
  app.audio.stopMusic();
  app.hud.hide();
  app.coach.hidden = true;
  if (!app.session.isDemo) app.session = createDemo(app.view.canvas);
  if (!app.hasKeyboard) app.chefCount = 1;
  const screen = createTitleScreen({
    save: app.save,
    chefCount: app.chefCount,
    canPickCrew: app.hasKeyboard,
    handlePlay: (level) => startLevel(app, level, app.chefCount),
    handleCrew: (count) => {
      app.chefCount = count;
      app.audio.playClick();
      showTitle(app);
    },
    handleHowTo: () => showHowTo(app),
    handleMute: () => toggleMute(app),
  });
  setScreen(app, screen);
}

/** Opens the how to play panel from the title screen. */
export function showHowTo(app: AppContext): void {
  app.phase = 'howTo';
  app.audio.playClick();
  setScreen(app, createHowToScreen(app.chefCount, () => closeHowTo(app)));
}

/** Goes back from the how to play panel. */
export function closeHowTo(app: AppContext): void {
  if (app.phase !== 'howTo') return;
  app.audio.playClick();
  showTitle(app);
}

/** Sets up a shift and starts the get-ready countdown. */
export function startLevel(app: AppContext, level: LevelDef, chefCount: number): void {
  app.chefCount = app.hasKeyboard ? chefCount : 1;
  app.hud.setFinished(false);
  app.hud.show();
  app.coach.hidden = false;
  app.session = createFittedSession(app.view.canvas, level, app.chefCount, false);
  app.keyboard.release();
  app.backlog = 0;
  app.phase = 'countdown';
  app.countTimer = COUNT_FROM * COUNT_PACE;
  app.countdown = createCountdown(level);
  app.hud.update(app.session.world);
  setScreen(app, app.countdown.root);
  app.audio.unlock();
  app.audio.playCountdown(false);
}

/** Ends the countdown and hands the kitchen to the players. */
export function beginPlay(app: AppContext): void {
  if (app.phase !== 'countdown') return;
  app.phase = 'playing';
  app.countdown = null;
  setScreen(app, null);
  app.keyboard.release();
  app.audio.playCountdown(true);
  app.audio.startMusic();
}

/** Freezes the shift and shows the pause panel. */
export function pause(app: AppContext): void {
  if (app.phase !== 'playing') return;
  app.phase = 'paused';
  app.audio.stopMusic();
  const level = app.session.world.level;
  const screen = createPauseScreen({
    chefCount: app.chefCount,
    handleResume: () => resume(app),
    handleRestart: () => startLevel(app, level, app.chefCount),
    handleMenu: () => showTitle(app),
  });
  setScreen(app, screen);
}

/** Picks the shift back up after a pause. */
export function resume(app: AppContext): void {
  if (app.phase !== 'paused') return;
  app.phase = 'playing';
  app.keyboard.release();
  setScreen(app, null);
  app.audio.startMusic();
}

/** Scores the finished shift, saves it and shows the results. */
export function finish(app: AppContext): void {
  const { world } = app.session;
  const crew = toCrew(app.chefCount);
  const stars = getStars(world.level, world.score, app.chefCount);
  const isNewBest = recordScore(app.save, world.level, crew, world.score);
  writeSave(app.store, app.save);
  app.phase = 'results';
  app.isAutoplay = false;
  app.coach.hidden = true;
  app.hud.update(world);
  app.hud.setFinished(true);
  app.audio.stopMusic();
  app.audio.playFanfare(stars);
  const screen = createResultScreen({
    level: world.level,
    chefCount: app.chefCount,
    score: world.score,
    stars,
    served: world.served,
    missed: world.expired,
    best: getBest(app.save, world.level, crew),
    isNewBest,
    handleNext: (next) => startLevel(app, next, app.chefCount),
    handleRestart: () => startLevel(app, world.level, app.chefCount),
    handleMenu: () => showTitle(app),
  });
  setScreen(app, screen);
}
