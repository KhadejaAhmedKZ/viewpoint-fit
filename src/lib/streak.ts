/**
 * Streak from "days ago" activity offsets (0 = today). The streak stays alive
 * if the chain ends today or yesterday.
 */
export function calculateStreak(activeDaysAgo: number[]): number {
  const set = new Set(activeDaysAgo);
  const start = set.has(0) ? 0 : set.has(1) ? 1 : -1;
  if (start < 0) return 0;
  let n = 0;
  while (set.has(start + n)) n++;
  return n;
}
