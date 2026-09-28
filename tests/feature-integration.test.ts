import test from "node:test";
import assert from "node:assert/strict";
import { motionPose, avatarPreset } from "../src/lib/characters/config";
import { mealSchema, mealFeedback } from "../src/lib/fuel/model";
import { routeIntent } from "../src/lib/coach/router";
import { classifySafety, safetyNotice } from "../src/lib/coach/safety";
import { callCoach } from "../src/lib/coach/coach.server";

test("all six specialists route independently", () => {
  for (const [question, agent] of [
    ["my squat exercise", "movement"],
    ["my lunch and water", "nutrition"],
    ["my sleep bedtime", "recovery"],
    ["my view score", "wellness"],
    ["why does movement help", "education"],
    ["Khalid case", "case"],
  ])
    assert.equal(routeIntent(question!, null).agent, agent);
});
test("urgent, medication, pain and diagnostic requests leave normal coaching", () => {
  for (const [question, category] of [
    ["chest pain", "urgent"],
    ["stop my medication", "medication"],
    ["my knee hurts", "pain"],
    ["do I have diabetes", "diagnosis"],
  ]) {
    const s = classifySafety(question!);
    assert.equal(s.category, category);
    assert.ok(safetyNotice(s.category, question!));
  }
});
test("3D reduced motion is stable and presets are bounded", () => {
  for (const motion of [
    "idle",
    "greeting",
    "thinking",
    "celebrate",
    "squat",
    "curl",
    "lunge",
  ] as const)
    assert.deepEqual(motionPose(motion, 1, true), motionPose(motion, 100, true));
  assert.notDeepEqual(motionPose("squat", 0), motionPose("squat", 2));
  assert.equal(avatarPreset("unknown"), "yellow");
});
test("meal logging validates categories and gives non-numeric feedback", () => {
  assert.equal(
    mealSchema.safeParse({
      meal_type: "lunch",
      description: "Lentils",
      components: ["protein", "grains"],
    }).success,
    true,
  );
  assert.equal(
    mealSchema.safeParse({ meal_type: "invalid", description: "x", components: [] }).success,
    false,
  );
  assert.equal(
    mealSchema.safeParse({ meal_type: "lunch", description: "a".repeat(301), components: [] })
      .success,
    false,
  );
  assert.ok(mealFeedback(["color", "protein"]).some((t) => t.includes("Protein present")));
});
test("gateway failure and malformed replies produce fallback errors, not fake AI", async () => {
  const original = globalThis.fetch;
  const req = {
    message: "Sleep tips",
    history: [],
    agent: "recovery" as const,
    routeReason: "Sleep question",
    caution: false,
    context: {},
  };
  try {
    globalThis.fetch = async () => new Response("", { status: 503 });
    assert.equal((await callCoach(req, "test-placeholder")).ok, false);
    globalThis.fetch = async () =>
      new Response(
        "data: " +
          JSON.stringify({ type: "response.output_text.delta", delta: '{"title":"bad"}' }) +
          "\n\n",
        { status: 200 },
      );
    assert.equal((await callCoach(req, "test-placeholder")).ok, false);
  } finally {
    globalThis.fetch = original;
  }
});
