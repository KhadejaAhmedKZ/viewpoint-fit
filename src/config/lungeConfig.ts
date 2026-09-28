/** PROTOTYPE MOVEMENT HEURISTICS for alternating lunges — not clinical thresholds. */
export const lungeConfig = {
  /** Lower knee angle below this = lunge depth reached. */
  downKneeThreshold: 115,
  /** Both knees above this = standing. */
  standingKneeThreshold: 155,
  /** Bending below this without reaching depth counts as a shallow attempt. */
  shallowThreshold: 140,
  /** Knee-angle gap needed to decide the working side from angles alone. */
  sideDifferenceThreshold: 15,
  visibilityThreshold: 0.6,
  smoothingAlpha: 0.3,
  minRepDurationMs: 700,
  returnHintMs: 1500,
  targetReps: 10,
} as const;
