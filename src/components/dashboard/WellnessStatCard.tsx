import { Link } from "@tanstack/react-router";
import { ChevronDown, Lightbulb } from "lucide-react";
import { statIcons } from "@/components/vp/icons";
import { DemoTag, XPBar, toneFill } from "@/components/vp/ui";
import type { DimensionDetail } from "@/data/demoWellness";
import { getDimensionStatus } from "@/lib/wellnessScore";
import { cn } from "@/lib/utils";

export function WellnessStatCard({
  d,
  open,
  onToggle,
  sample = false,
}: {
  sample?: boolean;
  d: DimensionDetail;
  open: boolean;
  onToggle: () => void;
}) {
  const Icon = statIcons[d.key];
  return (
    <article className={cn("vp-card vp-pop overflow-hidden", open && "col-span-2 lg:col-span-4")}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="block w-full p-4 text-left"
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "grid h-10 w-10 place-items-center rounded-xl border-[3px] border-ink",
              toneFill[d.tone],
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
          <ChevronDown
            className={cn("h-5 w-5 text-ink transition-transform", open && "rotate-180")}
          />
        </div>
        <p className="vp-label mt-3 text-muted-foreground">{d.label}</p>
        <p
          className="text-4xl font-bold leading-none text-ink"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {d.score ?? "—"}
        </p>
        <p className="vp-label mt-1 text-ink">
          {d.score === null ? "No data yet" : getDimensionStatus(d.score)}
        </p>
        <XPBar value={d.score ?? 0} tone={d.tone} size="sm" className="mt-3" />
        <p className="mt-2 text-xs text-muted-foreground">{d.insight}</p>
      </button>
      {open ? (
        <div className="animate-pop-in border-t-[3px] border-ink bg-surface-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <p
              className="text-lg font-bold uppercase text-ink"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {d.label} — {d.score ?? "—"} · Today
            </p>
            {sample ? <DemoTag /> : <span className="vp-label">Self-reported</span>}
          </div>
          {!sample && (
            <Link
              to="/coach"
              search={{ question: `Explain my ${d.label.toLowerCase()} score using my check-in.` }}
              className="vp-label mt-3 inline-block underline"
            >
              Ask Maya about {d.label.toLowerCase()}
            </Link>
          )}
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {d.rows.map((r) => (
              <li key={r.label} className="rounded-xl border-2 border-ink bg-surface p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="vp-label text-muted-foreground">{r.label}</span>
                  <span className="font-bold text-ink">{r.value}</span>
                </div>
                {r.pct != null ? (
                  <XPBar value={r.pct} tone={d.tone} size="sm" className="mt-2" />
                ) : null}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-start gap-2 rounded-xl border-2 border-ink bg-yellow p-3 text-ink">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-sm">
              <span className="vp-label">Today's tip: </span>
              {d.tip}
            </p>
          </div>
        </div>
      ) : null}
    </article>
  );
}
