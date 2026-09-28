const MAX_DENSITY = 2.5;

export interface View {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  /** Matches the canvas resolution to its size on screen. Returns true when it changed. */
  fit(): boolean;
}

/** Wraps the kitchen canvas and keeps it sharp at any size and pixel density. */
export function createView(canvas: HTMLCanvasElement): View {
  const ctx = canvas.getContext('2d');
  if (ctx === null) throw new Error('This browser cannot draw on a canvas');
  return {
    canvas,
    ctx,
    fit() {
      const density = Math.min(MAX_DENSITY, window.devicePixelRatio || 1);
      const width = Math.max(1, Math.round(canvas.clientWidth * density));
      const height = Math.max(1, Math.round(canvas.clientHeight * density));
      if (canvas.width === width && canvas.height === height) return false;
      canvas.width = width;
      canvas.height = height;
      return true;
    },
  };
}
