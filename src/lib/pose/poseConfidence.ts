import type { SquatConfig } from "@/config/squatConfig";
import { calculateAngle } from "./angles";

export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

/** MediaPipe Pose landmark indices. */
export const LM = {
  lShoulder: 11,
  rShoulder: 12,
  lElbow: 13,
  rElbow: 14,
  lWrist: 15,
  rWrist: 16,
  lHip: 23,
  rHip: 24,
  lKnee: 25,
  rKnee: 26,
  lAnkle: 27,
  rAnkle: 28,
} as const;

export const SKELETON: [number, number][] = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
];

export type TrackingStatus = "none" | "partial" | "good";

export interface KneeReading {
  status: TrackingStatus;
  left: number | null;
  right: number | null;
  /** Raw (unsmoothed) knee angle used for detection, null when unreliable. */
  angle: number | null;
  leftVis: number;
  rightVis: number;
}

const vis = (l: Landmark | undefined) => (l ? (l.visibility ?? 0) : 0);
const inFrame = (l: Landmark | undefined) =>
  !!l && l.x > -0.05 && l.x < 1.05 && l.y > -0.05 && l.y < 1.05;

function side(lms: Landmark[], hip: number, knee: number, ankle: number) {
  const pts = [lms[hip], lms[knee], lms[ankle]];
  const minVis = Math.min(...pts.map(vis));
  const framed = pts.every(inFrame);
  const angle = pts.every(Boolean) ? calculateAngle(pts[0]!, pts[1]!, pts[2]!) : null;
  return { minVis: framed ? minVis : 0, angle };
}

/** Decide whether the legs are reliably visible and derive a knee angle. Never invents data. */
export function readKnees(lms: Landmark[] | undefined, cfg: SquatConfig): KneeReading {
  if (!lms || lms.length < 29)
    return { status: "none", left: null, right: null, angle: null, leftVis: 0, rightVis: 0 };
  const L = side(lms, LM.lHip, LM.lKnee, LM.lAnkle);
  const R = side(lms, LM.rHip, LM.rKnee, LM.rAnkle);
  const lOk = L.minVis >= cfg.visibilityThreshold;
  const rOk = R.minVis >= cfg.visibilityThreshold;
  let angle: number | null = null;
  if (lOk && rOk) angle = ((L.angle ?? 0) + (R.angle ?? 0)) / 2;
  else if (lOk && L.minVis >= cfg.singleSideVisibility) angle = L.angle;
  else if (rOk && R.minVis >= cfg.singleSideVisibility) angle = R.angle;
  const anyBody =
    Math.max(
      vis(lms[LM.lShoulder]),
      vis(lms[LM.rShoulder]),
      vis(lms[LM.lHip]),
      vis(lms[LM.rHip]),
    ) >= 0.5;
  const status: TrackingStatus = angle !== null ? "good" : anyBody ? "partial" : "none";
  return { status, left: L.angle, right: R.angle, angle, leftVis: L.minVis, rightVis: R.minVis };
}

/** Min visibility over the given landmarks, 0 if any is missing or out of frame. */
export function landmarkQuality(lms: Landmark[] | undefined, idx: readonly number[]): number {
  if (!lms) return 0;
  const pts = idx.map((i) => lms[i]);
  return pts.every(inFrame) ? Math.min(...pts.map(vis)) : 0;
}

/** "partial" when a torso is visible but required joints aren't, else "none". */
export function bodyStatus(lms: Landmark[] | undefined, ok: boolean): TrackingStatus {
  if (ok) return "good";
  if (!lms) return "none";
  const torso = Math.max(
    vis(lms[LM.lShoulder]),
    vis(lms[LM.rShoulder]),
    vis(lms[LM.lHip]),
    vis(lms[LM.rHip]),
  );
  return torso >= 0.5 ? "partial" : "none";
}
