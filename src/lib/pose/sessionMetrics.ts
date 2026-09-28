/** Technical tracking + prototype coaching metrics. Not health or clinical measures. */
export interface SessionStats {
  totalFrames: number;
  reliableFrames: number;
  lostEvents: number;
  reps: number;
  partial: number;
  tooFast: number;
  returnHints: number;
  leftReps: number;
  rightReps: number;
  sideRepeats: number;
  durationMs: number;
}

export const emptyStats = (): SessionStats => ({
  totalFrames: 0,
  reliableFrames: 0,
  lostEvents: 0,
  reps: 0,
  partial: 0,
  tooFast: 0,
  returnHints: 0,
  leftReps: 0,
  rightReps: 0,
  sideRepeats: 0,
  durationMs: 0,
});

/** Share of active-session frames where this exercise's required landmarks were reliable. */
export function trackingQuality(s: SessionStats): number {
  return s.totalFrames === 0 ? 0 : Math.round((s.reliableFrames / s.totalFrames) * 100);
}

/**
 * FORM CONSISTENCY (prototype coaching metric, 0–100):
 * 70% share of attempted reps that reached full range and returned, 30% tracking quality.
 */
export function formConsistency(s: SessionStats): number {
  const attempts = s.reps + s.partial + s.tooFast;
  const rangeShare = attempts === 0 ? 0 : s.reps / attempts;
  return Math.round(100 * (0.7 * rangeShare + 0.3 * (trackingQuality(s) / 100)));
}

export function formatTime(ms: number): string {
  const t = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}
