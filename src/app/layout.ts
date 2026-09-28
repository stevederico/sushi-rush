/** A wide kitchen turns upright once the stage is this much taller than wide. */
const TURN_UPRIGHT = 1.15;
/** An upright kitchen turns back once the stage is this much wider than tall. */
const TURN_WIDE = 1.05;

/**
 * Whether the kitchen should be turned upright for a stage of this size.
 * The two thresholds differ so a near-square window does not flip back and forth.
 */
export function shouldTurn(width: number, height: number, isTurned: boolean): boolean {
  if (width <= 0 || height <= 0) return isTurned;
  return isTurned ? width < height * TURN_WIDE : height > width * TURN_UPRIGHT;
}
