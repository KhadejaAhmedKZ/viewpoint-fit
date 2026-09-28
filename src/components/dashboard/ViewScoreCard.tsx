import { Database, Zap } from "lucide-react";
import { statIcons } from "@/components/vp/icons";
import { Deco, DemoTag, Sticker, toneFill } from "@/components/vp/ui";
import { cn } from "@/lib/utils";
import type { DimensionDetail } from "@/data/demoWellness";

export function ViewScoreCard({
  score,
  status,
  coverage,
  consistency,
  dimensions,
  sample = false,
  details,
}: {
  sample?: boolean;
  details?: React.ReactNode;
  score: number | null;
  status: string;
  coverage: { percent: number; label: string };
  consistency: number;
  dimensions: DimensionDetail[];
}) {
  return (
    <section className="vp-card vp-pop-lg vp-dots relative overflow-hidden bg-yellow p-5 sm:p-7">
      <Deco kind="bolt" className="right-6 top-16 text-pink" />
      <Deco kind="cross" className="bottom-2 right-3 text-ink" />
      <div className="flex items-start justify-between gap-3">
        <Sticker tone="ink" rotate={-4}>
          <Zap className="h-3 w-3 fill-current" /> View Score
        </Sticker>
        {sample ? <DemoTag /> : <span className="vp-label">Self-reported</span>}
      </div>
      <p className="vp-label mt-3 text-ink">Your wellness from every angle</p>
      <div className="mt-2 flex flex-wrap items-end gap-3">
        <span
          key={score}
          className="animate-pop-in text-8xl font-bold leading-[0.8] text-ink sm:text-9xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {score ?? "--"}
        </span>
        <span className="vp-label pb-2 text-ink">/ 100</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="vp-label rounded-md border-2 border-ink bg-ink px-2 py-1 text-yellow">
          {status}
        </span>
        <span className="vp-label inline-flex items-center gap-1 rounded-md border-2 border-ink bg-surface px-2 py-1 text-ink">
          <Database className="h-3 w-3" /> {coverage.label} · {coverage.percent}%
        </span>
      </div>

      <div className="mt-5 grid grid-cols-5 gap-1.5 sm:gap-2">
        {dimensions.map((d) => {
          const Icon = statIcons[d.key];
          return (
            <Mini
              key={d.key}
              icon={<Icon className="h-4 w-4" />}
              tone={toneFill[d.tone]}
              value={d.score}
              label={d.label}
            />
          );
        })}
        <Mini
          icon={<Zap className="h-4 w-4" />}
          tone={toneFill.yellow}
          value={consistency}
          label="Missions"
        />
      </div>
      {details}
      <p className="mt-3 text-xs text-ink/70">
        Non-clinical wellness engagement score — not a medical assessment. Weights: Move 30%, Sleep
        25%, Recover 20%, Fuel 15%, Mission consistency 10%.
      </p>
    </section>
  );
}

function Mini({
  icon,
  tone,
  value,
  label,
}: {
  icon: React.ReactNode;
  tone: string;
  value: number | null;
  label: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border-[3px] border-ink bg-surface p-1.5 text-center">
      <span
        className={cn(
          "mx-auto grid h-7 w-7 place-items-center rounded-lg border-2 border-ink",
          tone,
        )}
      >
        {icon}
      </span>
      <p
        className="mt-1 text-base font-bold leading-none text-ink"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value ?? "—"}
      </p>
      <p className="vp-label truncate text-[0.5rem] text-muted-foreground">{label}</p>
    </div>
  );
}
