import type { App } from './app.ts';
import { getLevel } from '../game/levels.ts';

/** Handles for automated play checks. Only installed by the dev server, never in a build. */
export interface DebugTools {
  phase(): string;
  state(): Record<string, unknown>;
  start(levelId: number, chefCount: number): void;
  autoplay(isOn: boolean): void;
  skip(seconds: number): void;
  tap(x: number, y: number): boolean;
}

declare global {
  interface Window {
    sushi?: DebugTools;
  }
}

/** Installs the debug handles on the window. */
export function installDebugTools(app: App): void {
  window.sushi = {
    phase: () => app.getPhase(),
    state: () => {
      const { world, isTurned } = app.getSession();
      return {
        phase: app.getPhase(),
        size: `${world.width}x${world.height}`,
        isTurned,
        level: world.level.id,
        score: world.score,
        served: world.served,
        expired: world.expired,
        timeLeft: Math.round(world.timeLeft),
        cat: world.cat === null ? null : { state: world.cat.state, x: Number(world.cat.x.toFixed(2)), y: Number(world.cat.y.toFixed(2)) },
        orders: world.orders.map((order) => `${order.recipe.id}:${Math.round(order.timeLeft)}`),
        chefs: world.chefs.map((chef) => ({
          x: Number(chef.x.toFixed(2)),
          y: Number(chef.y.toFixed(2)),
          holding: chef.holding,
          working: chef.working,
        })),
      };
    },
    start: (levelId, chefCount) => {
      app.startLevel(getLevel(levelId), chefCount);
      app.skipCountdown();
    },
    autoplay: (isOn) => app.setAutoplay(isOn),
    skip: (seconds) => app.fastForward(seconds),
    tap: (x, y) => app.tapTile(x, y),
  };
}
