/** PROTOTYPE MOVEMENT HEURISTICS for Bicep Curl — not medical thresholds. */
export const curlConfig = {
  /** Elbow angle above this = EXTENDED. */
  extendedThreshold: 150,
  /** Elbow angle below this = CURLED. */
  curledThreshold: 55,
  /** Bending below this without reaching CURLED counts as a half curl. */
  partialThreshold: 110,
  visibilityThreshold: 0.6,
  smoothingAlpha: 0.3,
  minRepDurationMs: 600,
  returnHintMs: 1500,
  /** Upper-arm swing from vertical (deg) above which "keep your elbow steady" shows. Coaching only, never blocks a rep. */
  elbowSwingDeg: 40,
  targetReps: 10,
} as const;
