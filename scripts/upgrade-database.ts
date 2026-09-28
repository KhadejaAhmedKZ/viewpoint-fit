import { readFile } from "node:fs/promises";
import postgres from "postgres";
const connection = process.env["DATABASE_URL"];
if (!connection) {
  console.error(
    "DATABASE_URL is required in the local environment. Never use a VITE_ variable for it.",
  );
  process.exit(1);
}
const sql = postgres(connection, { max: 1, onnotice: () => {} });
try {
  await sql.begin(async (tx) => {
    const [schema] =
      await tx`select to_regclass('public.daily_wellness') as wellness, to_regclass('public.meal_logs') as meals`;
    if (!schema?.wellness) throw new Error("Base schema is missing. Apply migration 0000 first.");

    const cols =
      await tx`select column_name from information_schema.columns where table_schema='public' and table_name='daily_wellness' and column_name='steps'`;
    if (!cols.length)
      await tx.unsafe(
        await readFile(
          new URL("../drizzle/migrations/0001_daily_checkin_inputs.sql", import.meta.url),
          "utf8",
        ),
      );
    if (!schema.meals)
      await tx.unsafe(
        await readFile(
          new URL("../drizzle/migrations/0002_fuel_and_security.sql", import.meta.url),
          "utf8",
        ),
      );
    const report =
      await tx`select column_name from information_schema.columns where table_schema='public' and table_name='meal_logs' and column_name='nutrition_report'`;
    if (!report.length)
      await tx.unsafe(
        await readFile(
          new URL("../drizzle/migrations/0003_food_reports.sql", import.meta.url),
          "utf8",
        ),
      );
  });
  console.log(
    "Database upgrade committed. Fuel, server Lab scoring, Pose validation and Coach limits are installed.",
  );
} catch {
  console.error(
    "Upgrade not applied. The transaction was rolled back. Verify database access and migration state in your SQL editor. No connection details are logged.",
  );
  process.exitCode = 1;
} finally {
  await sql.end();
}
