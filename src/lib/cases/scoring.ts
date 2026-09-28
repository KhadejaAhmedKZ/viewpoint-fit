import type { CaseSession, ClueGroup, HealthCase } from "@/types/cases";
import { validConnections } from "./caseProgress";

export const groupHit = (g: ClueGroup, selected: string[]) =>
  (Array.isArray(g) ? g : [g]).some((id) => selected.includes(id));

const clamp = (n: number) => Math.max(0, Math.min(100, n));

export function clueAccuracy(c: HealthCase, selected: string[]): number {
  const correct = c.requiredClues.filter((g) => groupHit(g, selected)).length;
  const wrong = selected.filter((id) => c.distractors.includes(id)).length;
  const penalty = c.distractorPenalty ?? 0.5;
  return clamp((100 * (correct - penalty * wrong)) / c.requiredClues.length);
}

/** Hard mode: the 40% clue component blends evidence (60%) with system connections (40%). */
export function connectionAccuracy(c: HealthCase, s: CaseSession): number {
  if (!c.connections) return 0;
  const valid = validConnections(c, s);
  const invalid = s.connections.length - valid;
  return clamp(
    (100 * (Math.min(valid, c.connections.target) - 0.5 * invalid)) / c.connections.target,
  );
}

export function evidenceCompletion(c: HealthCase, discovered: string[]): number {
  return clamp((100 * discovered.length) / c.evidence.length);
}

/** Selected weights vs. the strongest possible valid plan. */
export function interventionQuality(c: HealthCase, plan: string[]): number {
  const best = c.interventions
    .map((i) => i.weight)
    .filter((w) => w > 0)
    .sort((a, b) => b - a)
    .slice(0, c.maxInterventions)
    .reduce((s, w) => s + w, 0);
  const got = c.interventions.filter((i) => plan.includes(i.id)).reduce((s, i) => s + i.weight, 0);
  return best > 0 ? clamp((100 * got) / best) : 0;
}

/**
 * Same for every case. Free text is never graded.
 * Best theory 100 · other theory 80 · skipped 60 · any hint caps at 60.
 */
export function reasoningBonus(c: HealthCase, s: CaseSession): number {
  if (s.hintUsed || s.hypothesisSkipped || !s.hypothesisId) return 60;
  return c.hypotheses.find((h) => h.id === s.hypothesisId)?.best ? 100 : 80;
}

export interface CaseScore {
  total: number;
  clueAccuracy: number;
  interventionQuality: number;
  evidenceCompletion: number;
  reasoning: number;
}

export function scoreCase(c: HealthCase, s: CaseSession): CaseScore {
  const evidenceCa = clueAccuracy(c, s.clues);
  const ca = c.connections ? 0.6 * evidenceCa + 0.4 * connectionAccuracy(c, s) : evidenceCa;
  const iq = interventionQuality(c, s.plan);
  const ec = evidenceCompletion(c, s.discovered);
  const rb = reasoningBonus(c, s);
  return {
    total: Math.round(0.4 * ca + 0.35 * iq + 0.15 * ec + 0.1 * rb),
    clueAccuracy: Math.round(ca),
    interventionQuality: Math.round(iq),
    evidenceCompletion: Math.round(ec),
    reasoning: rb,
  };
}

export function xpForScore(c: HealthCase, score: number): number {
  return c.rewardTiers.find((t) => score >= t.minScore)?.xp ?? 0;
}
