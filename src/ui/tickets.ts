import type { Order } from '../game/types.ts';
import { append, el } from './dom.ts';
import { createDishIcon, createItemIcon, getShoppingList } from './icons.ts';

const URGENT = 0.25;
const HURRY = 0.5;

interface Ticket {
  root: HTMLLIElement;
  bar: HTMLElement;
}

export interface TicketRail {
  update(orders: readonly Order[]): void;
  clear(): void;
}

function createTicket(order: Order): Ticket {
  const root = el('li', 'ticket');
  const parts = el('span', 'ticket-parts');
  for (const item of getShoppingList(order.recipe)) parts.appendChild(createItemIcon(item, 24));
  const bar = el('i', 'ticket-fill');
  append(
    root,
    createDishIcon(order.recipe.tokens, 52),
    append(el('div', 'ticket-body'), el('span', 'ticket-name', order.recipe.name), parts),
    append(el('span', 'ticket-bar'), bar),
  );
  return { root, bar };
}

function paint(ticket: Ticket, order: Order): void {
  const share = Math.max(0, Math.min(1, order.timeLeft / order.recipe.patience));
  ticket.bar.style.transform = `scaleX(${share.toFixed(3)})`;
  ticket.root.classList.toggle('is-hurry', share <= HURRY && share > URGENT);
  ticket.root.classList.toggle('is-urgent', share <= URGENT);
  ticket.root.setAttribute('aria-label', `${order.recipe.name}, ${Math.ceil(order.timeLeft)} seconds left`);
}

/** Keeps the row of order tickets in step with the open orders. */
export function createTicketRail(list: HTMLElement): TicketRail {
  const tickets = new Map<number, Ticket>();
  return {
    update(orders) {
      const open = new Set(orders.map((order) => order.id));
      for (const [id, ticket] of tickets) {
        if (open.has(id)) continue;
        ticket.root.remove();
        tickets.delete(id);
      }
      for (const order of orders) {
        let ticket = tickets.get(order.id);
        if (ticket === undefined) {
          ticket = createTicket(order);
          tickets.set(order.id, ticket);
          list.appendChild(ticket.root);
        }
        paint(ticket, order);
      }
    },
    clear() {
      for (const ticket of tickets.values()) ticket.root.remove();
      tickets.clear();
    },
  };
}
