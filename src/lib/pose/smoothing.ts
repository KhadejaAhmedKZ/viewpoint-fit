/** Exponential moving average. Returns current when there is no previous value. */
export function ema(current: number, previous: number | null, alpha: number): number {
  return previous === null ? current : alpha * current + (1 - alpha) * previous;
}
