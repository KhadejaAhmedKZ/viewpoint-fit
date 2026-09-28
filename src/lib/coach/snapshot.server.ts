import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { rowInput } from "@/lib/services/wellnessService";
import { calculateDayScores, calculateDataCoverage } from "@/lib/wellness/checkin";
import { demoMissions } from "@/data/demoMissions";
import { playableCases } from "@/data/cases";
import { getLevelInfo } from "@/lib/xp";
import type { CoachSnapshot } from "./context";
import type { Meal } from "@/lib/fuel/model";
export async function serverSnapshot(
  db: SupabaseClient<Database>,
  uid: string,
  day: string,
): Promise<CoachSnapshot> {
  const results = await Promise.all([
    db
      .from("daily_wellness")
      .select("*")
      .eq("user_id", uid)
      .eq("date", day)
      .eq("is_demo", false)
      .maybeSingle(),
    db.from("user_progress").select("xp,streak").eq("user_id", uid).single(),
    db
      .from("mission_completions")
      .select("mission_id,completed_at,title,description,category")
      .eq("user_id", uid)
      .eq("completion_date", day),
    db.from("case_attempts").select("case_id").eq("user_id", uid).eq("reward_claimed", true),
    db
      .from("meal_logs")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(3),
    db
      .from("pose_sessions")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(3),
  ] as const);
  const [wellness, progress, done, cases, meals, pose] = results;
  if (wellness.error || progress.error || done.error || cases.error || pose.error)
    throw new Error("Account context unavailable");
  const input = wellness.data ? rowInput(wellness.data) : null;
  const missions = demoMissions.map((m) => ({
    ...m,
    completed: !!done.data?.some((d) => d.mission_id === m.id && d.completed_at),
  }));
  const ai = done.data?.find((d) => d.mission_id === "ai-mission");
  if (ai)
    missions.push({
      id: "ai-mission",
      title: ai.title ?? "AI Mission",
      description: ai.description ?? "",
      category: (ai.category ?? "move") as (typeof missions)[number]["category"],
      xp: 40,
      completed: !!ai.completed_at,
    });
  const scores = calculateDayScores(input, missions);
  const level = getLevelInfo(progress.data!.xp);
  return {
    checkIn: input,
    coverage: calculateDataCoverage(input).percent,
    components: scores,
    viewScore: scores.view,
    xp: progress.data!.xp,
    level: level.level,
    levelTitle: level.title,
    streak: progress.data!.streak,
    missions,
    dailyQuestDone: !!done.data?.some((d) => d.mission_id === "pose-daily-quest"),
    solvedCases: (cases.data ?? []).map((c) => playableCases[c.case_id]).filter((c) => !!c),
    skills: [],
    badges: [],
    meals: (meals.data ?? []) as Meal[],
    poseHistory: (pose.data ?? []).map((p) => ({
      id: p.id,
      exercise: p.exercise as "squat" | "curl" | "lunge",
      completedAt: p.created_at,
      reps: p.reps,
      targetReps: p.target_reps,
      durationSeconds: p.duration_seconds,
      formConsistency: p.form_consistency,
      trackingQuality: Number(p.tracking_quality),
    })),
  };
}
