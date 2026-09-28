import test from "node:test";
import assert from "node:assert/strict";
import { calculateViewScore } from "../src/lib/wellnessScore";
import {
  emptyCheckIn,
  calculateDayScores,
  calculateMovementScore,
  calculateDataCoverage,
  calculateMissionConsistency,
  sectionsDone,
} from "../src/lib/wellness/checkin";
import { checkInSchema } from "../src/lib/wellness/validation";
import { playableCases } from "../src/data/cases";
import { newSession, caseReducer, canAdvance, connKey } from "../src/lib/cases/caseProgress";
import { scoreCase, xpForScore } from "../src/lib/cases/scoring";
import { newDetState, stepRange } from "../src/lib/pose/detector";
import { exercises } from "../src/lib/pose/exercises";
import { classifySafety } from "../src/lib/coach/safety";
import { buildCoachContext, type CoachSnapshot } from "../src/lib/coach/context";
import type { Mission } from "../src/types";
const missions: Mission[] = [
  { id: "m1", title: "Move", description: "", category: "move", xp: 40, completed: true },
];
const full = {
  ...emptyCheckIn,
  steps: 8000,
  activeMinutes: 40,
  exercised: false,
  sleepMinutes: 450,
  sleepQuality: 3,
  sleepSchedule: 3,
  mealBalance: 3,
  waterLiters: 2,
  mealConsistency: 3,
  recoveryFeeling: 4,
  breakFrequency: 3,
  activityLoad: 2,
  energy: 4,
  stress: 2,
};
test("VIEW uses the specified weights; missing dimensions renormalize", () => {
  assert.equal(
    calculateViewScore({ movement: 100, sleep: 80, recovery: 60, fuel: 40, consistency: 20 }),
    70,
  );
  assert.equal(
    calculateViewScore({ movement: 100, sleep: 0, recovery: null, fuel: null, consistency: null }),
    55,
  );
  assert.equal(calculateDayScores(null, missions).view, null);
  const partial = calculateDayScores({ ...emptyCheckIn, steps: 5000, sleepMinutes: 450 }, []);
  assert.equal(partial.fuel, null);
  assert.equal(partial.recovery, null);
  assert.equal(partial.view, 73);
  assert.equal(
    calculateDataCoverage({ ...emptyCheckIn, steps: 5000, sleepMinutes: 450 }, false).level,
    "limited",
  );
});
test("full check-in yields four bounded dimensions and actual mission consistency", () => {
  const s = calculateDayScores(full, missions);
  for (const value of Object.values(s)) assert.ok(value !== null && value >= 0 && value <= 100);
  assert.equal(sectionsDone(full).filter(Boolean).length, 5);
  assert.equal(calculateDataCoverage(full).level, "high");
  assert.equal(calculateMissionConsistency([{ ...missions[0]!, completed: false }]), 0);
  assert.equal(calculateMissionConsistency([]), null);
  assert.equal(
    calculateMovementScore({ ...emptyCheckIn, activeMinutes: 60, exercised: false }),
    100,
  );
});
test("zero is a real answer; blanks remain unknown", () => {
  assert.equal(calculateMovementScore({ ...emptyCheckIn, steps: 0 }), 0);
  assert.equal(calculateMovementScore(emptyCheckIn), null);
  assert.equal(sectionsDone({ ...emptyCheckIn, steps: 0 })[0], true);
});
test("reject invalid, infinite, fractional and out-of-range check-in values", () => {
  for (const steps of [-1, 100001, NaN, Infinity, 1.5])
    assert.equal(checkInSchema.safeParse({ ...full, steps }).success, false);
  for (const patch of [
    { sleepMinutes: 1441 },
    { activeMinutes: 601 },
    { waterLiters: 10.1 },
    { energy: 0 },
    { stress: 6 },
    { moodTags: ["calm", "good", "tired"] },
  ])
    assert.equal(checkInSchema.safeParse({ ...full, ...patch }).success, false);
  assert.equal(checkInSchema.safeParse({ ...emptyCheckIn }).success, true);
  assert.equal(
    checkInSchema.parse({ ...full, exercised: false, exerciseMinutes: 30 }).exerciseMinutes,
    null,
  );
});
for (const c of Object.values(playableCases))
  test(`Lab ${c.id}: strong run, gates, plan limit, hint, and replay reset`, () => {
    let s = newSession();
    s = caseReducer(c, s, { type: "advance" });
    assert.equal(canAdvance(c, s), false);
    for (const e of c.evidence) s = caseReducer(c, s, { type: "discover", id: e.id });
    for (const group of c.requiredClues)
      s = caseReducer(c, s, { type: "toggleClue", id: Array.isArray(group) ? group[0]! : group });
    s = caseReducer(c, s, { type: "setImpression", value: "no" });
    s = caseReducer(c, s, { type: "advance" });
    assert.equal(s.stage, "analysis");
    if (c.connections) {
      assert.equal(canAdvance(c, s), false);
      s = { ...s, connections: c.connections.valid.map(([a, b]) => connKey(a, b)) };
    }
    s = caseReducer(c, s, { type: "setTheory", text: "These routine patterns interact." });
    s = caseReducer(c, s, { type: "chooseHypothesis", id: c.hypotheses.find((h) => h.best)!.id });
    s = caseReducer(c, s, { type: "advance" });
    assert.equal(s.stage, "plan");
    for (const i of [...c.interventions].sort((a, b) => b.weight - a.weight))
      s = caseReducer(c, s, { type: "togglePlan", id: i.id });
    assert.equal(s.plan.length, c.maxInterventions);
    const score = scoreCase(c, s);
    assert.ok(score.total >= 90);
    assert.ok(xpForScore(c, score.total) > 0);
    const hinted = scoreCase(c, { ...s, hintUsed: true });
    assert.equal(hinted.reasoning, 60);
    s = caseReducer(c, s, { type: "advance" });
    assert.equal(s.stage, "simulation");
    assert.equal(caseReducer(c, s, { type: "back" }).stage, "simulation");
    assert.deepEqual(caseReducer(c, s, { type: "reset" }), newSession());
  });
test("rep detector rejects speed, partial and lost tracking; valid cycle counts once", () => {
  const cfg = {
    high: 160,
    low: 90,
    partial: 130,
    alpha: 1,
    minRepDurationMs: 600,
    returnHintMs: 2000,
    topLabel: "UP",
    bottomLabel: "DOWN",
  };
  const run = (frames: [number | null, number][]) =>
    frames.reduce((d, [a, t]) => stepRange(d, a, t, cfg).d, newDetState());
  assert.equal(
    run([
      [175, 0],
      [80, 100],
      [175, 900],
      [175, 1000],
    ]).reps,
    1,
  );
  assert.equal(
    run([
      [175, 0],
      [80, 100],
      [175, 200],
    ]).reps,
    0,
  );
  assert.equal(
    run([
      [175, 0],
      [120, 100],
      [175, 900],
    ]).reps,
    0,
  );
  assert.equal(
    run([
      [175, 0],
      [80, 100],
      [null, 600],
      [175, 900],
    ]).reps,
    0,
  );
});
test("all three exercises reject absent landmarks", () => {
  for (const e of Object.values(exercises)) {
    assert.equal(e.read(undefined, "left").input, null);
    assert.equal(e.step(newDetState(), null, 0).d.reps, 0);
  }
});
test("Coach safety routes urgent, diagnostic and medication requests before model", () => {
  assert.equal(classifySafety("I have chest pain").category, "urgent");
  assert.equal(classifySafety("Do I have diabetes?").category, "diagnosis");
  assert.equal(classifySafety("Should I stop my medication?").category, "medication");
  assert.equal(classifySafety("Explain my sleep score").category, null);
});
test("Coach gets actual check-in values with limited specialist context", () => {
  const scores = calculateDayScores(full, missions);
  const s: CoachSnapshot = {
    components: scores,
    viewScore: scores.view,
    checkIn: full,
    coverage: 100,
    level: 1,
    levelTitle: "",
    xp: 0,
    streak: 0,
    missions,
    dailyQuestDone: false,
    poseHistory: [],
    solvedCases: [],
    skills: [],
    badges: [],
  };
  const ctx = buildCoachContext(s, "recovery", "recovery", null);
  assert.equal((ctx["checkIn"] as Record<string, unknown>)["sleepMinutes"], 450);
  assert.equal((ctx["checkIn"] as Record<string, unknown>)["waterLiters"], undefined);
});
