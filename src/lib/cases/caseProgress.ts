import type { CaseSession, CaseStage, HealthCase } from "@/types/cases";

export const newSession = (): CaseSession => ({
  stage: "briefing",
  discovered: [],
  clues: [],
  hintUsed: false,
  hypothesisId: null,
  hypothesisSkipped: false,
  theory: "",
  plan: [],
  connections: [],
  impression: null,
});

export const connKey = (a: string, b: string) => [a, b].sort().join("|");

/** Count of connections that match the case's accepted pairs. */
export function validConnections(c: HealthCase, s: CaseSession): number {
  if (!c.connections) return 0;
  const ok = new Set(c.connections.valid.map(([a, b]) => connKey(a, b)));
  return s.connections.filter((k) => ok.has(k)).length;
}

export type CaseAction =
  | { type: "discover"; id: string }
  | { type: "toggleClue"; id: string }
  | { type: "useHint" }
  | { type: "chooseHypothesis"; id: string }
  | { type: "setTheory"; text: string }
  | { type: "skipHypothesis" }
  | { type: "togglePlan"; id: string }
  | { type: "advance" }
  | { type: "back" }
  | { type: "reset" }
  | { type: "connect"; a: string; b: string }
  | { type: "disconnect"; key: string }
  | { type: "setImpression"; value: "yes" | "no" };

const order: CaseStage[] = [
  "briefing",
  "investigation",
  "analysis",
  "plan",
  "simulation",
  "reveal",
  "results",
];

/** Can the player leave the current stage? Keeps the case from skipping ahead. */
export function canAdvance(c: HealthCase, s: CaseSession): boolean {
  switch (s.stage) {
    case "investigation":
      return (
        (!c.snapshot || s.impression !== null) &&
        s.discovered.length >= c.minEvidenceToAnalyze &&
        s.clues.length > 0
      );
    case "analysis":
      if (c.connections && validConnections(c, s) < c.connections.required) return false;
      if (c.theoryFirst && (!s.theory.trim() || !s.hypothesisId)) return false;
      return s.hypothesisId !== null || s.hypothesisSkipped;
    case "plan":
      return s.plan.length > 0;
    default:
      return true;
  }
}

const toggle = (arr: string[], id: string) =>
  arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];

export function caseReducer(c: HealthCase, s: CaseSession, a: CaseAction): CaseSession {
  switch (a.type) {
    case "discover":
      return s.discovered.includes(a.id) ? s : { ...s, discovered: [...s.discovered, a.id] };
    case "toggleClue":
      if (s.stage !== "investigation" && s.stage !== "analysis") return s;
      return { ...s, clues: toggle(s.clues, a.id) };
    case "useHint":
      return { ...s, hintUsed: true };
    case "chooseHypothesis":
      return { ...s, hypothesisId: a.id, hypothesisSkipped: false };
    case "setTheory":
      return { ...s, theory: a.text.slice(0, 160) };
    case "skipHypothesis":
      if (c.theoryFirst) return s;
      return { ...s, hypothesisId: null, hypothesisSkipped: true, stage: "plan" };
    case "togglePlan": {
      if (s.stage !== "plan") return s;
      if (!s.plan.includes(a.id) && s.plan.length >= c.maxInterventions) return s;
      return { ...s, plan: toggle(s.plan, a.id) };
    }
    case "advance": {
      if (!canAdvance(c, s)) return s;
      const i = order.indexOf(s.stage);
      return { ...s, stage: order[Math.min(i + 1, order.length - 1)]! };
    }
    case "back": {
      const i = order.indexOf(s.stage);
      // Never step back out of simulation/reveal/results — choices are locked in.
      if (i <= 0 || i >= order.indexOf("simulation")) return s;
      return { ...s, stage: order[i - 1]! };
    }
    case "reset":
      return newSession();
    case "setImpression":
      return { ...s, impression: a.value };
    case "connect": {
      if (s.stage !== "analysis" || a.a === a.b) return s;
      const k = connKey(a.a, a.b);
      return s.connections.includes(k) ? s : { ...s, connections: [...s.connections, k] };
    }
    case "disconnect":
      return { ...s, connections: s.connections.filter((k) => k !== a.key) };
  }
}
