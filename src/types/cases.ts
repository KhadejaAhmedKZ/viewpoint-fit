/** Health Detective case engine types. Every case is fictional, educational data. */
import type { Difficulty } from "./index";

export type CaseDifficulty = Difficulty;

export type CaseStage =
  "briefing" | "investigation" | "analysis" | "plan" | "simulation" | "reveal" | "results";

export const CASE_STAGES: { id: CaseStage; label: string }[] = [
  { id: "briefing", label: "Brief" },
  { id: "investigation", label: "Investigate" },
  { id: "analysis", label: "Analyze" },
  { id: "plan", label: "Plan" },
  { id: "simulation", label: "Simulate" },
  { id: "reveal", label: "Reveal" },
  { id: "results", label: "Results" },
];

export interface CaseEvidence {
  id: string;
  category: string;
  title: string;
  value?: string;
  /** Short label used on the clue board, e.g. "5H20 SLEEP". */
  pinLabel: string;
  description: string;
  important: boolean;
  distractor?: boolean;
  /** Hidden until this many evidence cards have been inspected (Medium+ mechanic). */
  unlockAfter?: number;
  /** Renders the case's weekly timeline instead of a plain value. */
  isTimeline?: boolean;
  /** Own timeline data (overrides the case timeline). */
  timelineDays?: TimelineDay[];
  /** Short line under a timeline, e.g. average + range. */
  summary?: string;
  /** Evidence file this card belongs to — announced as "New file unlocked". */
  file?: string;
  /** Small label such as "Self-reported wellness note". */
  note?: string;
  /** Shown only after the reveal. */
  classification?: "pattern" | "context" | "strength" | "distractor";
}

export const CLASSIFICATION_LABEL = {
  pattern: "Pattern to notice",
  context: "Context to connect",
  strength: "Current strength",
  distractor: "Distractor / not central",
} as const;

export interface SystemNode {
  id: string;
  label: string;
  system: "work" | "sleep" | "training" | "recovery" | "routine";
}

/** Hard-mode System Connection Board. */
export interface CaseConnections {
  nodes: SystemNode[];
  /** Accepted pairs (order-free). */
  valid: [string, string][];
  /** Valid connections needed before the hypothesis unlocks. */
  required: number;
  /** Valid connections for full connection credit. */
  target: number;
}

export interface TimelineDay {
  day: string;
  value: string;
  /** 0–100 bar height, conceptual only. */
  level: number;
}

/** A required clue is satisfied by any id in its group. */
export type ClueGroup = string | string[];

export const DIFFICULTY_LABEL: Record<CaseDifficulty, string> = {
  easy: "Guided Investigation",
  medium: "Pattern Investigation",
  hard: "Systems Investigation",
};

export interface CaseIntervention {
  id: string;
  title: string;
  description: string;
  weight: number;
  effects?: Record<string, number>;
}

export interface CaseHypothesis {
  id: string;
  text: string;
  best: boolean;
  feedback: string;
}

export interface CaseMetric {
  id: string;
  label: string;
}

export interface CaseRewardTier {
  minScore: number;
  xp: number;
}

export interface HealthCase {
  id: string;
  caseNumber: number;
  title: string;
  difficulty: CaseDifficulty;
  themes: string[];
  character: { name: string; age: number; story: string[]; question: string };
  mission: string;
  evidence: CaseEvidence[];
  requiredClues: ClueGroup[];
  /** Penalty per distractor pinned in clue accuracy (default 0.5). */
  distractorPenalty?: number;
  supportingClues: string[];
  distractors: string[];
  /** Evidence cards to inspect before analysis unlocks. */
  minEvidenceToAnalyze: number;
  hint: string;
  hypotheses: CaseHypothesis[];
  interventions: CaseIntervention[];
  maxInterventions: number;
  metrics: CaseMetric[];
  baselineMetrics: Record<string, number>;
  simulation: { weeks: number; adherence: number; difficultyModifier: number };
  timeline?: { title: string; days: TimelineDay[] };
  /** Optional conceptual before/plan weekly distribution shown during simulation. */
  weeklyDistribution?: { before: TimelineDay[]; plan: TimelineDay[] };
  /** Opening "Wellness snapshot" + unscored First Impression question. */
  snapshot?: { label: string; value: string; note?: string }[];
  connections?: CaseConnections;
  /** Typed theory must be written before the choices appear; no skipping. */
  theoryFirst?: { prompt: string; placeholder: string };
  startLabel?: string;
  /** Conceptual system map shown during simulation. */
  systemMap?: {
    before: string[][];
    plan: { requires: string[]; chain: string[] }[];
  };
  reveal: {
    headline: string;
    explanation: string[];
    lessonTitle?: string;
    lesson: string;
    /** Aligned with requiredClues. */
    found: string[];
    supporting: string[];
    supportingTitle?: string;
    notMain?: string[];
    strengths?: string[];
  };
  lesson: string;
  maxXP: number;
  rewardTiers: CaseRewardTier[];
  badgeId: string;
  skillId: string;
}

/** Temporary, resettable play-through state for one case. */
export interface CaseSession {
  stage: CaseStage;
  discovered: string[];
  clues: string[];
  hintUsed: boolean;
  hypothesisId: string | null;
  hypothesisSkipped: boolean;
  theory: string;
  plan: string[];
  /** System connections, "a|b" keys sorted. */
  connections: string[];
  impression: "yes" | "no" | null;
}
