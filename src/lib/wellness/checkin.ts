/**
 * DAILY CHECK-IN → wellness dimension scores.
 * Prototype wellness scoring heuristic — transparent, capped, NOT a validated clinical score.
 * Missing answers are skipped (never counted as 0); each dimension renormalizes over the parts provided.
 * All formulas live here — UI components never re-implement them.
 */
import type { Mission } from "@/types";
import { calculateViewScore, type WellnessComponents } from "@/lib/wellnessScore";

export const EXERCISE_TYPES = [
  "walking",
  "running",
  "strength",
  "cycling",
  "sport",
  "pose",
  "other",
] as const;
export type ExerciseType = (typeof EXERCISE_TYPES)[number];
export const MOOD_TAGS = [
  "energetic",
  "calm",
  "focused",
  "tired",
  "busy",
  "stressed",
  "low energy",
  "good",
] as const;

export interface CheckInInput {
  steps: number | null;
  activeMinutes: number | null;
  exercised: boolean | null;
  exerciseMinutes: number | null;
  exerciseType: ExerciseType | null;
  sleepMinutes: number | null;
  /** 1 poor · 2 fair · 3 good · 4 great */
  sleepQuality: number | null;
  /** 1 no · 2 somewhat · 3 yes */
  sleepSchedule: number | null;
  /** 1 low · 2 okay · 3 good · 4 great */
  mealBalance: number | null;
  waterLiters: number | null;
  /** 1 irregular · 2 mostly regular · 3 regular */
  mealConsistency: number | null;
  /** 1–5 */
  recoveryFeeling: number | null;
  /** 1 rarely · 2 sometimes · 3 regularly */
  breakFrequency: number | null;
  /** 1 rest · 2 light · 3 moderate · 4 hard training */
  activityLoad: number | null;
  /** 1–5 self-reported */
  energy: number | null;
  /** 1–5 self-reported */
  stress: number | null;
  moodTags: string[];
}

export const emptyCheckIn: CheckInInput = {
  steps: null,
  activeMinutes: null,
  exercised: null,
  exerciseMinutes: null,
  exerciseType: null,
  sleepMinutes: null,
  sleepQuality: null,
  sleepSchedule: null,
  mealBalance: null,
  waterLiters: null,
  mealConsistency: null,
  recoveryFeeling: null,
  breakFrequency: null,
  activityLoad: null,
  energy: null,
  stress: null,
  moodTags: [],
};

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const has = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Sum of earned points over the max points of the parts that were answered, scaled to 0–100. */
function fromParts(parts: ({ got: number; max: number } | null)[]): number | null {
  const used = parts.filter((p): p is { got: number; max: number } => p !== null);
  const max = used.reduce((a, p) => a + p.max, 0);
  if (max === 0) return null;
  return Math.round(clamp((used.reduce((a, p) => a + clamp(p.got, 0, p.max), 0) / max) * 100));
}

/** Steps ≤50 · active minutes ≤35 · intentional movement ≤15. 10k steps is only a prototype upper reference. */
export function calculateMovementScore(c: CheckInInput): number | null {
  const steps = has(c.steps) ? { got: (Math.min(c.steps, 10000) / 10000) * 50, max: 50 } : null;
  const active = has(c.activeMinutes)
    ? { got: (Math.min(c.activeMinutes, 60) / 60) * 35, max: 35 }
    : null;
  let intent: { got: number; max: number } | null = null;
  if (c.exercised === true && has(c.exerciseMinutes))
    intent = { got: (Math.min(c.exerciseMinutes, 30) / 30) * 15, max: 15 };
  // No formal workout is not a penalty: everyday active minutes count as intentional movement.
  else if (c.exercised === false && has(c.activeMinutes))
    intent = { got: (Math.min(c.activeMinutes, 30) / 30) * 15, max: 15 };
  return fromParts([steps, active, intent]);
}

/** Duration ≤55 · quality ≤25 · schedule consistency ≤20. Educational only — duration is never used to diagnose. */
export function calculateSleepScore(c: CheckInInput): number | null {
  let dur: { got: number; max: number } | null = null;
  if (has(c.sleepMinutes)) {
    const h = c.sleepMinutes / 60;
    const got =
      h >= 7 && h <= 9
        ? 55
        : h < 7
          ? 55 * Math.max(0, (h - 4) / 3)
          : Math.max(35, 55 - (h - 9) * 10);
    dur = { got, max: 55 };
  }
  const q = has(c.sleepQuality) ? { got: [5, 12, 20, 25][c.sleepQuality - 1] ?? 0, max: 25 } : null;
  const s = has(c.sleepSchedule) ? { got: [5, 12, 20][c.sleepSchedule - 1] ?? 0, max: 20 } : null;
  return fromParts([dur, q, s]);
}

/** Meal balance ≤45 · water ≤30 (broad cap — water needs differ) · meal consistency ≤25. No calories. */
export function calculateFuelScore(c: CheckInInput): number | null {
  const b = has(c.mealBalance) ? { got: [10, 25, 38, 45][c.mealBalance - 1] ?? 0, max: 45 } : null;
  const w = has(c.waterLiters) ? { got: (Math.min(c.waterLiters, 1.5) / 1.5) * 30, max: 30 } : null;
  const m = has(c.mealConsistency)
    ? { got: [8, 17, 25][c.mealConsistency - 1] ?? 0, max: 25 }
    : null;
  return fromParts([b, w, m]);
}

/** Feeling ≤45 · breaks ≤25 · activity/recovery balance ≤20 · energy/stress context ≤10. Not a mental-health score. */
export function calculateRecoveryScore(c: CheckInInput): number | null {
  const f = has(c.recoveryFeeling) ? { got: ((c.recoveryFeeling - 1) / 4) * 45, max: 45 } : null;
  const b = has(c.breakFrequency) ? { got: [6, 15, 25][c.breakFrequency - 1] ?? 0, max: 25 } : null;
  let bal: { got: number; max: number } | null = null;
  if (has(c.activityLoad)) {
    const feel = c.recoveryFeeling ?? 3;
    const got =
      c.activityLoad <= 2
        ? 20
        : c.activityLoad === 3
          ? feel >= 3
            ? 20
            : 14
          : feel >= 4
            ? 18
            : feel === 3
              ? 12
              : 8;
    bal = { got, max: 20 };
  }
  let es: { got: number; max: number } | null = null;
  if (has(c.energy) || has(c.stress)) {
    const e = has(c.energy) ? ((c.energy - 1) / 4) * 5 : null;
    const s = has(c.stress) ? ((5 - c.stress) / 4) * 5 : null;
    es = { got: (e ?? 0) + (s ?? 0), max: (e !== null ? 5 : 0) + (s !== null ? 5 : 0) };
  }
  return fromParts([f, b, bal, es]);
}

/** Today's actual mission completion, 0–100. */
export function calculateMissionConsistency(missions: Mission[]): number | null {
  if (missions.length === 0) return null;
  return Math.round((missions.filter((m) => m.completed).length / missions.length) * 100);
}

export interface InputItem {
  key: string;
  label: string;
  used: boolean;
}

/** Which inputs fed today's VIEW (for "DATA USED"). */
export function dataUsed(c: CheckInInput | null, missionsAvailable: boolean): InputItem[] {
  const x = c ?? emptyCheckIn;
  return [
    { key: "steps", label: "Steps", used: has(x.steps) },
    { key: "active", label: "Active minutes", used: has(x.activeMinutes) },
    { key: "exercise", label: "Exercise", used: x.exercised !== null },
    { key: "sleep", label: "Sleep duration", used: has(x.sleepMinutes) },
    { key: "quality", label: "Sleep quality", used: has(x.sleepQuality) },
    { key: "schedule", label: "Sleep schedule", used: has(x.sleepSchedule) },
    { key: "meals", label: "Meal balance", used: has(x.mealBalance) },
    { key: "water", label: "Water", used: has(x.waterLiters) },
    { key: "mealtimes", label: "Meal consistency", used: has(x.mealConsistency) },
    { key: "recovery", label: "Recovery", used: has(x.recoveryFeeling) },
    { key: "breaks", label: "Breaks", used: has(x.breakFrequency) },
    { key: "load", label: "Activity load", used: has(x.activityLoad) },
    { key: "energy", label: "Energy", used: has(x.energy) },
    { key: "stress", label: "Stress", used: has(x.stress) },
    { key: "missions", label: "Missions", used: missionsAvailable },
  ];
}

export type CoverageLevel = "high" | "medium" | "limited";

/** Share of check-in inputs (plus missions) available today. */
export function calculateDataCoverage(
  c: CheckInInput | null,
  missionsAvailable = true,
): { percent: number; level: CoverageLevel; label: string } {
  const items = dataUsed(c, missionsAvailable);
  const percent = Math.round((items.filter((i) => i.used).length / items.length) * 100);
  const level: CoverageLevel = percent >= 80 ? "high" : percent >= 50 ? "medium" : "limited";
  return { percent, level, label: `Data coverage: ${level}` };
}

export interface DayScores extends WellnessComponents {
  view: number | null;
}

export function calculateDayScores(c: CheckInInput | null, missions: Mission[]): DayScores {
  const comps: WellnessComponents = {
    movement: c ? calculateMovementScore(c) : null,
    sleep: c ? calculateSleepScore(c) : null,
    fuel: c ? calculateFuelScore(c) : null,
    recovery: c ? calculateRecoveryScore(c) : null,
    consistency: calculateMissionConsistency(missions),
  };
  // Mission consistency alone does not make a VIEW — wait for at least one check-in dimension.
  const any =
    comps.movement !== null ||
    comps.sleep !== null ||
    comps.fuel !== null ||
    comps.recovery !== null;
  return { ...comps, view: any ? calculateViewScore(comps) : null };
}

/** Wellness/product labels only — never medical. */
export function viewLabel(score: number | null, coverage: CoverageLevel): string {
  if (score === null || coverage === "limited") return "Limited data";
  if (score >= 75) return "Strong view";
  if (score >= 50) return "Building";
  return "Needs attention";
}

/** How many of the five check-in sections have at least their core answer. */
export function sectionsDone(c: CheckInInput | null): boolean[] {
  const x = c ?? emptyCheckIn;
  return [
    has(x.steps) || has(x.activeMinutes) || x.exercised !== null,
    has(x.sleepMinutes) || has(x.sleepQuality) || has(x.sleepSchedule),
    has(x.mealBalance) || has(x.waterLiters) || has(x.mealConsistency),
    has(x.recoveryFeeling) || has(x.breakFrequency) || has(x.activityLoad),
    has(x.energy) || has(x.stress) || x.moodTags.length > 0,
  ];
}

export type DimKey = "move" | "sleep" | "fuel" | "recover";

/** Deterministic daily insight; never over-interprets thin data. */
export function dailyInsight(
  s: DayScores,
  coverage: CoverageLevel,
): { dim: DimKey | null; headline: string; body: string } {
  const dims: { key: DimKey; label: string; v: number | null; headline: string }[] = [
    { key: "move", label: "Movement", v: s.movement, headline: "Small moves add up" },
    { key: "sleep", label: "Sleep", v: s.sleep, headline: "Recovery starts with rest" },
    { key: "fuel", label: "Fuel", v: s.fuel, headline: "Fuel your day" },
    { key: "recover", label: "Recovery", v: s.recovery, headline: "Make room to recharge" },
  ];
  const avail = dims.filter((d): d is typeof d & { v: number } => d.v !== null);
  if (coverage === "limited" || avail.length < 2) {
    return {
      dim: null,
      headline: "Add more to your view",
      body: "Complete today's check-in to get a clearer picture.",
    };
  }
  const low = avail.reduce((a, b) => (b.v < a.v ? b : a));
  const high = avail.reduce((a, b) => (b.v > a.v ? b : a));
  if (high.v - low.v <= 5)
    return {
      dim: null,
      headline: "Nicely balanced",
      body: "Your available dimensions are within a few points of each other today.",
    };
  return {
    dim: low.key,
    headline: low.headline,
    body: `${low.label} is currently your lowest VIEW dimension.`,
  };
}

export interface SuggestedMission {
  title: string;
  description: string;
  category: Mission["category"];
}

/** Deterministic mission suggestion from today's answers. Never awards XP by itself. */
export function suggestMission(c: CheckInInput | null, s: DayScores): SuggestedMission | null {
  if (!c) return null;
  if (s.movement !== null && s.movement < 50)
    return {
      title: "Take a 10-minute walk",
      description: "A short walk adds everyday movement to your day.",
      category: "move",
    };
  if (c.breakFrequency === 1)
    return {
      title: "Take 3 movement breaks",
      description: "Stand up and move for a minute, three times today.",
      category: "move",
    };
  if (c.sleepSchedule === 1)
    return {
      title: "Start a wind-down routine",
      description: "Dim screens and lights 20 minutes before your usual bedtime.",
      category: "recover",
    };
  if (c.mealConsistency === 1)
    return {
      title: "Plan your next balanced meal",
      description: "Decide now what and when your next balanced meal will be.",
      category: "fuel",
    };
  return null;
}

export function formatSleep(min: number | null): string {
  if (!has(min)) return "—";
  return `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, "0")}m`;
}

export const QUALITY = ["Poor", "Fair", "Good", "Great"];
export const SCHEDULE = ["No", "Somewhat", "Yes"];
export const BALANCE = ["Low", "Okay", "Good", "Great"];
export const MEALTIMES = ["Irregular", "Mostly regular", "Regular"];
export const BREAKS = ["Rarely", "Sometimes", "Regularly"];
export const LOAD = ["Rest day", "Light activity", "Moderate activity", "Hard training day"];
