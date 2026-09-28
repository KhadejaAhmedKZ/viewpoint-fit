import { cn } from "@/lib/utils";
import { useState } from "react";
import { useWellness } from "@/lib/wellness/wellness-state";
import { rowInput } from "@/lib/services/wellnessService";
import { CheckInSummary, checkButton } from "./DailyCheckIn";
const metrics = [
  ["view_score", "VIEW"],
  ["movement_score", "Move"],
  ["sleep_score", "Sleep"],
  ["fuel_score", "Fuel"],
  ["recovery_score", "Recover"],
] as const;
export function WellnessHistory({ inspect = false }: { inspect?: boolean }) {
  const w = useWellness();
  const [metric, setMetric] = useState<(typeof metrics)[number][0]>("view_score");
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(`${w.day}T12:00:00`);
    date.setDate(date.getDate() - 6 + i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return {
      key,
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      row: w.rows.find((r) => r.date === key),
    };
  });
  const currentScores = {
    view_score: w.scores.view,
    movement_score: w.scores.movement,
    sleep_score: w.scores.sleep,
    fuel_score: w.scores.fuel,
    recovery_score: w.scores.recovery,
  };
  return (
    <section className="vp-card vp-pop bg-surface p-4">
      <h2 className="text-2xl font-bold uppercase">
        {inspect ? "Wellness history" : "Weekly view"}
      </h2>
      <p className="mb-3 text-sm">
        Last 7 days · Check-ins {days.filter((d) => d.row).length}/7 · Self-reported
      </p>
      {w.error && (
        <p role="alert">
          {w.error}{" "}
          <button className={checkButton} onClick={w.reload}>
            Retry
          </button>
        </p>
      )}
      {w.loading && <p role="status">Loading wellness history…</p>}
      <div className="flex flex-wrap gap-2" aria-label="Chart metric">
        {metrics.map(([key, label]) => (
          <button
            key={key}
            className={cn(checkButton, metric === key ? "bg-cyan" : "bg-surface")}
            aria-pressed={metric === key}
            onClick={() => setMetric(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="vp-grid mt-4 grid h-48 grid-cols-7 items-end gap-1 rounded-xl border-2 border-ink bg-surface-2 p-2">
        {days.map((d) => {
          const value =
            d.key === w.day && w.input ? currentScores[metric] : (d.row?.[metric] ?? null);
          return (
            <div
              key={d.key}
              aria-label={`${d.key}: ${value ?? "No data"}`}
              className="flex h-full min-w-0 flex-col items-center justify-end gap-1"
            >
              <span className="text-xs font-bold">{value ?? "—"}</span>
              {value !== null && (
                <div
                  className="w-full rounded-t-md border-2 border-ink bg-yellow"
                  style={{ height: `${Math.max(1, value)}%` }}
                />
              )}
              <span className="text-[10px] uppercase">{d.label}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-sm">
        {days.some((d) => d.row)
          ? `You checked in on ${days.filter((d) => d.row).length} of the last 7 days. Missing days are left blank.`
          : "Your first check-in starts your history. Missing days are not scored as zero."}
      </p>
      {inspect && (
        <div className="mt-4 space-y-3">
          {w.rows.map((row) => (
            <details key={row.id} className="rounded-xl border-2 border-ink p-3">
              <summary className="cursor-pointer font-bold">
                {row.date} · VIEW{" "}
                {row.date === w.day ? (w.scores.view ?? "—") : (row.view_score ?? "—")}
              </summary>
              <p className="my-2 text-xs">
                Move {row.movement_score ?? "—"} · Sleep {row.sleep_score ?? "—"} · Fuel{" "}
                {row.fuel_score ?? "—"} · Recover {row.recovery_score ?? "—"}
              </p>
              <CheckInSummary input={rowInput(row)} />
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
