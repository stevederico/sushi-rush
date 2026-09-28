import { LEVELS } from './levels.ts';
import type { LevelDef } from './types.ts';
import { getStars } from './world.ts';

export type Crew = 'solo' | 'duo';

export interface SaveData {
  /** Best score per level id, for each crew size. */
  best: Record<Crew, Record<string, number>>;
  isMuted: boolean;
}

export type Store = Pick<Storage, 'getItem' | 'setItem'>;

const SAVE_KEY = 'sushi-rush-save-v1';

/** A fresh save with nothing played. */
export function createSave(): SaveData {
  return { best: { solo: {}, duo: {} }, isMuted: false };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readScores(value: unknown): Record<string, number> {
  const scores: Record<string, number> = {};
  if (!isRecord(value)) return scores;
  for (const [level, score] of Object.entries(value)) {
    if (typeof score === 'number' && Number.isFinite(score) && score >= 0) scores[level] = score;
  }
  return scores;
}

/** Reads a save from text. Anything broken or missing falls back to a fresh value. */
export function parseSave(text: string | null): SaveData {
  const save = createSave();
  if (text === null) return save;
  try {
    const data: unknown = JSON.parse(text);
    if (!isRecord(data)) return save;
    const best = isRecord(data.best) ? data.best : {};
    save.best.solo = readScores(best.solo);
    save.best.duo = readScores(best.duo);
    save.isMuted = data.isMuted === true;
  } catch (error) {
    console.error('Save data was unreadable and has been reset', error);
  }
  return save;
}

/** Loads the save. Private browsing can block storage, so failure means a fresh save. */
export function loadSave(store: Store | null): SaveData {
  if (store === null) return createSave();
  try {
    return parseSave(store.getItem(SAVE_KEY));
  } catch (error) {
    console.error('Could not read saved progress', error);
    return createSave();
  }
}

/** Writes the save. Returns false when the browser refuses to store it. */
export function writeSave(store: Store | null, save: SaveData): boolean {
  if (store === null) return false;
  try {
    store.setItem(SAVE_KEY, JSON.stringify(save));
    return true;
  } catch (error) {
    console.error('Could not save progress', error);
    return false;
  }
}

/** The crew key for a number of chefs. */
export function toCrew(chefCount: number): Crew {
  return chefCount > 1 ? 'duo' : 'solo';
}

/** Best score on a level for a crew, or 0 when never played. */
export function getBest(save: SaveData, level: LevelDef, crew: Crew): number {
  return save.best[crew][String(level.id)] ?? 0;
}

/** Stars held on a level for a crew. */
export function getBestStars(save: SaveData, level: LevelDef, crew: Crew): number {
  return getStars(level, getBest(save, level, crew), crew === 'duo' ? 2 : 1);
}

/** Records a score. Returns true when it beats the old best. */
export function recordScore(save: SaveData, level: LevelDef, crew: Crew, score: number): boolean {
  if (score <= getBest(save, level, crew)) return false;
  save.best[crew][String(level.id)] = score;
  return true;
}

/** A shift opens once the one before it has a star, with either crew. */
export function isUnlocked(save: SaveData, level: LevelDef): boolean {
  const index = LEVELS.findIndex((candidate) => candidate.id === level.id);
  const previous = LEVELS[index - 1];
  if (previous === undefined) return true;
  return getBestStars(save, previous, 'solo') > 0 || getBestStars(save, previous, 'duo') > 0;
}

/** The furthest shift the player can start. */
export function getLatestLevel(save: SaveData): LevelDef {
  let latest = getFirstLevel();
  for (const level of LEVELS) {
    if (isUnlocked(save, level)) latest = level;
  }
  return latest;
}

function getFirstLevel(): LevelDef {
  const first = LEVELS[0];
  if (first === undefined) throw new Error('The game has no levels');
  return first;
}

/** The shift after this one, or null after the last. */
export function getNextLevel(level: LevelDef): LevelDef | null {
  const index = LEVELS.findIndex((candidate) => candidate.id === level.id);
  return LEVELS[index + 1] ?? null;
}
