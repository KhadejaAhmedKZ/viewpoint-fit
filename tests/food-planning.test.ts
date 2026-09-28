import test from "node:test";
import assert from "node:assert/strict";
import { foodTotals, foodItemSchema, foodAnalysisSchema } from "../src/lib/fuel/photo-model";
import { analyzeFoodPhoto } from "../src/lib/fuel/photo.server";
import { nextMove, weeklyReflection, characterMilestones } from "../src/lib/planning/nextMove";
import { emptyCheckIn } from "../src/lib/wellness/checkin";
const item = {
  name: "Test food",
  grams: 150,
  kcal100Low: 100,
  kcal100High: 120,
  protein100: 10,
  carbs100: null,
  fat100: 2,
};
test("calories scale with confirmed grams; unknown macros stay unknown", () => {
  assert.deepEqual(foodTotals([item]), {
    kcalLow: 150,
    kcalHigh: 180,
    protein: 15,
    carbs: null,
    fat: 3,
  });
  assert.equal(foodTotals([{ ...item, grams: 300 }]).kcalLow, 300);
  assert.equal(foodItemSchema.safeParse({ ...item, grams: 0 }).success, false);
  assert.equal(foodItemSchema.safeParse({ ...item, kcal100High: 90 }).success, false);
});
test("photo analysis rejects invalid certainty and permits unidentified food", () => {
  assert.equal(
    foodAnalysisSchema.safeParse({ items: [item], notes: [], confidence: "high" }).success,
    false,
  );
  assert.equal(
    foodAnalysisSchema.safeParse({ items: [], notes: ["No visible food"], confidence: "low" })
      .success,
    true,
  );
});
test("photo gateway validates output, sets no-store, and keeps the key out of the body", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (_url, options) => {
      const body = JSON.parse(String(options?.body));
      assert.equal(body.store, false);
      assert.equal(String(options?.body).includes("test-secret"), false);
      return new Response(
        JSON.stringify({
          output: [
            {
              content: [
                {
                  type: "output_text",
                  text: JSON.stringify({
                    items: [item],
                    notes: ["Portion uncertain"],
                    confidence: "low",
                  }),
                },
              ],
            },
          ],
        }),
      );
    };
    assert.equal(
      (await analyzeFoodPhoto("synthetic-test-image", "test-secret")).items[0]?.grams,
      150,
    );
    globalThis.fetch = async () => new Response(JSON.stringify({ output_text: "not json" }));
    await assert.rejects(analyzeFoodPhoto("synthetic-test-image", "test-secret"));
    globalThis.fetch = async () => new Response("", { status: 503 });
    await assert.rejects(analyzeFoodPhoto("synthetic-test-image", "test-secret"));
  } finally {
    globalThis.fetch = original;
  }
});
test("weekly reflection ignores future/stale/duplicate dates and missing values", () => {
  const r = weeklyReflection(
    [
      { date: "2026-09-27", steps: 1000, sleep_minutes: 420 },
      { date: "2026-09-27", steps: 1000, sleep_minutes: 420 },
      { date: "2026-09-26", steps: null, sleep_minutes: 360 },
      { date: "2026-09-28", steps: 9999, sleep_minutes: 500 },
      { date: "2026-09-01", steps: 9999, sleep_minutes: 500 },
    ],
    "2026-09-27",
  );
  assert.equal(r.days, 2);
  assert.equal(r.averageSteps, 1000);
  assert.equal(r.missing, 5);
  assert.equal(r.sleepRange, "6.0–7.0 hours");
});
test("next-move favors recovery over extra exercise and never creates calorie budgets", () => {
  assert.equal(nextMove({ ...emptyCheckIn, steps: 1000, energy: 1 }).agent, "Recovery");
  assert.equal(nextMove({ ...emptyCheckIn, steps: 1000, energy: 4 }).agent, "Movement");
  assert.match(nextMove(null).reason, /No check-in/);
  assert.equal("calorieTarget" in nextMove(emptyCheckIn), false);
});
test("character titles depend on permanent achievements, not streaks", () => {
  assert.equal(
    characterMilestones(3, 1, 3).every((m) => m.unlocked),
    true,
  );
  assert.equal(
    characterMilestones(0, 0, 0).some((m) => m.unlocked),
    false,
  );
});
