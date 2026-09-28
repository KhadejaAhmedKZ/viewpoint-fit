/** VIEW SCORE — non-clinical wellness engagement score (0–100). */
export interface WellnessComponents {
  movement: number | null;
  sleep: number | null;
  recovery: number | null;
  fuel: number | null;
  consistency: number | null;
}

export const VIEW_SCORE_WEIGHTS: Record<keyof WellnessComponents, number> = {
  movement: 0.3,
  sleep: 0.25,
  recovery: 0.2,
  fuel: 0.15,
  consistency: 0.1,
};

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/**
 * Weighted score over AVAILABLE components only. Missing components are skipped
 * and the remaining weights are re-normalized, so missing data never counts as 0.
 * Returns null when no data exists.
 */
export function calculateViewScore(c: WellnessComponents): number | null {
  let sum = 0;
  let weight = 0;
  for (const key of Object.keys(VIEW_SCORE_WEIGHTS) as (keyof WellnessComponents)[]) {
    const v = c[key];
    if (v == null || Number.isNaN(v)) continue;
    sum += clamp(v) * VIEW_SCORE_WEIGHTS[key];
    weight += VIEW_SCORE_WEIGHTS[key];
  }
  return weight === 0 ? null : Math.round(sum / weight);
}

export type CoverageLevel = "high" | "medium" | "limited";

export function calculateDataCoverage(c: WellnessComponents): {
  percent: number;
  level: CoverageLevel;
  label: string;
} {
  const keys = Object.keys(VIEW_SCORE_WEIGHTS) as (keyof WellnessComponents)[];
  const available = keys.filter((k) => c[k] != null).length;
  const percent = Math.round((available / keys.length) * 100);
  const level: CoverageLevel = percent >= 80 ? "high" : percent >= 50 ? "medium" : "limited";
  const label =
    level === "high"
      ? "High data coverage"
      : level === "medium"
        ? "Medium data coverage"
        : "Limited data";
  return { percent, level, label };
}

/** Behavioral labels only — never medical. */
export function getViewScoreStatus(score: number | null): string {
  if (score == null) return "Getting started";
  if (score >= 85) return "Strong consistency";
  if (score >= 70) return "On track";
  if (score >= 50) return "Building momentum";
  return "Getting started";
}

/** Short status for a single dimension card. */
export function getDimensionStatus(score: number): string {
  if (score >= 85) return "Strong";
  if (score >= 75) return "On track";
  if (score >= 50) return "Building";
  return "Getting started";
}
