import { ema } from "./smoothing";

export type Side = "left" | "right";

/** Events a detector can emit on a frame. Messages are chosen per exercise. */
export type PoseEvent =
  "rep" | "too_fast" | "partial" | "return" | "lost" | "resumed" | "swing" | null;

/** One state shape shared by every exercise detector. */
export interface DetState {
  state: string; // "UNKNOWN" + exercise-specific states
  reps: number;
  partial: number;
  tooFast: number;
  returnHints: number;
  tracking: boolean;
  smoothed: (number | null)[];
  cycleStart: number | null;
  minSince: number;
  hoverSince: number | null;
  returnHinted: boolean;
  maxSwing: number;
  /** Lunge */
  side: Side | null;
  lastSide: Side | null;
  leftReps: number;
  rightReps: number;
  sideRepeats: number;
  repeatedSide: boolean;
}

export interface Step {
  d: DetState;
  event: PoseEvent;
}

export function newDetState(): DetState {
  return {
    state: "UNKNOWN",
    reps: 0,
    partial: 0,
    tooFast: 0,
    returnHints: 0,
    tracking: false,
    smoothed: [],
    cycleStart: null,
    minSince: 180,
    hoverSince: null,
    returnHinted: false,
    maxSwing: 0,
    side: null,
    lastSide: null,
    leftReps: 0,
    rightReps: 0,
    sideRepeats: 0,
    repeatedSide: false,
  };
}

const resetCycle = {
  cycleStart: null,
  minSince: 180,
  hoverSince: null,
  returnHinted: false,
  maxSwing: 0,
  side: null,
} as const;

/**
 * Shared frame prologue: pauses on unreliable data (dropping any in-progress cycle so
 * movement while lost never counts), otherwise smooths the inputs.
 */
export function beginStep(
  d: DetState,
  inputs: number[] | null,
  alpha: number,
): Step | { n: DetState; event: PoseEvent } {
  if (inputs === null) {
    if (!d.tracking) return { d, event: null };
    return {
      d: { ...d, ...resetCycle, tracking: false, state: "UNKNOWN", smoothed: [] },
      event: "lost",
    };
  }
  const smoothed = inputs.map((v, i) => ema(v, d.smoothed[i] ?? null, alpha));
  const event: PoseEvent = !d.tracking && d.reps + d.partial > 0 ? "resumed" : null;
  return { n: { ...d, smoothed, tracking: true }, event };
}

/** Shared "stuck part-way after depth" hint. */
export function hoverHint(n: DetState, hovering: boolean, now: number, ms: number): PoseEvent {
  if (!hovering) {
    n.hoverSince = null;
    return null;
  }
  n.hoverSince ??= now;
  if (!n.returnHinted && now - n.hoverSince >= ms) {
    n.returnHinted = true;
    n.returnHints += 1;
    return "return";
  }
  return null;
}

export interface RangeCfg {
  /** Angle above this = start/top state (UP / EXTENDED). */
  high: number;
  /** Angle below this = end/bottom state (DOWN / CURLED). */
  low: number;
  /** Min angle below this without reaching `low` = partial attempt. */
  partial: number;
  alpha: number;
  minRepDurationMs: number;
  returnHintMs: number;
  topLabel: string;
  bottomLabel: string;
  /** Optional secondary coaching: swing above this on a rep → "swing" event (rep still counts). */
  swingLimit?: number;
}

/**
 * Two-threshold (hysteresis) rep machine used by Squat (knee) and Curl (elbow):
 * TOP → angle < low → BOTTOM → angle > high → +1 rep (if min duration met).
 */
export function stepRange(
  d: DetState,
  angle: number | null,
  now: number,
  c: RangeCfg,
  swing = 0,
): Step {
  const b = beginStep(d, angle === null ? null : [angle], c.alpha);
  if ("d" in b) return b;
  const { n } = b;
  let event = b.event;
  const s = n.smoothed[0]!;

  if (n.state === "UNKNOWN") {
    if (s > c.high) n.state = c.topLabel;
    return { d: n, event };
  }

  if (n.state === c.topLabel) {
    if (s < c.high && n.cycleStart === null) n.cycleStart = now;
    if (n.cycleStart !== null) n.maxSwing = Math.max(n.maxSwing, swing);
    n.minSince = Math.min(n.minSince, s);
    if (s < c.low) {
      n.state = c.bottomLabel;
      n.hoverSince = null;
      n.returnHinted = false;
    } else if (s > c.high && n.cycleStart !== null) {
      if (n.minSince < c.partial) {
        n.partial += 1;
        event = "partial";
      }
      Object.assign(n, resetCycle);
    }
    return { d: n, event };
  }

  // Bottom state
  n.maxSwing = Math.max(n.maxSwing, swing);
  if (s > c.high) {
    if (n.cycleStart !== null && now - n.cycleStart >= c.minRepDurationMs) {
      n.reps += 1;
      event = c.swingLimit !== undefined && n.maxSwing > c.swingLimit ? "swing" : "rep";
    } else {
      n.tooFast += 1;
      event = "too_fast";
    }
    n.state = c.topLabel;
    Object.assign(n, resetCycle);
    return { d: n, event };
  }
  return { d: n, event: hoverHint(n, s > c.low + 15, now, c.returnHintMs) ?? event };
}
