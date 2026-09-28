import { makeRoll } from '../game/items.ts';
import { LEVELS } from '../game/levels.ts';
import { getBest, getBestStars, getLatestLevel, isUnlocked, toCrew } from '../game/save.ts';
import type { SaveData } from '../game/save.ts';
import type { LevelDef } from '../game/types.ts';
import { ICON_PATHS, append, button, el, starRow, svgIcon } from './dom.ts';
import { createItemIcon } from './icons.ts';

export interface TitleOptions {
  save: SaveData;
  chefCount: number;
  /** False on touch-only screens, where two players would have no keys to share. */
  canPickCrew: boolean;
  handlePlay: (level: LevelDef) => void;
  handleCrew: (chefCount: number) => void;
  handleHowTo: () => void;
  handleMute: () => void;
}

/** Tile units across the logo icon: tight, so the roll fills it. */
const LOGO_SPAN = 0.5;

function createLogo(): HTMLElement {
  const logo = el('h1', 'logo');
  logo.setAttribute('aria-label', 'Sushi Rush');
  append(
    logo,
    el('span', 'logo-word', 'Sushi'),
    createItemIcon(makeRoll('salmon'), 80, 'logo-icon', LOGO_SPAN),
    el('span', 'logo-word logo-rush', 'Rush'),
  );
  return logo;
}

function createCrewToggle(options: TitleOptions): HTMLElement {
  const group = el('div', 'segment');
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', 'Number of chefs');
  const choices: Array<[number, string]> = [
    [1, 'Solo'],
    [2, 'Two Players'],
  ];
  for (const [count, label] of choices) {
    const choice = button(label, 'segment-button', () => options.handleCrew(count));
    choice.setAttribute('aria-pressed', String(options.chefCount === count));
    group.appendChild(choice);
  }
  return group;
}

function createLevelCard(options: TitleOptions, level: LevelDef): HTMLButtonElement {
  const crew = toCrew(options.chefCount);
  const isOpen = isUnlocked(options.save, level);
  const card = button('', 'level-card', () => options.handlePlay(level));
  card.disabled = !isOpen;
  const best = getBest(options.save, level, crew);
  const status = isOpen
    ? append(el('span', 'level-status'), starRow(getBestStars(options.save, level, crew)), el('span', 'level-best', best > 0 ? `Best ${best}` : 'Not Played'))
    : append(el('span', 'level-status level-locked'), svgIcon(ICON_PATHS.lock), el('span', 'level-best', `Earn A Star On Shift ${level.id - 1}`));
  append(
    card,
    el('span', 'level-number', `Shift ${level.id}`),
    el('span', 'level-name', level.name),
    el('span', 'level-tagline', level.tagline),
    status,
  );
  return card;
}

/** Builds the title screen: logo, crew choice, one-tap play and the shift list. */
export function createTitleScreen(options: TitleOptions): HTMLElement {
  const screen = el('section', 'screen title-screen');
  screen.setAttribute('aria-label', 'Title');
  const latest = getLatestLevel(options.save);
  const play = button('', 'button button-primary button-play', () => options.handlePlay(latest));
  append(play, svgIcon(ICON_PATHS.play), el('span', '', `Play Shift ${latest.id}`));
  const levels = el('div', 'levels');
  for (const level of LEVELS) levels.appendChild(createLevelCard(options, level));
  const sound = button(options.save.isMuted ? 'Sound: Off' : 'Sound: On', 'button button-quiet', options.handleMute);
  append(
    screen,
    createLogo(),
    el('p', 'tagline', 'Slice, roll, plate and serve before the tickets run out.'),
    ...(options.canPickCrew ? [createCrewToggle(options)] : []),
    play,
    levels,
    append(el('div', 'button-row'), button('How To Play', 'button button-quiet', options.handleHowTo), sound),
  );
  return screen;
}
