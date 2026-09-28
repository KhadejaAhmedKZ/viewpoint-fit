/**
 * PROTOTYPE MOVEMENT HEURISTICS — tune here, never in components.
 * These are game/coaching thresholds, NOT medical or injury thresholds.
 */
export const squatConfig = {
  /** Smoothed knee angle below this = DOWN (squat depth reached). */
  downThreshold: 100,
  /** Smoothed knee angle above this = UP (standing). Separate from down → hysteresis. */
  upThreshold: 160,
  /** Bending below this without reaching depth counts as a shallow attempt. */
  shallowThreshold: 140,
  /** Min landmark visibility for a joint to be trusted. */
  visibilityThreshold: 0.6,
  /** A single side may drive detection only above this confidence. */
  singleSideVisibility: 0.8,
  /** EMA weight for the newest angle. */
  smoothingAlpha: 0.3,
  /** A full UP → DOWN → UP cycle faster than this is ignored. */
  minRepDurationMs: 700,
  /** Stuck partly bent (between thresholds) after DOWN for this long → "return to standing". */
  returnHintMs: 1500,
  targetReps: 10,
  questXp: 100,
} as const;

export type SquatConfig = typeof squatConfig;
