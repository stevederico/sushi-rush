import { RECIPES } from '../game/recipes.ts';
import { getNextLevel } from '../game/save.ts';
import type { LevelDef } from '../game/types.ts';
import { getStarTargets } from '../game/world.ts';
import { createControls } from './controls.ts';
import { append, button, el, starRow } from './dom.ts';
import { createDishIcon } from './icons.ts';

export interface PauseOptions {
  chefCount: number;
  handleResume: () => void;
  handleRestart: () => void;
  handleMenu: () => void;
}

export interface ResultOptions {
  level: LevelDef;
  chefCount: number;
  score: number;
  stars: number;
  served: number;
  missed: number;
  best: number;
  isNewBest: boolean;
  handleNext: (level: LevelDef) => void;
  handleRestart: () => void;
  handleMenu: () => void;
}

export interface Countdown {
  root: HTMLElement;
  setCount(text: string): void;
}

function createMenu(level: LevelDef): HTMLElement {
  const menu = el('ul', 'menu');
  for (const id of level.recipes) {
    const recipe = RECIPES[id];
    menu.appendChild(append(el('li', 'menu-item'), createDishIcon(recipe.tokens, 48), el('span', '', recipe.name)));
  }
  return menu;
}

/** Builds the short get-ready card shown before a shift. */
export function createCountdown(level: LevelDef): Countdown {
  const root = el('section', 'screen panel countdown');
  root.setAttribute('aria-label', 'Get ready');
  const count = el('p', 'countdown-number', '3');
  count.setAttribute('aria-live', 'assertive');
  append(
    root,
    el('p', 'level-number', `Shift ${level.id}`),
    el('h2', 'panel-title', level.name),
    el('p', 'tagline', level.tagline),
    createMenu(level),
    count,
  );
  return {
    root,
    setCount(text) {
      count.textContent = text;
    },
  };
}

/** Builds the pause panel. */
export function createPauseScreen(options: PauseOptions): HTMLElement {
  const screen = el('section', 'screen panel');
  screen.setAttribute('aria-label', 'Paused');
  append(
    screen,
    el('h2', 'panel-title', 'Paused'),
    createControls(options.chefCount),
    append(
      el('div', 'button-row'),
      button('Resume', 'button button-primary', options.handleResume),
      button('Restart Shift', 'button button-quiet', options.handleRestart),
      button('Menu', 'button button-quiet', options.handleMenu),
    ),
  );
  return screen;
}

function getVerdict(options: ResultOptions): string {
  if (options.stars === 0) return 'The Kitchen Got Away From You';
  if (options.stars === 3 && getNextLevel(options.level) === null) return 'Master Of The Bar';
  return ['', 'Shift Survived', 'Great Service', 'Flawless Rush'][options.stars] ?? 'Shift Over';
}

function createStats(options: ResultOptions): HTMLElement {
  const stats = el('dl', 'stats');
  const rows: Array<[string, string]> = [
    ['Dishes Served', String(options.served)],
    ['Tickets Missed', String(options.missed)],
    ['Best Score', String(options.best)],
  ];
  for (const [label, value] of rows) append(stats, el('dt', '', label), el('dd', '', value));
  return stats;
}

function getGoal(options: ResultOptions): string {
  const target = getStarTargets(options.level, options.chefCount)[options.stars];
  return target === undefined ? 'Every star earned on this shift.' : `Next star at ${target} points.`;
}

/** Builds the end of shift panel with stars, stats and what to do next. */
export function createResultScreen(options: ResultOptions): HTMLElement {
  const screen = el('section', 'screen panel results');
  screen.setAttribute('aria-label', 'Shift results');
  const next = getNextLevel(options.level);
  const buttons = el('div', 'button-row');
  if (next !== null && options.stars > 0) {
    buttons.appendChild(button(`Next Shift: ${next.name}`, 'button button-primary', () => options.handleNext(next)));
  }
  const retryStyle = buttons.childElementCount === 0 ? 'button button-primary' : 'button button-quiet';
  append(buttons, button('Play Again', retryStyle, options.handleRestart), button('Menu', 'button button-quiet', options.handleMenu));
  append(
    screen,
    el('p', 'level-number', `Shift ${options.level.id}: ${options.level.name}`),
    el('h2', 'panel-title', getVerdict(options)),
    starRow(options.stars, 'stars stars-big'),
    append(el('p', 'result-score'), el('strong', '', String(options.score)), el('span', '', options.isNewBest ? 'New Best' : 'Points')),
    el('p', 'tagline', getGoal(options)),
    createStats(options),
    buttons,
  );
  return screen;
}
