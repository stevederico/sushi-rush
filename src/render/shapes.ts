export type Ctx = CanvasRenderingContext2D;

const TAU = Math.PI * 2;

/** Fills a circle. */
export function circle(ctx: Ctx, x: number, y: number, radius: number, fill: string): void {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
}

/** Fills an ellipse, optionally rotated. */
export function ellipse(ctx: Ctx, x: number, y: number, rx: number, ry: number, fill: string, angle = 0): void {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, angle, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
}

/** Fills a rectangle with rounded corners. */
export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, radius: number, fill: string): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
}

/** Strokes a rectangle with rounded corners. */
export function strokeRoundRect(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  stroke: string,
  width: number,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
}

/** Strokes a straight line. */
export function line(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, stroke: string, width: number): void {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.stroke();
}

/** Fills a closed polygon from a flat list of x, y pairs. */
export function polygon(ctx: Ctx, points: readonly number[], fill: string): void {
  ctx.beginPath();
  for (let index = 0; index + 1 < points.length; index += 2) {
    const x = points[index] ?? 0;
    const y = points[index + 1] ?? 0;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

/** Runs a drawing routine in a moved, scaled and rotated frame, then restores the context. */
export function withTransform(
  ctx: Ctx,
  x: number,
  y: number,
  scale: number,
  angle: number,
  draw: () => void,
): void {
  ctx.save();
  ctx.translate(x, y);
  if (angle !== 0) ctx.rotate(angle);
  if (scale !== 1) ctx.scale(scale, scale);
  draw();
  ctx.restore();
}

/** Draws a progress bar centred on x. */
export function progressBar(ctx: Ctx, x: number, y: number, width: number, value: number, fill: string): void {
  const height = 0.13;
  roundRect(ctx, x - width / 2 - 0.025, y - 0.025, width + 0.05, height + 0.05, 0.09, 'rgba(30, 22, 40, 0.85)');
  const filled = Math.max(0, Math.min(1, value)) * width;
  if (filled > 0.01) roundRect(ctx, x - width / 2, y, filled, height, 0.065, fill);
}
