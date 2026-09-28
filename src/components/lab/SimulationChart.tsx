import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { HealthCase } from "@/types/cases";
import type { MetricSnapshot } from "@/lib/cases/simulation";
import type { Tone } from "@/types";
import { toneFill } from "@/components/vp/ui";
import { cn } from "@/lib/utils";

const tones: Tone[] = ["pink", "purple", "cyan", "lime"];

/** Steps baseline → week N with a short "analyzing" beat first. Deterministic data. */
export function SimulationChart({
  c,
  series,
  onDone,
}: {
  c: HealthCase;
  series: MetricSnapshot[];
  onDone: () => void;
}) {
  const [step, setStep] = useState(-1);
  useEffect(() => {
    if (step >= series.length - 1) {
      onDone();
      return;
    }
    const t = setTimeout(() => setStep((s) => s + 1), step < 0 ? 1300 : 800);
    return () => clearTimeout(t);
  }, [step, series.length, onDone]);

  const labels = series.map((_, i) => (i === 0 ? "Baseline" : `Week ${i}`));

  if (step < 0)
    return (
      <div className="vp-card grid min-h-60 place-items-center p-6 text-center">
        <div>
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-pink" />
          <p className="vp-label mt-3 text-ink">Analyzing your strategy…</p>
        </div>
      </div>
    );

  const now = series[step]!;
  const base = series[0]!;
  return (
    <div className="vp-card space-y-4 p-4">
      <div className="flex gap-1.5 overflow-hidden">
        {labels.map((l, i) => (
          <button
            key={l}
            type="button"
            disabled={i > step && step < series.length - 1}
            onClick={() => setStep(i)}
            className={cn(
              "vp-label min-h-9 flex-1 rounded-lg border-2 border-ink px-1 text-[0.6rem]",
              i === step
                ? "bg-yellow text-ink"
                : i < step || step === series.length - 1
                  ? "bg-surface text-ink"
                  : "bg-surface-2 text-muted-foreground",
            )}
          >
            {l}
          </button>
        ))}
      </div>
      {c.metrics.map((m, i) => {
        const v = now[m.id] ?? 0;
        const b = base[m.id] ?? 0;
        const d = Math.round(v - b);
        return (
          <div key={m.id}>
            <div className="flex items-baseline justify-between gap-2">
              <p className="vp-label text-ink">{m.label}</p>
              <p
                className="text-lg font-bold text-ink"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {Math.round(v)}
                <span
                  className={cn(
                    "ml-1 text-xs",
                    d > 0 ? "text-lime" : d < 0 ? "text-pink" : "text-muted-foreground",
                  )}
                >
                  {d > 0 ? `+${d}` : d}
                </span>
              </p>
            </div>
            <div className="relative mt-1 h-5 overflow-hidden rounded-full border-2 border-ink bg-surface">
              <div
                className={cn(
                  "h-full border-r-2 border-ink transition-all duration-700",
                  toneFill[tones[i % 4]!],
                )}
                style={{ width: `${v}%` }}
              />
              <span
                className="absolute top-0 h-full w-0.5 bg-ink"
                style={{ left: `${b}%` }}
                aria-hidden
              />
            </div>
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground">Black marker = baseline. Scale 0–100.</p>
    </div>
  );
}
