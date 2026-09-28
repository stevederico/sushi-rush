import { getStreakMultiplier } from '../game/orders.ts';
import type { World } from '../game/types.ts';
import { ICON_PATHS, append, button, el, svgIcon } from './dom.ts';
import { createTicketRail } from './tickets.ts';

const LOW_TIME = 20;

export interface HudHandlers {
  handlePause: () => void;
  handleMute: () => void;
}

export interface Hud {
  show(): void;
  hide(): void;
  update(world: World): void;
  setMuted(isMuted: boolean): void;
  /** Clears the tickets and hides pause once the shift is over, so nothing peeks out behind the results. */
  setFinished(isFinished: boolean): void;
}

/** Formats seconds as minutes and seconds, like 2:05. */
export function formatClock(seconds: number): string {
  const whole = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

function iconButton(label: string, paths: readonly string[], handleClick: () => void): HTMLButtonElement {
  const node = button('', 'icon-button', () => {
    handleClick();
    node.blur();
  });
  node.setAttribute('aria-label', label);
  node.appendChild(svgIcon(paths));
  return node;
}

/** Builds the bar above the kitchen: score, tickets, clock, pause and sound. */
export function createHud(root: HTMLElement, handlers: HudHandlers): Hud {
  const score = el('strong', 'hud-value', '0');
  const streak = el('span', 'hud-streak');
  const clock = el('strong', 'hud-value hud-clock', '0:00');
  const list = el('ol', 'tickets');
  list.setAttribute('aria-label', 'Open orders');
  const empty = el('li', 'tickets-empty', 'Orders Coming Up');
  const rail = createTicketRail(list);
  const sound = iconButton('Mute Sound', ICON_PATHS.soundOn, handlers.handleMute);
  const pause = iconButton('Pause', ICON_PATHS.pause, handlers.handlePause);

  append(
    root,
    append(el('div', 'hud-block hud-score'), el('span', 'hud-label', 'Score'), score, streak),
    append(list, empty),
    append(el('div', 'hud-block hud-time'), el('span', 'hud-label', 'Time'), clock),
    append(el('div', 'hud-buttons'), sound, pause),
  );

  return {
    show() {
      root.hidden = false;
    },
    hide() {
      root.hidden = true;
      rail.clear();
    },
    update(world) {
      score.textContent = String(world.score);
      const multiplier = getStreakMultiplier(world.streak);
      streak.textContent = multiplier > 1 ? `Tips x${multiplier}` : '';
      clock.textContent = formatClock(world.timeLeft);
      clock.classList.toggle('is-low', world.timeLeft <= LOW_TIME);
      empty.hidden = world.orders.length > 0;
      rail.update(world.orders);
    },
    setMuted(isMuted) {
      sound.replaceChildren(svgIcon(isMuted ? ICON_PATHS.soundOff : ICON_PATHS.soundOn));
      sound.setAttribute('aria-label', isMuted ? 'Turn Sound On' : 'Mute Sound');
    },
    setFinished(isFinished) {
      pause.hidden = isFinished;
      list.hidden = isFinished;
      if (isFinished) rail.clear();
    },
  };
}
