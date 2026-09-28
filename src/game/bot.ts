import { commandChef } from './navigation.ts';
import { planNextStep } from './planner.ts';
import type { Plan } from './planner.ts';
import type { Chef, Order, World } from './types.ts';

/** The ticket a lone chef should work on: the oldest one still open. */
export function getFocusOrder(world: World): Order | null {
  let focus: Order | null = null;
  for (const order of world.orders) {
    if (focus === null || order.id < focus.id) focus = order;
  }
  return focus;
}

/**
 * The tickets in the order a chef should consider them.
 * The first chef starts from the oldest ticket and the second from the next one,
 * so two chefs share out the work instead of cooking the same dish twice.
 */
function getTicketOrder(world: World, chef: Chef): Order[] {
  const orders = [...world.orders].sort((a, b) => a.id - b.id);
  const first = orders.length === 0 ? 0 : chef.id % orders.length;
  return [...orders.slice(first), ...orders.slice(0, first)];
}

/**
 * The next step for a chef. It follows the chef's own ticket, but when that ticket
 * has no use for what the chef holds it looks for another ticket that does.
 */
export function getHint(world: World, chef: Chef): Plan | null {
  const orders = getTicketOrder(world, chef);
  let fallback: Plan | null = null;
  for (const order of orders) {
    const plan = planNextStep(world, chef, order.recipe);
    if (plan !== null && !plan.isDiscard) return plan;
    fallback ??= plan;
  }
  return fallback;
}

/**
 * Plays a chef automatically by tapping the station the planner suggests.
 * Used by the title screen demo and by the integration tests.
 */
export function updateBot(world: World, chef: Chef): void {
  if (chef.goal !== null || chef.working !== -1) return;
  const plan = getHint(world, chef);
  const station = plan === null ? undefined : world.stations[plan.station];
  if (station !== undefined) commandChef(world, chef, { x: station.x, y: station.y });
}
