import type { LevelDef } from './types.ts';

/**
 * Map legend
 *   #  wall            .  floor           1 2  chef spawns
 *   C  counter         B  cutting board   M  rolling mat
 *   S  salmon crate    T  tuna crate      U  cucumber crate
 *   N  nori crate      R  rice cooker     P  plates
 *   V  serving window  X  trash           D  cat door
 *   > < ^ v  floor conveyor (pushes chefs)
 *   } { ] [  item conveyor (carries items right, left, down or up)
 */
const OPENING_NIGHT: LevelDef = {
  id: 1,
  name: 'Opening Night',
  tagline: 'Slice, plate, serve. Learn the ropes.',
  map: [
    '#STC#BCB#RCP#',
    'C...........C',
    'C...........C',
    'C.1..CCC..2.C',
    'C...........C',
    'C...........C',
    '#XCC#VV#CCCC#',
  ],
  recipes: ['salmonSashimi', 'tunaSashimi', 'salmonNigiri', 'tunaNigiri'],
  duration: 150,
  orderInterval: 17,
  maxOrders: 4,
  stars: [100, 300, 520],
  beltFlipEvery: 0,
  hasCat: false,
};

const BELT_LINE: LevelDef = {
  id: 2,
  name: 'Belt Line',
  tagline: 'The pass sits behind a moving belt. Time your drop.',
  map: [
    '#STU#NCR#BCB#',
    'C...........C',
    'C.1.......2.M',
    'C...........M',
    'P...........C',
    'C...........C',
    '>>>>>>>>>>>>>',
    '#X###VV###CC#',
  ],
  recipes: ['salmonNigiri', 'tunaNigiri', 'cucumberMaki', 'salmonMaki', 'tunaMaki'],
  duration: 180,
  orderInterval: 26,
  maxOrders: 4,
  stars: [50, 180, 350],
  beltFlipEvery: 0,
  hasCat: false,
};

const RUSH_HOUR: LevelDef = {
  id: 3,
  name: 'Rush Hour',
  tagline: 'Split kitchen, flipping belts, and a hungry cat.',
  map: [
    '#STU#####BCB#',
    'C....}}}....C',
    'P....<<<....R',
    'C.1..###..2.N',
    'D....>>>....M',
    'C....{{{....C',
    '#XVV#####CCC#',
  ],
  recipes: ['tunaSashimi', 'salmonNigiri', 'tunaNigiri', 'cucumberMaki', 'salmonMaki', 'omakase'],
  duration: 210,
  orderInterval: 27,
  maxOrders: 5,
  stars: [80, 220, 440],
  beltFlipEvery: 14,
  hasCat: true,
};

export const LEVELS: LevelDef[] = [OPENING_NIGHT, BELT_LINE, RUSH_HOUR];

/** Looks up a level by its id, falling back to the first shift. */
export function getLevel(id: number): LevelDef {
  return LEVELS.find((level) => level.id === id) ?? OPENING_NIGHT;
}

/** How each direction mark changes when the kitchen is flipped along its diagonal. */
const TURNED: Record<string, string> = {
  '>': 'v',
  v: '>',
  '<': '^',
  '^': '<',
  '}': ']',
  ']': '}',
  '{': '[',
  '[': '{',
};

/**
 * Flips a kitchen along its diagonal so a wide room becomes a tall one.
 * Used on upright phones, where a tall kitchen fills the screen.
 */
export function turnLevel(level: LevelDef): LevelDef {
  const width = Math.max(...level.map.map((row) => row.length));
  const map: string[] = [];
  for (let x = 0; x < width; x += 1) {
    const column = level.map.map((row) => row.charAt(x) || '#');
    map.push(column.map((char) => TURNED[char] ?? char).join(''));
  }
  return { ...level, map };
}
