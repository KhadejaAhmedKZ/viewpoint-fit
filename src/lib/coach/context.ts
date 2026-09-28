import { nutritionReportSchema, foodTotals } from "@/lib/fuel/photo-model";
import type { Meal } from "@/lib/fuel/model";
import type { CheckInInput } from "@/lib/wellness/checkin";
import type { Mission } from "@/types";
import type { HealthCase } from "@/types/cases";
import type { PoseSession } from "@/lib/pose/exercises";
import { exercises } from "@/lib/pose/exercises";
import type { AgentId } from "./agents";

/** Snapshot of current app state the coach may read. No camera data, ever. */
export interface CoachSnapshot {
  meals?: Meal[];
  checkIn?: CheckInInput | null;
  coverage?: number;
  viewScore: number | null;
  components: {
    movement: number | null;
    sleep: number | null;
    recovery: number | null;
    fuel: number | null;
    consistency: number | null;
  };
  level: number;
  levelTitle: string;
  xp: number;
  streak: number;
  missions: Mission[];
  dailyQuestDone: boolean;
  poseHistory: PoseSession[];
  solvedCases: HealthCase[];
  skills: string[];
  badges: string[];
}

export interface CaseLesson {
  id: string;
  title: string;
  lessonTitle: string;
  lesson: string;
  explanation: string;
}

export function caseLesson(c: HealthCase): CaseLesson {
  return {
    id: c.id,
    title: c.title,
    lessonTitle: c.reveal.lessonTitle ?? c.reveal.headline,
    lesson: c.reveal.lesson,
    explanation: c.reveal.explanation.join(" "),
  };
}

/** Minimum-data context: only the slices the routed agent needs. */
export function buildCoachContext(
  s: CoachSnapshot,
  agent: AgentId,
  contextAgent: AgentId,
  caseId: string | null,
) {
  const need = new Set([agent, contextAgent]);
  const all = need.has("wellness");
  const ctx: Record<string, unknown> = {
    progression: { level: s.level, levelTitle: s.levelTitle, xp: s.xp, streak: s.streak },
    note: "Wellness scores are prototype heuristics from self-reported check-ins. Missing values mean unknown; never invent them. Missions are actual app completions. Not a medical assessment.",
    coverage: s.coverage ?? 0,
  };
  if (all || need.has("nutrition"))
    ctx["meals"] = (s.meals ?? []).slice(0, 3).map((m) => ({
      date: m.date,
      meal: m.meal_type,
      description: m.description,
      components: m.components,
      nutritionEstimate: nutritionReportSchema.safeParse(m.nutrition_report).success
        ? {
            ...foodTotals(m.nutrition_report!.items),
            source: m.nutrition_report!.source,
            note: "User-confirmed estimate, not measured. Never subtract steps or set restrictive calorie targets.",
          }
        : null,
    }));
  const c = s.components;
  if (all || need.has("education")) ctx["wellness"] = { viewScore: s.viewScore, ...c };
  else {
    const w: Record<string, unknown> = { viewScore: s.viewScore };
    if (need.has("movement")) w["movement"] = c.movement;
    if (need.has("recovery")) Object.assign(w, { sleep: c.sleep, recovery: c.recovery });
    if (need.has("nutrition")) w["fuel"] = c.fuel;
    ctx["wellness"] = w;
  }
  if (s.checkIn) {
    const x = s.checkIn;
    ctx["checkIn"] = {
      source: "self-reported",
      ...(all || need.has("movement")
        ? {
            steps: x.steps,
            activeMinutes: x.activeMinutes,
            exercised: x.exercised,
            exerciseMinutes: x.exerciseMinutes,
          }
        : {}),
      ...(all || need.has("recovery")
        ? {
            sleepMinutes: x.sleepMinutes,
            sleepQuality: x.sleepQuality,
            sleepSchedule: x.sleepSchedule,
            recoveryFeeling: x.recoveryFeeling,
            breakFrequency: x.breakFrequency,
            activityLoad: x.activityLoad,
            energy: x.energy,
            stress: x.stress,
          }
        : {}),
      ...(all || need.has("nutrition")
        ? {
            mealBalance: x.mealBalance,
            waterLiters: x.waterLiters,
            mealConsistency: x.mealConsistency,
          }
        : {}),
    };
  }
  if (all || need.has("movement") || need.has("nutrition") || need.has("recovery")) {
    ctx["missions"] = {
      completed: s.missions.filter((m) => m.completed).map((m) => m.title),
      remaining: s.missions.filter((m) => !m.completed).map((m) => m.title),
      dailyQuest: s.dailyQuestDone
        ? "completed (Pose Coach session)"
        : "not yet — complete one Pose Coach session",
    };
  }
  if (all || need.has("movement")) {
    ctx["pose"] = {
      availableExercises: Object.values(exercises).map((e) => e.name),
      completedExercises: [...new Set(s.poseHistory.map((p) => exercises[p.exercise].name))],
      recentSessionSummary: s.poseHistory
        .slice(0, 3)
        .map(
          (p) =>
            `${exercises[p.exercise].name} ${p.reps}/${p.targetReps}, form ${p.formConsistency}`,
        ),
    };
  }
  if (all || need.has("case")) {
    const solved = s.solvedCases.filter((sc) => !caseId || sc.id === caseId);
    ctx["lab"] = {
      completedCases: s.solvedCases.map((sc) => `#${sc.id} ${sc.title}`),
      lessons: need.has("case") ? solved.map(caseLesson) : undefined,
      unlockedSkills: s.skills,
    };
  }
  if (all) ctx["badges"] = s.badges;
  return ctx;
}
