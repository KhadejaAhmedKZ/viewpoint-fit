import { ArrowDown } from "lucide-react";
import type { HealthCase } from "@/types/cases";

function Chain({ steps, tone }: { steps: string[]; tone: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      {steps.map((s, i) => (
        <div key={s} className="flex flex-col items-center gap-1">
          <span
            className={`vp-label rounded-md border-2 border-ink px-2.5 py-1 text-center text-ink ${tone}`}
          >
            {s}
          </span>
          {i < steps.length - 1 ? <ArrowDown className="h-4 w-4 text-ink" /> : null}
        </div>
      ))}
    </div>
  );
}

/** Conceptual before/plan system map. Educational only — no guaranteed outcomes. */
export function SystemMap({ c, plan }: { c: HealthCase; plan: string[] }) {
  const m = c.systemMap!;
  const chains = m.plan.filter((p) => p.requires.some((id) => plan.includes(id)));
  return (
    <div className="animate-fade-in vp-card grid gap-4 p-4 sm:grid-cols-2">
      <div>
        <p className="vp-label mb-2 text-ink">Before</p>
        <div className="flex flex-wrap justify-center gap-4">
          {m.before.map((ch) => (
            <Chain key={ch.join()} steps={ch} tone="bg-pink/30" />
          ))}
        </div>
      </div>
      <div>
        <p className="vp-label mb-2 text-ink">Your plan</p>
        {chains.length ? (
          <div className="flex flex-wrap justify-center gap-4">
            {chains.map((ch) => (
              <Chain key={ch.chain.join()} steps={ch.chain} tone="bg-lime" />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border-2 border-dashed border-ink p-3 text-sm text-ink">
            This plan doesn't change the work–sleep or training–recovery chains yet.
          </p>
        )}
      </div>
      <p className="text-xs text-muted-foreground sm:col-span-2">
        Conceptual picture only — not a guaranteed outcome.
      </p>
    </div>
  );
}
