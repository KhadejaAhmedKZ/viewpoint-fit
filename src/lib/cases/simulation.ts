import type { HealthCase } from "@/types/cases";

export type MetricSnapshot = Record<string, number>;

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/**
 * Deterministic educational simulation. Returns [baseline, week1..weekN].
 * Gains shrink as a metric rises (diminishing factor); setbacks apply fully.
 */
export function simulateCase(c: HealthCase, planIds: string[]): MetricSnapshot[] {
  const { weeks, adherence, difficultyModifier } = c.simulation;
  const plan = c.interventions.filter((i) => planIds.includes(i.id));
  const out: MetricSnapshot[] = [{ ...c.baselineMetrics }];
  for (let w = 0; w < weeks; w++) {
    const prev = out[out.length - 1]!;
    const next: MetricSnapshot = {};
    for (const m of c.metrics) {
      const cur = prev[m.id] ?? 0;
      const effect = plan.reduce((s, i) => s + (i.effects?.[m.id] ?? 0), 0);
      const factor = effect > 0 ? Math.max(0.25, 1 - cur / 120) : 1;
      next[m.id] =
        Math.round(clamp(cur + effect * adherence * difficultyModifier * factor) * 10) / 10;
    }
    out.push(next);
  }
  return out;
}
