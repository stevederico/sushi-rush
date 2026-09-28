/**
 * True on screens that only have a finger to point with, like phones and most tablets.
 * A keyboard may still be attached, which only a key press can tell.
 */
export function isTouchOnly(): boolean {
  if (typeof window.matchMedia !== 'function') return false;
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  const hasFinePointer = window.matchMedia('(any-pointer: fine)').matches;
  return isCoarse && !hasFinePointer;
}
