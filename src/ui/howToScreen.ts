import { makeIngredient, makePlate, makeRoll } from '../game/items.ts';
import type { Item } from '../game/types.ts';
import { createControls } from './controls.ts';
import { append, button, el } from './dom.ts';
import { createItemIcon } from './icons.ts';

interface Step {
  icon: Item;
  title: string;
  text: string;
}

const STEPS: Step[] = [
  { icon: makeIngredient('salmon'), title: 'Grab', text: 'Take fish, cucumber and nori from the crates. Scoop rice from the cooker.' },
  { icon: makeIngredient('salmon', true), title: 'Slice', text: 'Drop fish on a cutting board and use the board again to slice it.' },
  { icon: makeRoll('tuna'), title: 'Roll', text: 'Lay nori, rice and a sliced filling on the green mat, then use the mat to roll.' },
  { icon: makePlate(['rice', 'salmon']), title: 'Plate', text: 'Grab a plate and touch it to the food. Rice plus sliced fish makes nigiri.' },
  { icon: makePlate(['roll:salmon']), title: 'Serve', text: 'Carry the dish to the bell. Fast service and streaks earn bigger tips.' },
];

const HAZARDS = [
  'Floor belts push you along. Dash to fight them.',
  'Item belts carry whatever you put on them across the kitchen.',
  'The cat steals fish left lying around. Walk up to it to shoo it off.',
  'A missed ticket costs points and resets your tip streak.',
];

function createStep(step: Step, index: number): HTMLElement {
  return append(
    el('li', 'step'),
    createItemIcon(step.icon, 56),
    append(el('div', 'step-body'), el('h3', 'step-title', `${index + 1}. ${step.title}`), el('p', 'step-text', step.text)),
  );
}

/** Builds the how to play panel with the five kitchen steps, hazards and controls. */
export function createHowToScreen(chefCount: number, handleBack: () => void): HTMLElement {
  const screen = el('section', 'screen panel');
  screen.setAttribute('aria-label', 'How to play');
  const steps = el('ol', 'steps');
  STEPS.forEach((step, index) => steps.appendChild(createStep(step, index)));
  const hazards = el('ul', 'hazards');
  for (const hazard of HAZARDS) hazards.appendChild(el('li', '', hazard));
  append(
    screen,
    el('h2', 'panel-title', 'How To Play'),
    steps,
    el('h3', 'panel-subtitle', 'Watch Out'),
    hazards,
    el('h3', 'panel-subtitle', 'Controls'),
    createControls(chefCount),
    append(el('div', 'button-row'), button('Back', 'button button-primary', handleBack)),
  );
  return screen;
}
