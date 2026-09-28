import { useMemo, useState } from "react";
import { Lightbulb, TrendingUp } from "lucide-react";
import { DemoTag, SectionHeader, toneFill } from "@/components/vp/ui";
import type { WeeklyDay } from "@/data/demoWellness";
import { weeklyInsight } from "@/lib/insights";
import { calculateViewScore } from "@/lib/wellnessScore";
import { cn } from "@/lib/utils";
import type { Tone } from "@/types";

type Metric = "view" | "move" | "sleep" | "fuel" | "recovery";
const tabs: { key: Metric; label: string; tone: Tone }[] = [
  { key: "view", label: "View Score", tone: "yellow" },
  { key: "move", label: "Move", tone: "pink" },
  { key: "sleep", label: "Sleep", tone: "purple" },
  { key: "fuel", label: "Fuel", tone: "lime" },
  { key: "recovery", label: "Recover", tone: "cyan" },
];

export function WeeklyProgress({ week }: { week: WeeklyDay[] }) {
  const [metric, setMetric] = useState<Metric>("view");
  const tone = tabs.find((t) => t.key === metric)!.tone;
  const values = useMemo(
    () =>
      week.map((d) =>
        metric === "view"
          ? (calculateViewScore({
              movement: d.move,
              sleep: d.sleep,
              recovery: d.recovery,
              fuel: d.fuel,
              consistency: d.consistency,
            }) ?? 0)
          : d[metric],
      ),
    [week, metric],
  );
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const best = Math.max(...values);

  return (
    <section>
      <SectionHeader
        kicker="Last 7 days"
        title="Weekly Progress"
        icon={<TrendingUp className="h-4 w-4" />}
        action={<DemoTag />}
      />
      <div className="vp-card vp-pop p-4">
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={metric === t.key}
              onClick={() => setMetric(t.key)}
              className={cn(
                "vp-label shrink-0 rounded-lg border-2 border-ink px-2.5 py-1.5",
                metric === t.key
                  ? cn(toneFill[t.tone], "shadow-[2px_2px_0_0_var(--ink)]")
                  : "bg-surface text-ink",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="vp-grid mt-4 flex h-48 items-end gap-2 rounded-xl border-[3px] border-ink bg-surface-2 p-3">
          {week.map((d, i) => {
            const v = values[i]!;
            return (
              <div
                key={d.day}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
              >
                <span className="vp-label text-[0.6rem] text-ink">{v}</span>
                <div
                  key={metric}
                  className={cn(
                    "animate-pop-in w-full origin-bottom rounded-t-md border-2 border-ink",
                    toneFill[tone],
                    v === best && "shadow-[3px_0_0_0_var(--ink)]",
                  )}
                  style={{ height: `${v}%` }}
                />
                <span className="vp-label text-[0.6rem] text-muted-foreground">{d.day}</span>
              </div>
            );
          })}
        </div>
        <p className="vp-label mt-2 text-muted-foreground">
          Week average: <span className="text-ink">{avg}</span>
        </p>
      </div>
    </section>
  );
}

export function WeeklyInsight({ week }: { week: WeeklyDay[] }) {
  const ins = weeklyInsight(week);
  return (
    <section className="vp-card vp-pop bg-cyan p-4 text-ink">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5" />
        <p className="vp-label">This week</p>
      </div>
      <p className="mt-2 text-lg font-bold">“{ins.strongest}”</p>
      <p className="mt-1 text-sm">{ins.opportunity}</p>
    </section>
  );
}
