import { playableCases } from "../src/data/cases";
import { writeFileSync } from "node:fs";
const rows = Object.values(playableCases).map((c) => ({
  id: c.id,
  rule: {
    evidence: c.evidence.map((e) => e.id),
    groups: c.requiredClues.map((g) => (Array.isArray(g) ? g : [g])),
    distractors: c.distractors,
    penalty: c.distractorPenalty ?? 0.5,
    interventions: c.interventions.map((i) => ({ id: i.id, weight: i.weight })),
    maxPlan: c.maxInterventions,
    minEvidence: c.minEvidenceToAnalyze,
    hypotheses: c.hypotheses.map((h) => ({ id: h.id, best: h.best })),
    connections: c.connections ?? null,
    theoryFirst: !!c.theoryFirst,
    badge: c.badgeId,
    skill: c.skillId,
    tiers: c.rewardTiers,
  },
}));
writeFileSync(
  "/private/tmp/vp-case-rules.sql",
  rows
    .map(
      (r) =>
        `INSERT INTO public.case_rules VALUES ('${r.id}', '${JSON.stringify(r.rule).replaceAll("'", "''")}'::jsonb);`,
    )
    .join("\n"),
);
