import type { Tone } from "@/types";
import { curlConfig } from "@/config/curlConfig";
import { lungeConfig } from "@/config/lungeConfig";
import { squatConfig } from "@/config/squatConfig";
import { calculateAngle } from "./angles";
import { stepRange, type DetState, type PoseEvent, type Side, type Step } from "./detector";
import { stepLunge, type LungeInput } from "./lungeDetector";
import {
  bodyStatus,
  landmarkQuality,
  LM,
  readKnees,
  type Landmark,
  type TrackingStatus,
} from "./poseConfidence";
import type { SessionStats } from "./sessionMetrics";
import { trackingQuality } from "./sessionMetrics";

export type ExerciseId = "squat" | "curl" | "lunge";

export interface Reading {
  status: TrackingStatus;
  /** Detector input, null when this exercise's own required landmarks are unreliable. */
  input: unknown;
  /** Headline joint angle for the HUD, if any. */
  angle: number | null;
  debug: [string, string][];
}

/**
 * One exercise = its own landmarks, angles, thresholds, state machine and feedback.
 * Camera, model, skeleton, timer, HUD, summary and XP are shared by PoseCoach.
 */
export interface ExerciseDefinition {
  id: ExerciseId;
  name: string;
  difficulty: "Beginner" | "Intermediate";
  tone: Tone;
  targetReps: number;
  badgeId: string;
  usesSide: boolean;
  angleLabel: string;
  framing: string;
  thresholds: string;
  requiredLandmarks: (side: Side) => number[];
  read: (lms: Landmark[] | undefined, side: Side) => Reading;
  step: (d: DetState, input: unknown, now: number) => Step;
  message: (e: Exclude<PoseEvent, null>, d: DetState) => string;
  notes: (s: SessionStats) => string[];
}

const deg = (v: number | null | undefined) => (v == null ? "—" : `${v.toFixed(0)}°`);
const LEGS = [LM.lHip, LM.rHip, LM.lKnee, LM.rKnee, LM.lAnkle, LM.rAnkle];
const armIdx = (s: Side) =>
  s === "left" ? [LM.lShoulder, LM.lElbow, LM.lWrist] : [LM.rShoulder, LM.rElbow, LM.rWrist];
const cap = (s: Side) => (s === "left" ? "LEFT" : "RIGHT");
const other = (s: Side): Side => (s === "left" ? "right" : "left");

function trackingNote(s: SessionStats) {
  return s.lostEvents >= 2 || trackingQuality(s) < 75
    ? ["Try moving slightly farther from the camera next session."]
    : [];
}

const squat: ExerciseDefinition = {
  id: "squat",
  name: "Squat",
  difficulty: "Beginner",
  tone: "pink",
  targetReps: squatConfig.targetReps,
  badgeId: "b1",
  usesSide: false,
  angleLabel: "Knee angle",
  framing: "Keep your full body in view",
  thresholds: `down <${squatConfig.downThreshold}°  up >${squatConfig.upThreshold}°`,
  requiredLandmarks: () => LEGS,
  read: (lms) => {
    const k = readKnees(lms, squatConfig);
    return {
      status: k.status,
      input: k.angle,
      angle: k.angle,
      debug: [
        ["Left knee", `${deg(k.left)} vis ${k.leftVis.toFixed(2)}`],
        ["Right knee", `${deg(k.right)} vis ${k.rightVis.toFixed(2)}`],
      ],
    };
  },
  step: (d, input, now) =>
    stepRange(d, input as number | null, now, {
      high: squatConfig.upThreshold,
      low: squatConfig.downThreshold,
      partial: squatConfig.shallowThreshold,
      alpha: squatConfig.smoothingAlpha,
      minRepDurationMs: squatConfig.minRepDurationMs,
      returnHintMs: squatConfig.returnHintMs,
      topLabel: "UP",
      bottomLabel: "DOWN",
    }),
  message: (e, d) =>
    ({
      rep: d.reps === 1 ? "NICE DEPTH ✓" : "GOOD REP ✓",
      swing: "GOOD REP ✓",
      too_fast: "SLOW IT DOWN A LITTLE",
      partial: "GO A LITTLE LOWER",
      return: "RETURN TO STANDING",
      lost: "STEP BACK — KEEP YOUR FULL BODY IN VIEW",
      resumed: "FULL BODY IN VIEW",
    })[e],
  notes: (s) => [
    ...(s.partial >= 2 ? ["Focus on reaching consistent depth before returning to standing."] : []),
    ...trackingNote(s),
    ...(s.tooFast >= 2 ? ["Slow down a little — controlled reps are easier to track."] : []),
  ],
};

const curl: ExerciseDefinition = {
  id: "curl",
  name: "Bicep Curl",
  difficulty: "Beginner",
  tone: "cyan",
  targetReps: curlConfig.targetReps,
  badgeId: "b7",
  usesSide: true,
  angleLabel: "Elbow angle",
  framing: "Keep your upper body and selected arm in view",
  thresholds: `curled <${curlConfig.curledThreshold}°  extended >${curlConfig.extendedThreshold}°`,
  requiredLandmarks: armIdx,
  read: (lms, side) => {
    const idx = armIdx(side);
    const q = landmarkQuality(lms, idx);
    const ok = q >= curlConfig.visibilityThreshold;
    const [s, e, w] = idx.map((i) => lms?.[i]);
    const angle = ok ? calculateAngle(s!, e!, w!) : null;
    // Upper-arm angle from vertical: how far the elbow travels away from the torso line.
    const swing = ok ? calculateAngle({ x: s!.x, y: s!.y + 1 }, s!, e!) : 0;
    return {
      status: bodyStatus(lms, ok),
      input: angle === null ? null : { angle, swing },
      angle,
      debug: [
        ["Arm", cap(side)],
        ["Elbow angle", deg(angle)],
        ["Arm vis", q.toFixed(2)],
        ["Upper-arm swing", deg(swing)],
      ],
    };
  },
  step: (d, input, now) => {
    const i = input as { angle: number; swing: number } | null;
    return stepRange(
      d,
      i?.angle ?? null,
      now,
      {
        high: curlConfig.extendedThreshold,
        low: curlConfig.curledThreshold,
        partial: curlConfig.partialThreshold,
        alpha: curlConfig.smoothingAlpha,
        minRepDurationMs: curlConfig.minRepDurationMs,
        returnHintMs: curlConfig.returnHintMs,
        topLabel: "EXTENDED",
        bottomLabel: "CURLED",
        swingLimit: curlConfig.elbowSwingDeg,
      },
      i?.swing ?? 0,
    );
  },
  message: (e) =>
    ({
      rep: "GOOD CURL ✓",
      swing: "REP COUNTED — KEEP YOUR ELBOW STEADY",
      too_fast: "SLOW IT DOWN A LITTLE",
      partial: "CURL A LITTLE HIGHER",
      return: "EXTEND YOUR ARM",
      lost: "KEEP YOUR ARM IN VIEW",
      resumed: "ARM IN VIEW",
    })[e],
  notes: (s) => [
    ...(s.partial >= 2
      ? ["Try completing the curl before returning to the starting position."]
      : []),
    ...(s.returnHints >= 2
      ? ["Focus on returning to the extended position between repetitions."]
      : []),
    ...trackingNote(s),
  ],
};

const lunge: ExerciseDefinition = {
  id: "lunge",
  name: "Lunge",
  difficulty: "Intermediate",
  tone: "lime",
  targetReps: lungeConfig.targetReps,
  badgeId: "b8",
  usesSide: false,
  angleLabel: "Lower knee",
  framing: "Step back — keep your full body in view",
  thresholds: `down <${lungeConfig.downKneeThreshold}°  standing >${lungeConfig.standingKneeThreshold}°  side gap ${lungeConfig.sideDifferenceThreshold}°`,
  requiredLandmarks: () => LEGS,
  read: (lms) => {
    const q = landmarkQuality(lms, LEGS);
    const ok = q >= lungeConfig.visibilityThreshold;
    const p = (i: number) => lms![i]!;
    const input: LungeInput | null = ok
      ? {
          left: calculateAngle(p(LM.lHip), p(LM.lKnee), p(LM.lAnkle)),
          right: calculateAngle(p(LM.rHip), p(LM.rKnee), p(LM.rAnkle)),
          leftAnkleY: p(LM.lAnkle).y,
          rightAnkleY: p(LM.rAnkle).y,
        }
      : null;
    return {
      status: bodyStatus(lms, ok),
      input,
      angle: input ? Math.min(input.left, input.right) : null,
      debug: [
        ["Left knee", deg(input?.left)],
        ["Right knee", deg(input?.right)],
        ["Leg vis", q.toFixed(2)],
      ],
    };
  },
  step: (d, input, now) => stepLunge(d, input as LungeInput | null, now),
  message: (e, d) => {
    if (e === "rep") {
      const s = d.lastSide!;
      return d.repeatedSide
        ? `GOOD ${cap(s)} REP ✓ — TRY ALTERNATING SIDES`
        : `GOOD ${cap(s)} REP ✓ — ${cap(other(s))} SIDE NEXT`;
    }
    return {
      swing: "",
      too_fast: "SLOW IT DOWN A LITTLE",
      partial: "GO A LITTLE LOWER",
      return: "RETURN TO STANDING",
      lost: "KEEP YOUR FULL BODY IN VIEW",
      resumed: "STEP INTO YOUR LUNGE",
    }[e];
  },
  notes: (s) => [
    ...(s.partial >= 2 ? ["Try reaching a more consistent lunge depth."] : []),
    ...(s.sideRepeats >= 3 || Math.abs(s.leftReps - s.rightReps) >= 3
      ? ["Try alternating sides more consistently."]
      : []),
    ...trackingNote(s),
  ],
};

export const exercises: Record<ExerciseId, ExerciseDefinition> = { squat, curl, lunge };
export const exerciseList = [squat, curl, lunge];

/** Session record kept in local state — no frames, no images. */
export interface PoseSession {
  id: string;
  exercise: ExerciseId;
  completedAt: string;
  reps: number;
  targetReps: number;
  durationSeconds: number;
  formConsistency: number;
  trackingQuality: number;
  side?: Side;
  leftReps?: number;
  rightReps?: number;
}

export const FORM_MASTER_BADGE = "b5";

/** Strong-session fallback notes per exercise. */
export const strongNote: Record<ExerciseId, string> = {
  squat: "Nice consistency across the session.",
  curl: "Nice consistency across your curl repetitions.",
  lunge: "Nice left-right consistency across the session.",
};
