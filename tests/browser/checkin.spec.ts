import { test, expect, type Page } from "@playwright/test";
import { loadEnv } from "vite";
const env = loadEnv("development", process.cwd(), "");
const origin = env["VITE_SUPABASE_URL"]!;
const storageKey = `sb-${new URL(origin).hostname.split(".")[0]}-auth-token`;
const uid = "00000000-0000-4000-8000-000000000001";
async function fixture(page: Page) {
  // Simulated transport only: no real account, remote writes or camera capture.
  let rows: Record<string, unknown>[] = [];
  let writes = 0;
  let failSave = false;
  const user = {
    id: uid,
    aud: "authenticated",
    role: "authenticated",
    email: "prototype@example.test",
    app_metadata: {},
    user_metadata: {},
    created_at: new Date().toISOString(),
  };
  const token = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: uid, exp: 4102444800, role: "authenticated" })).toString("base64url")}.test`;
  await page.addInitScript(
    ({ storageKey, user, token }) => {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          access_token: token,
          refresh_token: "test",
          expires_at: 4102444800,
          token_type: "bearer",
          user,
        }),
      );
    },
    { storageKey, user, token },
  );
  await page.route(`${origin}/**`, async (route) => {
    const url = new URL(route.request().url());
    let body: unknown = [];
    if (url.pathname.endsWith("/auth/v1/user")) body = user;
    else if (url.pathname.includes("/daily_wellness")) {
      if (route.request().method() === "POST") {
        if (failSave) return route.fulfill({ status: 503, json: { message: "Simulated failure" } });
        const input = route.request().postDataJSON();
        const prior = rows.find((r) => r["date"] === input.date);
        const row = {
          id: prior?.["id"] ?? "wellness-1",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...input,
        };
        rows = [row, ...rows.filter((r) => r["date"] !== input.date)];
        writes++;
        body = row;
      } else body = rows;
    } else if (url.pathname.endsWith("/profiles"))
      body = { display_name: "Prototype Tester", created_at: new Date().toISOString() };
    else if (url.pathname.endsWith("/user_progress"))
      body = { xp: 0, streak: 0, last_active_date: null };
    await route.fulfill({ json: body });
  });
  return {
    rows: () => rows,
    writes: () => writes,
    fail: (v: boolean) => {
      failSave = v;
    },
  };
}

test("mobile: partial save, refresh, edit, failed save retry, history and routes", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const f = await fixture(page);
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Start 1-min check-in" })).toBeEnabled();
  expect(f.writes()).toBe(0);
  await page.getByRole("button", { name: "Start 1-min check-in" }).click();
  await page.getByLabel("Steps (0–100,000)").fill("5000");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByLabel("Sleep hours", { exact: true }).fill("7");
  await page.getByLabel("Sleep minutes", { exact: true }).fill("30");
  await page.getByRole("button", { name: "Review & save partial" }).click();
  await page.getByRole("button", { name: "Update my view" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  expect(f.rows()).toHaveLength(1);
  expect(f.rows()[0]?.["fuel_score"]).toBeNull();
  expect(f.rows()[0]?.["is_demo"]).toBe(false);
  await page.reload();
  await expect(page.getByRole("button", { name: "Edit check-in" })).toBeEnabled();
  expect(f.writes()).toBe(1);
  await page.getByRole("button", { name: "Edit check-in" }).click();
  await expect(page.getByLabel("Steps (0–100,000)")).toHaveValue("5000");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByLabel("Sleep hours", { exact: true }).fill("6");
  await page.getByRole("button", { name: "Review & save partial" }).click();
  f.fail(true);
  await page.getByRole("button", { name: "Update my view" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("could not be saved");
  expect(f.writes()).toBe(1);
  f.fail(false);
  await page.getByRole("button", { name: "Update my view" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  expect(f.rows()).toHaveLength(1);
  expect(f.rows()[0]?.["sleep_minutes"]).toBe(390);
  for (const path of [
    "/",
    "/progress",
    "/lab",
    "/lab/001",
    "/lab/002",
    "/lab/003",
    "/pose",
    "/coach",
    "/profile",
  ]) {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});

test("full check-in, source labels and desktop layout", async ({ page }) => {
  const f = await fixture(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Start 1-min check-in" }).click();
  await page.getByLabel("Steps (0–100,000)").fill("8000");
  await page.getByLabel("Active minutes (0–600)").fill("40");
  await page.getByRole("button", { name: "No", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByLabel("Sleep hours", { exact: true }).fill("7");
  await page.getByRole("button", { name: "Good", exact: true }).click();
  await page.getByRole("button", { name: "Yes", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Great", exact: true }).click();
  await page.getByLabel("Water in liters (0–10)").fill("2");
  await page.getByRole("button", { name: "Regular", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "4", exact: true }).click();
  await page.getByRole("button", { name: "Regularly", exact: true }).click();
  await page.getByRole("button", { name: "Rest day", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page
    .getByRole("group", { name: "Energy · 1 = very low, 5 = very high" })
    .getByRole("button", { name: "4", exact: true })
    .click();
  await page
    .getByRole("group", { name: "Stress · 1 = very low, 5 = very high" })
    .getByRole("button", { name: "2", exact: true })
    .click();
  await page.getByRole("button", { name: "calm", exact: true }).click();
  await page.getByRole("button", { name: "good", exact: true }).click();
  await expect(page.getByRole("button", { name: "tired", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Review check-in" }).click();
  await page.getByRole("button", { name: "Update my view" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  expect(f.rows()).toHaveLength(1);
  for (const k of ["movement_score", "sleep_score", "fuel_score", "recovery_score", "view_score"])
    expect(f.rows()[0]?.[k]).toEqual(expect.any(Number));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
