import type { Audio } from '../audio/audio.ts';
import { getHint, updateBot } from '../game/bot.ts';
import { getLevel, turnLevel } from '../game/levels.ts';
import type { Plan } from '../game/planner.ts';
import { turnWorld } from '../game/turn.ts';
import type { ChefInput, LevelDef, World } from '../game/types.ts';
import { createWorld, drainEvents, updateWorld } from '../game/world.ts';
import { addSteam, createEffects, reactToEvent, turnEffects, updateEffects } from '../render/effects.ts';
import type { Effects } from '../render/effects.ts';

const STEAM_EVERY = 0.16;
const RUSH_TIME = 30;
/** How many dishes the coach helps with on the first shift and on later ones. */
const COACHED_DISHES_FIRST = 2;
const COACHED_DISHES_LATER = 1;

export interface Session {
  world: World;
  effects: Effects;
  chefCount: number;
  /** A demo kitchen runs itself behind the menus and stays silent. */
  isDemo: boolean;
  /** True while the bot plays the chefs, in a demo or an automated check. */
  isBotDriven: boolean;
  /** True when the kitchen is turned on its side to suit an upright screen. */
  isTurned: boolean;
  steamTimer: number;
}

/** Starts a shift, or a self-playing demo of one, laid out wide or turned upright. */
export function createSession(level: LevelDef, chefCount: number, isDemo: boolean, isTurned: boolean): Session {
  const seed = Math.floor(Math.random() * 1000000) + 1;
  const base = getLevel(level.id);
  return {
    world: createWorld(isTurned ? turnLevel(base) : base, chefCount, seed),
    effects: createEffects(),
    chefCount,
    isDemo,
    isBotDriven: isDemo,
    isTurned,
    steamTimer: 0,
  };
}

/** Flips a running session between wide and upright, carrying on mid-shift. */
export function turnSession(session: Session): void {
  turnWorld(session.world);
  turnEffects(session.effects);
  session.isTurned = !session.isTurned;
}

function addCookerSteam(session: Session, dt: number): void {
  session.steamTimer -= dt;
  if (session.steamTimer > 0) return;
  session.steamTimer = STEAM_EVERY;
  for (const station of session.world.stations) {
    if (station.kind === 'cooker' && station.state === 'cooking') addSteam(session.effects, station.x + 0.5, station.y + 0.2);
  }
}

/** Advances a session by one fixed step and turns its events into sound and sparks. */
export function stepSession(session: Session, inputs: readonly ChefInput[], dt: number, audio: Audio, isCalm: boolean): void {
  const { world } = session;
  if (session.isBotDriven) {
    for (const chef of world.chefs) updateBot(world, chef);
  }
  updateWorld(world, inputs, dt);
  for (const event of drainEvents(world)) {
    reactToEvent(session.effects, event, isCalm);
    if (!session.isDemo) audio.playEvent(event.type);
  }
  if (!isCalm) addCookerSteam(session, dt);
  if (!session.isDemo) audio.setRush(world.timeLeft <= RUSH_TIME);
}

/** Ages the visual effects. Runs every frame, even between simulation steps. */
export function ageEffects(session: Session, dt: number): void {
  updateEffects(session.effects, dt);
}

/** True while the coach is still walking the player through their first dishes. */
export function isCoaching(session: Session): boolean {
  if (session.isDemo || session.world.isOver) return false;
  const limit = session.world.level.id === 1 ? COACHED_DISHES_FIRST : COACHED_DISHES_LATER;
  return session.world.served < limit;
}

/** The coaching step to show, or null when there is nothing to suggest right now. */
export function getCoaching(session: Session): Plan | null {
  const chef = session.world.chefs[0];
  if (chef === undefined || !isCoaching(session)) return null;
  return getHint(session.world, chef);
}
