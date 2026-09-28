import { MAX_STEP } from '../game/constants.ts';
import type { ChefInput } from '../game/types.ts';
import { render } from '../render/renderer.ts';
import { createDemo, refitSession } from './context.ts';
import type { AppContext } from './context.ts';
import { COUNT_PACE, beginPlay, finish } from './flow.ts';
import { ageEffects, getCoaching, isCoaching, stepSession } from './session.ts';

export const STEP = 1 / 60;
/** The longest stretch of time a single frame may stand for. */
export const MAX_FRAME = 0.1;
const COACH_IDLE = 'Watch The Tickets For Your Next Order';
const IDLE: ChefInput = { moveX: 0, moveY: 0, interact: false, dash: false };

function readInputs(app: AppContext): ChefInput[] {
  const { session } = app;
  if (session.isDemo || app.isAutoplay) return [IDLE, IDLE];
  const isSolo = session.world.chefs.length === 1;
  return session.world.chefs.map((chef) => app.keyboard.read(chef.id, isSolo));
}

/** Runs one fixed step of the kitchen. Key presses are used once and then cleared. */
export function runStep(app: AppContext): void {
  const { session } = app;
  const wasDemo = session.isDemo;
  session.isBotDriven = wasDemo || app.isAutoplay;
  stepSession(session, readInputs(app), Math.min(STEP, MAX_STEP), app.audio, app.isCalm);
  app.keyboard.clearPresses();
}

function simulate(app: AppContext, dt: number): void {
  app.backlog = Math.min(app.backlog + dt, MAX_FRAME);
  while (app.backlog >= STEP) {
    app.backlog -= STEP;
    runStep(app);
    if (app.session.world.isOver) break;
  }
}

function tickCountdown(app: AppContext, dt: number): void {
  const before = Math.ceil(app.countTimer / COUNT_PACE);
  app.countTimer -= dt;
  if (app.countTimer <= 0) {
    beginPlay(app);
    return;
  }
  const now = Math.ceil(app.countTimer / COUNT_PACE);
  if (now === before) return;
  app.countdown?.setCount(String(now));
  app.audio.playCountdown(false);
}

function isRunning(app: AppContext): boolean {
  if (app.phase === 'playing') return true;
  return (app.phase === 'title' || app.phase === 'howTo') && app.session.isDemo;
}

/** Advances the game by the time since the last frame. */
export function update(app: AppContext, dt: number): void {
  if (app.phase === 'countdown') tickCountdown(app, dt);
  if (!isRunning(app)) return;
  simulate(app, dt);
  ageEffects(app.session, dt);
  if (!app.session.world.isOver) return;
  if (app.session.isDemo) app.session = createDemo(app.view.canvas);
  else finish(app);
}

function updateCoach(app: AppContext): void {
  const isInShift = app.phase === 'playing' || app.phase === 'paused' || app.phase === 'countdown';
  app.coach.hidden = !isInShift || !isCoaching(app.session);
}

/** Paints the kitchen and refreshes the HUD and the coach line. */
export function draw(app: AppContext, time: number): void {
  updateCoach(app);
  app.view.fit();
  refitSession(app.view.canvas, app.session);
  const { session, view } = app;
  const hint = app.phase === 'playing' ? getCoaching(session) : null;
  const advice = hint?.label ?? COACH_IDLE;
  if (app.coach.textContent !== advice) app.coach.textContent = advice;
  const { width, height } = view.canvas;
  render(view.ctx, { world: session.world, effects: session.effects, time, width, height, hint });
  if (!session.isDemo && app.phase !== 'results') app.hud.update(session.world);
}
