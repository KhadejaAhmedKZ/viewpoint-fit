import type { WeeklyDay } from "@/data/demoWellness";

export type WeeklyMetric = "move" | "sleep" | "fuel" | "recovery";

const labels: Record<WeeklyMetric, string> = {
  move: "Movement",
  sleep: "Sleep",
  fuel: "Fuel",
  recovery: "Recovery",
};

export function weeklyAverages(week: WeeklyDay[]): Record<WeeklyMetric, number> {
  const keys: WeeklyMetric[] = ["move", "sleep", "fuel", "recovery"];
  return Object.fromEntries(
    keys.map((k) => [k, Math.round(week.reduce((a, d) => a + d[k], 0) / (week.length || 1))]),
  ) as Record<WeeklyMetric, number>;
}

/** Deterministic weekly insight from highest / lowest averages. No AI. */
export function weeklyInsight(week: WeeklyDay[]) {
  const avg = weeklyAverages(week);
  const sorted = (Object.keys(avg) as WeeklyMetric[]).sort((a, b) => avg[b] - avg[a]);
  const best = sorted[0]!;
  const low = sorted[sorted.length - 1]!;
  return {
    best,
    low,
    avg,
    strongest: `${labels[best]} is your strongest category this week (avg ${avg[best]}).`,
    opportunity: `${labels[low]} has the biggest opportunity for improvement (avg ${avg[low]}).`,
  };
}
