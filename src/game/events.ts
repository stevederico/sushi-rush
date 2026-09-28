import type { GameEventType, World } from './types.ts';

/** Queues something for the renderer and the sound player to react to. */
export function emit(world: Pick<World, 'events'>, type: GameEventType, x: number, y: number, value = 0): void {
  world.events.push({ type, x, y, value });
}

/** Queues an event at the centre of a tile. */
export function emitAtTile(
  world: Pick<World, 'events'>,
  type: GameEventType,
  tile: { x: number; y: number },
  value = 0,
): void {
  emit(world, type, tile.x + 0.5, tile.y + 0.5, value);
}
