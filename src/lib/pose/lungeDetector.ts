import { lungeConfig as c } from "@/config/lungeConfig";
import { beginStep, hoverHint, type DetState, type Side, type Step } from "./detector";

export interface LungeInput {
  left: number;
  right: number;
  /** Ankle heights (normalized y, larger = lower on screen) — tie-breaker for the front leg. */
  leftAnkleY: number;
  rightAnkleY: number;
}

function workingSide(l: number, r: number, i: LungeInput): Side {
  if (Math.abs(l - r) >= c.sideDifferenceThreshold) return l < r ? "left" : "right";
  // Knees similar: the front foot usually sits lower in a front-facing camera frame.
  return i.leftAnkleY >= i.rightAnkleY ? "left" : "right";
}

/** STANDING → LEFT_DOWN / RIGHT_DOWN → STANDING = +1 rep (each full lunge counts once). */
export function stepLunge(d: DetState, input: LungeInput | null, now: number): Step {
  const b = beginStep(d, input && [input.left, input.right], c.smoothingAlpha);
  if ("d" in b) return b;
  const { n } = b;
  let event = b.event;
  const [l, r] = n.smoothed as [number, number];
  const low = Math.min(l, r);
  const standing = l > c.standingKneeThreshold && r > c.standingKneeThreshold;

  if (n.state === "UNKNOWN") {
    if (standing) n.state = "STANDING";
    return { d: n, event };
  }

  if (n.state === "STANDING") {
    if (!standing && n.cycleStart === null) n.cycleStart = now;
    n.minSince = Math.min(n.minSince, low);
    if (low < c.downKneeThreshold) {
      n.side = workingSide(l, r, input!);
      n.state = n.side === "left" ? "LEFT_DOWN" : "RIGHT_DOWN";
      n.hoverSince = null;
      n.returnHinted = false;
    } else if (standing && n.cycleStart !== null) {
      if (n.minSince < c.shallowThreshold) {
        n.partial += 1;
        event = "partial";
      }
      n.cycleStart = null;
      n.minSince = 180;
    }
    return { d: n, event };
  }

  // LEFT_DOWN / RIGHT_DOWN
  if (standing) {
    if (n.cycleStart !== null && now - n.cycleStart >= c.minRepDurationMs) {
      const side = n.side!;
      n.reps += 1;
      if (side === "left") n.leftReps += 1;
      else n.rightReps += 1;
      n.repeatedSide = n.lastSide === side;
      if (n.repeatedSide) n.sideRepeats += 1;
      n.lastSide = side;
      event = "rep";
    } else {
      n.tooFast += 1;
      event = "too_fast";
    }
    Object.assign(n, {
      state: "STANDING",
      cycleStart: null,
      minSince: 180,
      hoverSince: null,
      returnHinted: false,
      side: null,
    });
    return { d: n, event };
  }
  return {
    d: n,
    event: hoverHint(n, low > c.downKneeThreshold + 15, now, c.returnHintMs) ?? event,
  };
}
