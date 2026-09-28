import type { DimensionDetail } from "@/data/demoWellness";
import type { CheckInInput, DayScores } from "./checkin";
import {
  emptyCheckIn,
  formatSleep,
  QUALITY,
  SCHEDULE,
  BALANCE,
  MEALTIMES,
  BREAKS,
  LOAD,
} from "./checkin";
export function dimensionsFor(input: CheckInInput | null, s: DayScores): DimensionDetail[] {
  const c = input ?? emptyCheckIn;
  const val = (n: number | null, suffix = "") => (n === null ? "—" : `${n}${suffix}`);
  const choice = (a: string[], n: number | null) => (n === null ? "—" : (a[n - 1] ?? "—"));
  return [
    {
      key: "move",
      label: "Move",
      score: s.movement,
      tone: "pink",
      insight: "Steps and everyday activity, self-reported.",
      rows: [
        { label: "Steps", value: val(c.steps) },
        { label: "Active minutes", value: val(c.activeMinutes, " min") },
        {
          label: "Exercise",
          value:
            c.exercised === null
              ? "—"
              : c.exercised
                ? val(c.exerciseMinutes, " min")
                : "No formal workout",
        },
      ],
      tip: "Everyday movement counts. Choose a comfortable activity you enjoy.",
    },
    {
      key: "sleep",
      label: "Sleep",
      score: s.sleep,
      tone: "purple",
      insight: "Duration, quality and routine, self-reported.",
      rows: [
        { label: "Duration", value: formatSleep(c.sleepMinutes) },
        { label: "Quality", value: choice(QUALITY, c.sleepQuality) },
        { label: "Usual schedule", value: choice(SCHEDULE, c.sleepSchedule) },
      ],
      tip: "A consistent wind-down routine may support rest.",
    },
    {
      key: "fuel",
      label: "Fuel",
      score: s.fuel,
      tone: "lime",
      insight: "Meal balance, water and regularity, self-reported.",
      rows: [
        { label: "Meal balance", value: choice(BALANCE, c.mealBalance) },
        { label: "Water", value: val(c.waterLiters, " L") },
        { label: "Meals", value: choice(MEALTIMES, c.mealConsistency) },
      ],
      tip: "Water needs differ. This score does not prescribe intake or calories.",
    },
    {
      key: "recover",
      label: "Recover",
      score: s.recovery,
      tone: "cyan",
      insight: "Rest and energy context, self-reported.",
      rows: [
        { label: "Recovery", value: val(c.recoveryFeeling, "/5") },
        { label: "Breaks", value: choice(BREAKS, c.breakFrequency) },
        { label: "Activity", value: choice(LOAD, c.activityLoad) },
        { label: "Energy", value: val(c.energy, "/5") },
        { label: "Stress", value: val(c.stress, "/5") },
      ],
      tip: "Make space for breaks that fit your day. These answers are not a mental-health assessment.",
    },
  ];
}
