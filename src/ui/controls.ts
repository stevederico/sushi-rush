import { append, el } from './dom.ts';

interface ControlRow {
  who: string;
  move: string[];
  use: string[];
  dash: string[];
}

const SOLO_ROWS: ControlRow[] = [
  { who: 'Keyboard', move: ['W', 'A', 'S', 'D'], use: ['Space'], dash: ['Shift'] },
  { who: 'Or', move: ['Arrows'], use: ['Enter'], dash: ['/'] },
];

const DUO_ROWS: ControlRow[] = [
  { who: 'Player 1', move: ['W', 'A', 'S', 'D'], use: ['E'], dash: ['Q'] },
  { who: 'Player 2', move: ['Arrows'], use: ['Enter'], dash: ['/'] },
];

function keys(labels: string[]): HTMLSpanElement {
  const group = el('span', 'keys');
  for (const label of labels) group.appendChild(el('kbd', 'key', label));
  return group;
}

function cell(tag: 'th' | 'td', child: Node | string): HTMLTableCellElement {
  const node = el(tag);
  if (typeof child === 'string') node.textContent = child;
  else node.appendChild(child);
  return node;
}

/** A table of keys for one or two chefs, plus the touch hint. */
export function createControls(chefCount: number): HTMLElement {
  const table = el('table', 'controls');
  const head = append(el('tr'), cell('th', ''), cell('th', 'Move'), cell('th', 'Grab / Use'), cell('th', 'Dash'));
  table.appendChild(append(el('thead'), head));
  const body = el('tbody');
  for (const row of chefCount > 1 ? DUO_ROWS : SOLO_ROWS) {
    body.appendChild(
      append(el('tr'), cell('th', row.who), cell('td', keys(row.move)), cell('td', keys(row.use)), cell('td', keys(row.dash))),
    );
  }
  table.appendChild(body);
  const touch = el('p', 'controls-touch', 'Touch or mouse: tap any station and your chef walks over and uses it.');
  return append(el('div', 'controls-wrap'), table, touch);
}
