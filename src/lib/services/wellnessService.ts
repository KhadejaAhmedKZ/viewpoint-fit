import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { CheckInInput, ExerciseType } from "@/lib/wellness/checkin";
import { calculateDayScores, calculateDataCoverage } from "@/lib/wellness/checkin";
import { checkInSchema } from "@/lib/wellness/validation";
import type { Mission } from "@/types";
export type WellnessRow = Database["public"]["Tables"]["daily_wellness"]["Row"];
export function rowInput(r: WellnessRow): CheckInInput {
  return {
    steps: r.steps,
    activeMinutes: r.active_minutes,
    exercised: r.exercised,
    exerciseMinutes: r.exercise_minutes,
    exerciseType: r.exercise_type as ExerciseType | null,
    sleepMinutes: r.sleep_minutes,
    sleepQuality: r.sleep_quality,
    sleepSchedule: r.sleep_schedule_consistency,
    mealBalance: r.meal_balance,
    waterLiters: r.water_liters === null ? null : Number(r.water_liters),
    mealConsistency: r.meal_consistency,
    recoveryFeeling: r.recovery_feeling,
    breakFrequency: r.break_frequency,
    activityLoad: r.activity_load,
    energy: r.energy_level,
    stress: r.stress_level,
    moodTags: r.mood_tags ?? [],
  };
}
export function wellnessPayload(
  uid: string,
  day: string,
  input: CheckInInput,
  missions: Mission[],
) {
  const c = checkInSchema.parse(input);
  const s = calculateDayScores(c, missions);
  return {
    user_id: uid,
    date: day,
    is_demo: false,
    steps: c.steps,
    active_minutes: c.activeMinutes,
    exercised: c.exercised,
    exercise_minutes: c.exerciseMinutes,
    exercise_type: c.exerciseType,
    sleep_minutes: c.sleepMinutes,
    sleep_quality: c.sleepQuality,
    sleep_schedule_consistency: c.sleepSchedule,
    meal_balance: c.mealBalance,
    water_liters: c.waterLiters,
    meal_consistency: c.mealConsistency,
    recovery_feeling: c.recoveryFeeling,
    break_frequency: c.breakFrequency,
    activity_load: c.activityLoad,
    energy_level: c.energy,
    stress_level: c.stress,
    mood_tags: c.moodTags,
    movement_score: s.movement,
    sleep_score: s.sleep,
    fuel_score: s.fuel,
    recovery_score: s.recovery,
    mission_score: s.consistency,
    view_score: s.view,
    data_coverage: calculateDataCoverage(c, missions.length > 0).percent / 100,
  };
}
export const wellnessService = {
  async syncScores(
    uid: string,
    row: WellnessRow,
    missionScore: number | null,
    viewScore: number | null,
  ) {
    // Compare-and-set protects edits from another tab. Never replace raw answers.
    const { data, error } = await supabase
      .from("daily_wellness")
      .update({ mission_score: missionScore, view_score: viewScore })
      .eq("user_id", uid)
      .eq("id", row.id)
      .eq("updated_at", row.updated_at)
      .select()
      .maybeSingle();
    if (error) throw new Error("Today's mission score could not be synced.");
    return data;
  },
  async history(uid: string) {
    const { data, error } = await supabase
      .from("daily_wellness")
      .select("*")
      .eq("user_id", uid)
      .eq("is_demo", false)
      .order("date", { ascending: false })
      .limit(90);
    if (error) throw new Error("Wellness history could not be loaded. Please retry.");
    return data;
  },
  async save(uid: string, day: string, input: CheckInInput, missions: Mission[]) {
    const { data, error } = await supabase
      .from("daily_wellness")
      .upsert(wellnessPayload(uid, day, input, missions), { onConflict: "user_id,date" })
      .select()
      .single();
    if (error)
      throw new Error(
        "Your check-in could not be saved. Your answers are still here; please retry.",
      );
    return data;
  },
};
