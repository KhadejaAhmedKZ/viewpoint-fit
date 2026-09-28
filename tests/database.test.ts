import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { playableCases } from "../src/data/cases";
import { newSession, connKey } from "../src/lib/cases/caseProgress";
import { scoreCase, xpForScore } from "../src/lib/cases/scoring";
test("database migrations, RLS, atomic rewards and server scoring", async (t) => {
  const db = new PGlite();
  try {
    await db.exec(
      `CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY,raw_user_meta_data jsonb); CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; GRANT USAGE ON SCHEMA auth,public TO authenticated,anon; GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated,anon;`,
    );
    for (const file of [
      "0000_persistent_progress",
      "0001_daily_checkin_inputs",
      "0002_fuel_and_security",
      "0003_food_reports",
    ])
      await db.exec(await readFile(`drizzle/migrations/${file}.sql`, "utf8"));
    const a = "00000000-0000-4000-8000-000000000001",
      b = "00000000-0000-4000-8000-000000000002";
    await db.query("INSERT INTO auth.users VALUES ($1,$3),($2,$3)", [
      a,
      b,
      JSON.stringify({ display_name: "Test Player" }),
    ]);
    const asUser = async (id: string) => {
      await db.exec("RESET ROLE");
      await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [id]);
      await db.exec("SET ROLE authenticated");
    };
    const scalar = async (sql: string, args: unknown[] = []) => {
      const r = await db.query<{ value: number }>(sql, args);
      return r.rows[0]!.value;
    };
    await t.test("registration trigger creates isolated zero-progress profiles", async () => {
      await asUser(a);
      assert.equal(await scalar("SELECT count(*)::int value FROM profiles"), 1);
      assert.equal(await scalar("SELECT xp value FROM user_progress"), 0);
    });
    await t.test("daily rewards and AI rewards can only be claimed once", async () => {
      await asUser(a);
      assert.equal(await scalar("SELECT complete_mission('move-break',current_date) value"), 50);
      assert.equal(await scalar("SELECT complete_mission('move-break',current_date) value"), 0);
      await db.exec("SELECT add_ai_mission('Walk','Take a comfortable walk','move',current_date)");
      assert.equal(await scalar("SELECT complete_ai_mission(current_date) value"), 40);
      assert.equal(await scalar("SELECT complete_ai_mission(current_date) value"), 0);
    });
    await t.test("wellness and meals are isolated and cross-user writes denied", async () => {
      await asUser(a);
      await db.query(
        "INSERT INTO daily_wellness(user_id,date,steps) VALUES($1,current_date,5000)",
        [a],
      );
      await db.exec(
        "INSERT INTO meal_logs(date,meal_type,description,components) VALUES(current_date,'lunch','Lentils and rice',ARRAY['protein','grains'])",
      );
      await asUser(b);
      assert.equal(await scalar("SELECT count(*)::int value FROM daily_wellness"), 0);
      assert.equal(await scalar("SELECT count(*)::int value FROM meal_logs"), 0);
      await assert.rejects(
        db.query("INSERT INTO daily_wellness(user_id,date,steps) VALUES($1,current_date,1)", [a]),
        /row-level security/,
      );
      await assert.rejects(
        db.query(
          "INSERT INTO meal_logs(user_id,date,meal_type,description) VALUES($1,current_date,'lunch','other meal')",
          [a],
        ),
        /row-level security/,
      );
    });
    await t.test("nutrition reports require confirmation and remain private", async () => {
      await asUser(a);
      const report = {
        source: "manual",
        confirmed: true,
        items: [
          {
            name: "Test food",
            grams: 100,
            kcal100Low: 100,
            kcal100High: 120,
            protein100: null,
            carbs100: null,
            fat100: null,
          },
        ],
      };
      await db.query(
        "INSERT INTO meal_logs(date,meal_type,description,nutrition_report) VALUES(current_date,'lunch','Confirmed report',$1)",
        [JSON.stringify(report)],
      );
      await assert.rejects(
        db.query(
          "INSERT INTO meal_logs(date,meal_type,description,nutrition_report) VALUES(current_date,'lunch','Unconfirmed',$1)",
          [JSON.stringify({ ...report, confirmed: false })],
        ),
        /check constraint/,
      );
      await asUser(b);
      assert.equal(
        await scalar(
          "SELECT count(*)::int value FROM meal_logs WHERE nutrition_report IS NOT NULL",
        ),
        0,
      );
    });
    await t.test("chat ownership is enforced for real rows", async () => {
      await asUser(a);
      const result = await db.query<{ id: string }>(
        "INSERT INTO coach_conversations(title) VALUES ('Private test') RETURNING id",
      );
      const id = result.rows[0]!.id;
      await db.query(
        "INSERT INTO coach_messages(conversation_id,role,content) VALUES ($1,'user',$2)",
        [id, JSON.stringify({ text: "Private test message" })],
      );
      await asUser(b);
      assert.equal(await scalar("SELECT count(*)::int value FROM coach_messages"), 0);
      await assert.rejects(
        db.query("INSERT INTO coach_messages(conversation_id,role,content) VALUES ($1,'user',$2)", [
          id,
          JSON.stringify({ text: "Cross-account" }),
        ]),
        /row-level security/,
      );
    });
    for (const c of Object.values(playableCases))
      await t.test(
        `case ${c.id} server score matches client, replay gives zero, skills persist`,
        async () => {
          await asUser(a);
          const s = {
            ...newSession(),
            discovered: c.evidence.map((e) => e.id),
            clues: c.requiredClues.map((g) => (Array.isArray(g) ? g[0]! : g)),
            plan: [...c.interventions]
              .sort((a, b) => b.weight - a.weight)
              .slice(0, c.maxInterventions)
              .map((i) => i.id),
            hypothesisId: c.hypotheses.find((h) => h.best)!.id,
            theory: "The routine patterns interact.",
            connections: c.connections?.valid.map(([a, b]) => connKey(a, b)) ?? [],
          };
          const score = scoreCase(c, s).total;
          assert.equal(
            await scalar("SELECT record_case_completion_v2($1,$2,current_date) value", [
              c.id,
              JSON.stringify(s),
            ]),
            xpForScore(c, score),
          );
          assert.equal(
            await scalar(
              "SELECT score value FROM case_attempts WHERE case_id=$1 ORDER BY created_at LIMIT 1",
              [c.id],
            ),
            score,
          );
          assert.equal(
            await scalar("SELECT record_case_completion_v2($1,$2,current_date) value", [
              c.id,
              JSON.stringify({ ...s, hintUsed: true }),
            ]),
            0,
          );
          assert.equal(
            await scalar(
              "SELECT count(*)::int value FROM user_achievements WHERE achievement_id=$1",
              [c.skillId],
            ),
            1,
          );
          await assert.rejects(
            db.query("SELECT record_case_completion($1,100,99999,$2,$3,false,current_date)", [
              c.id,
              "fake",
              "fake",
            ]),
            /permission denied/,
          );
        },
      );
    await t.test("Pose quest pays only once and users cannot edit XP", async () => {
      await asUser(a);
      const q =
        "SELECT record_pose_session('squat',10,10,40,90,90,null,null,null,current_date) result";
      let r = await db.query<{ result: { xp: number } }>(q);
      assert.equal(r.rows[0]!.result.xp, 100);
      r = await db.query<{ result: { xp: number } }>(q);
      assert.equal(r.rows[0]!.result.xp, 0);
      await assert.rejects(db.exec("UPDATE user_progress SET xp=99999"), /permission denied/);
    });
    await t.test("invalid Pose summaries cannot earn rewards", async () => {
      await asUser(b);
      await assert.rejects(
        db.exec("SELECT record_pose_session('squat',0,10,40,90,90,null,null,null,current_date)"),
        /invalid completed pose/,
      );
      await assert.rejects(
        db.exec("SELECT record_pose_session('curl',10,10,40,90,90,null,null,null,current_date)"),
        /invalid arm/,
      );
      assert.equal(await scalar("SELECT xp value FROM user_progress"), 0);
    });
    await t.test("all private progress remains invisible to the other account", async () => {
      await asUser(b);
      for (const table of [
        "case_attempts",
        "pose_sessions",
        "xp_transactions",
        "user_achievements",
        "coach_messages",
        "coach_conversations",
      ])
        assert.equal(await scalar(`SELECT count(*)::int value FROM ${table}`), 0);
    });
    await t.test("Coach limit is per-user and blocks request 13", async () => {
      await asUser(a);
      for (let i = 0; i < 12; i++)
        assert.equal(
          (await db.query<{ ok: boolean }>("SELECT consume_coach_request() ok")).rows[0]!.ok,
          true,
        );
      assert.equal(
        (await db.query<{ ok: boolean }>("SELECT consume_coach_request() ok")).rows[0]!.ok,
        false,
      );
    });
  } finally {
    await db.close();
  }
});
