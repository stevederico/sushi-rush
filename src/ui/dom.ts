const SVG_NS = 'http://www.w3.org/2000/svg';

/** Creates an element with a class and optional text. */
export function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className !== '') node.className = className;
  if (text !== '') node.textContent = text;
  return node;
}

/** Creates a button that runs a handler when pressed. */
export function button(label: string, className: string, handleClick: () => void): HTMLButtonElement {
  const node = el('button', className, label);
  node.type = 'button';
  node.addEventListener('click', handleClick);
  return node;
}

/** Finds an element by id, or throws when the page is missing it. */
export function getElement(id: string): HTMLElement {
  const node = document.getElementById(id);
  if (node === null) throw new Error(`Missing element #${id}`);
  return node;
}

/** Adds children to a parent and returns the parent. */
export function append<T extends Node>(parent: T, ...children: Node[]): T {
  for (const child of children) parent.appendChild(child);
  return parent;
}

/** Creates an inline icon from SVG path data drawn on a 24 by 24 grid. */
export function svgIcon(paths: readonly string[], className = 'icon'): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', className);
  svg.setAttribute('aria-hidden', 'true');
  for (const data of paths) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', data);
    svg.appendChild(path);
  }
  return svg;
}

export const ICON_PATHS = {
  pause: ['M7 5h3v14H7z', 'M14 5h3v14h-3z'],
  play: ['M8 5l11 7-11 7z'],
  soundOn: ['M4 9h4l5-4v14l-5-4H4z', 'M16 8.5a5 5 0 010 7l-1.3-1.3a3.2 3.2 0 000-4.4z'],
  soundOff: ['M4 9h4l5-4v14l-5-4H4z', 'M15.5 9.2l1.3-1.3 2.2 2.2 2.2-2.2 1.3 1.3-2.2 2.3 2.2 2.2-1.3 1.3-2.2-2.2-2.2 2.2-1.3-1.3 2.2-2.2z'],
  star: ['M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5l-5.9 3.2 1.2-6.6-4.8-4.6 6.6-.9z'],
  lock: ['M7 10V8a5 5 0 0110 0v2h1.5v11h-13V10zm2 0h6V8a3 3 0 00-6 0z'],
} as const;

/** Creates a row of three stars with the first `count` filled in. */
export function starRow(count: number, className = 'stars'): HTMLSpanElement {
  const row = el('span', className);
  row.setAttribute('role', 'img');
  row.setAttribute('aria-label', `${count} of 3 stars`);
  for (let index = 0; index < 3; index += 1) {
    row.appendChild(svgIcon(ICON_PATHS.star, index < count ? 'star star-on' : 'star'));
  }
  return row;
}
