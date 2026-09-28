import type { CheckInInput } from "@/lib/wellness/checkin";
import type { Meal } from "@/lib/fuel/model";
export function nextMove(input: CheckInInput | null, meals: Meal[] = []) {
  const rest =
    (input?.energy !== null && input?.energy !== undefined && input.energy <= 2) ||
    (input?.recoveryFeeling !== null &&
      input?.recoveryFeeling !== undefined &&
      input.recoveryFeeling <= 2);
  const movement =
    !rest && input?.steps !== null && input?.steps !== undefined && input.steps < 5000;
  const action = rest
    ? {
        title: "Make room for a lighter day",
        description: "Choose a comfortable break or a quiet wind-down.",
        category: "recover" as const,
      }
    : movement
      ? {
          title: "Take a comfortable movement break",
          description: "Try a short walk or gentle movement when it suits you.",
          category: "move" as const,
        }
      : {
          title: "Plan your next balanced meal",
          description: "Choose a protein source, a carbohydrate and fruit or vegetables.",
          category: "fuel" as const,
        };
  const last = meals[0];
  const meal =
    last && !last.components.includes("color")
      ? "For your next meal, consider adding vegetables or fruit alongside a protein source and a carbohydrate."
      : "A flexible next-meal idea: rice or bread, beans or another protein, and vegetables. Choose portions around hunger, preferences and your usual needs.";
  return {
    action,
    meal,
    agent: rest ? "Recovery" : movement ? "Movement" : "Nutrition",
    reason: !input
      ? "No check-in yet: this is general guidance."
      : rest
        ? "You reported lower energy or recovery, so the plan prioritizes rest."
        : movement
          ? `You reported ${input.steps!.toLocaleString()} steps today, so a manageable movement option comes first.`
          : "Your available check-in supports a general meal-planning suggestion.",
    learn: rest ? "003" : movement ? "002" : "001",
    active: !!input && ((input.activeMinutes ?? 0) >= 60 || (input.steps ?? 0) >= 10000),
  };
}
export function weeklyReflection(
  rows: { date: string; steps: number | null; sleep_minutes: number | null }[],
  day: string,
) {
  const end = Date.parse(day + "T12:00:00Z");
  const recent = rows.filter((r) => {
    const delta = end - Date.parse(r.date + "T12:00:00Z");
    return delta >= 0 && delta < 7 * 86400000;
  });
  const unique = [...new Map(recent.map((r) => [r.date, r])).values()];
  const steps = unique.map((r) => r.steps).filter((v): v is number => v !== null);
  const sleep = unique.map((r) => r.sleep_minutes).filter((v): v is number => v !== null);
  return {
    days: unique.length,
    missing: 7 - unique.length,
    stepsDays: steps.length,
    sleepDays: sleep.length,
    averageSteps: steps.length ? Math.round(steps.reduce((a, b) => a + b, 0) / steps.length) : null,
    sleepRange:
      sleep.length >= 2
        ? `${(Math.min(...sleep) / 60).toFixed(1)}–${(Math.max(...sleep) / 60).toFixed(1)} hours`
        : null,
  };
}
export function characterMilestones(cases: number, sessions: number, badges: number) {
  return [
    {
      name: "Curious Explorer",
      unlocked: cases >= 1,
      requirement: "Complete your first Lab case",
      color: "#00D9E8",
    },
    {
      name: "Movement Starter",
      unlocked: sessions >= 1,
      requirement: "Complete a Pose session",
      color: "#FF007A",
    },
    {
      name: "Perspective Master",
      unlocked: cases >= 3,
      requirement: "Complete all three Lab cases",
      color: "#7B2CBF",
    },
    {
      name: "Habit Collector",
      unlocked: badges >= 3,
      requirement: "Earn three badges",
      color: "#00C853",
    },
  ];
}
