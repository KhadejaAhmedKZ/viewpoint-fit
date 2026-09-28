import { supabase } from "@/integrations/supabase/client";
import type { CaseSession } from "@/types/cases";
import type { PoseSession } from "@/lib/pose/exercises";
import type { Mission } from "@/types";

/** Local calendar day (YYYY-MM-DD) — daily missions/streaks follow the player's own date. */
export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function must<T>(r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  if (r.data === null) throw new Error("No data returned");
  return r.data;
}

function ok(r: { error: { message: string } | null }): void {
  if (r.error) throw new Error(r.error.message);
}

export interface LoadedProgress {
  profile: { displayName: string; createdAt: string };
  xp: number;
  streak: number;
  lastActive: string | null;
  completedToday: string[];
  aiMission: Mission | null;
  questDoneToday: boolean;
  caseRewards: Record<string, { score: number; xp: number }>;
  bestScores: Record<string, number>;
  badges: string[];
  skills: string[];
  poseHistory: PoseSession[];
}

/** Loads everything the app needs for one signed-in player. Throws on any failure — never returns a blank account. */
export async function loadProgress(uid: string): Promise<LoadedProgress> {
  const day = today();
  const [profile, progress, completions, attempts, ach, pose] = await Promise.all([
    supabase.from("profiles").select("display_name, created_at").eq("id", uid).single(),
    supabase
      .from("user_progress")
      .select("xp, streak, last_active_date")
      .eq("user_id", uid)
      .single(),
    supabase
      .from("mission_completions")
      .select("mission_id, title, description, category, completed_at")
      .eq("user_id", uid)
      .eq("completion_date", day),
    supabase
      .from("case_attempts")
      .select("case_id, score, xp_awarded, reward_claimed")
      .eq("user_id", uid),
    supabase.from("user_achievements").select("achievement_id, kind").eq("user_id", uid),
    supabase
      .from("pose_sessions")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  const p = must(profile),
    pr = must(progress),
    comps = must(completions),
    atts = must(attempts),
    achs = must(ach),
    poses = must(pose);

  const caseRewards: LoadedProgress["caseRewards"] = {};
  const bestScores: Record<string, number> = {};
  for (const a of atts) {
    if (a.reward_claimed) caseRewards[a.case_id] = { score: a.score, xp: a.xp_awarded };
    bestScores[a.case_id] = Math.max(bestScores[a.case_id] ?? -1, a.score);
  }
  const ai = comps.find((c) => c.mission_id === "ai-mission");
  return {
    profile: { displayName: p.display_name, createdAt: p.created_at },
    xp: pr.xp,
    streak: pr.streak,
    lastActive: pr.last_active_date,
    completedToday: comps
      .filter((c) => c.completed_at && c.mission_id !== "ai-mission")
      .map((c) => c.mission_id),
    questDoneToday: comps.some((c) => c.mission_id === "pose-daily-quest"),
    aiMission: ai
      ? {
          id: "ai-mission",
          title: ai.title ?? "AI Mission",
          description: ai.description ?? "",
          category: (ai.category ?? "move") as Mission["category"],
          xp: 40,
          completed: !!ai.completed_at,
          target: 1,
          progress: ai.completed_at ? 1 : 0,
        }
      : null,
    caseRewards,
    bestScores,
    badges: achs.filter((a) => a.kind === "badge").map((a) => a.achievement_id),
    skills: achs.filter((a) => a.kind === "skill").map((a) => a.achievement_id),
    poseHistory: poses.map((s) => ({
      id: s.id,
      exercise: s.exercise as PoseSession["exercise"],
      completedAt: s.created_at,
      reps: s.reps,
      targetReps: s.target_reps,
      durationSeconds: s.duration_seconds,
      formConsistency: s.form_consistency,
      trackingQuality: Number(s.tracking_quality),
      ...(s.selected_side ? { side: s.selected_side as NonNullable<PoseSession["side"]> } : {}),
      ...(s.left_reps != null ? { leftReps: s.left_reps } : {}),
      ...(s.right_reps != null ? { rightReps: s.right_reps } : {}),
    })),
  };
}

export const missionService = {
  complete: async (missionId: string) =>
    must(await supabase.rpc("complete_mission", { p_mission_id: missionId, p_day: today() })),
  addAi: async (m: { title: string; description: string; category: string }) =>
    must(
      await supabase.rpc("add_ai_mission", {
        p_title: m.title,
        p_description: m.description,
        p_category: m.category,
        p_day: today(),
      }),
    ),
  completeAi: async () => must(await supabase.rpc("complete_ai_mission", { p_day: today() })),
};

export const labService = {
  recordCompletion: async (a: {
    caseId: string;
    score: number;
    xp: number;
    badge: string;
    skill: string;
    hintUsed: boolean;
    session: CaseSession;
  }) =>
    must(
      await supabase.rpc("record_case_completion_v2", {
        p_case_id: a.caseId,
        p_session: a.session as unknown as import("@/integrations/supabase/types").Json,
        p_day: today(),
      }),
    ),
};

export const poseService = {
  record: async (s: PoseSession) =>
    must(
      await supabase.rpc("record_pose_session", {
        p_exercise: s.exercise,
        p_reps: s.reps,
        p_target: s.targetReps,
        p_duration: Math.round(s.durationSeconds),
        p_form: Math.round(s.formConsistency),
        p_tracking: s.trackingQuality,
        p_side: s.side ?? null,
        p_left: s.leftReps ?? null,
        p_right: s.rightReps ?? null,
        p_day: today(),
      } as never),
    ) as { id: string; xp: number; badges: string[] },
};

export const profileService = {
  rename: async (uid: string, name: string) =>
    ok(await supabase.from("profiles").update({ display_name: name }).eq("id", uid)),
};
