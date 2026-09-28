import type { Ctx } from './shapes.ts';

const FONT = '"Trebuchet MS", "Avenir Next", "Segoe UI", system-ui, sans-serif';

/**
 * Draws centred text at a position given in tile units.
 * The text itself is set in pixels so tiny scaled font sizes never get rounded away.
 */
export function drawText(ctx: Ctx, text: string, x: number, y: number, size: number, color: string): void {
  const matrix = ctx.getTransform();
  const scale = matrix.a;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.font = `800 ${Math.max(9, size * scale)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const px = matrix.e + x * scale;
  const py = matrix.f + y * scale;
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, size * scale * 0.28);
  ctx.strokeStyle = 'rgba(32, 22, 44, 0.85)';
  ctx.strokeText(text, px, py);
  ctx.fillStyle = color;
  ctx.fillText(text, px, py);
  ctx.restore();
}
