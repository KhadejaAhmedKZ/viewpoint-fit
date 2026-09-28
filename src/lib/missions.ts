import type { Mission } from "@/types";

export function todayCompletionRate(missions: Mission[]): number {
  if (missions.length === 0) return 0;
  return Math.round((missions.filter((m) => m.completed).length / missions.length) * 100);
}

/** Mission consistency = average completion rate over the last 7 days (6 past + today). */
export function calculateMissionConsistency(pastRates: number[], missions: Mission[]): number {
  const all = [...pastRates, todayCompletionRate(missions)];
  return Math.round(all.reduce((a, b) => a + b, 0) / all.length);
}

/** Marks a mission complete. Returns the XP earned — 0 if it was already complete. */
export function completeMission(
  missions: Mission[],
  id: string,
): { missions: Mission[]; xpEarned: number } {
  const target = missions.find((m) => m.id === id);
  if (!target || target.completed) return { missions, xpEarned: 0 };
  return {
    missions: missions.map((m) =>
      m.id === id ? { ...m, completed: true, progress: m.target ?? m.progress ?? 0 } : m,
    ),
    xpEarned: target.xp,
  };
}
