export type TapHandler = (px: number, py: number) => void;

/**
 * Reports taps and clicks on the canvas in device pixels.
 * Returns a function that removes the listener.
 */
export function listenForTaps(canvas: HTMLCanvasElement, handleTap: TapHandler): () => void {
  const handlePointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    event.preventDefault();
    const box = canvas.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;
    const px = ((event.clientX - box.left) / box.width) * canvas.width;
    const py = ((event.clientY - box.top) / box.height) * canvas.height;
    handleTap(px, py);
  };
  canvas.addEventListener('pointerdown', handlePointerDown);
  return () => canvas.removeEventListener('pointerdown', handlePointerDown);
}
