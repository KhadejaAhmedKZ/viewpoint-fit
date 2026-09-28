import type { HealthCase } from "@/types/cases";
import { cn } from "@/lib/utils";
import { InterventionCard } from "./InterventionCard";

export function PlanBuilder({
  c,
  plan,
  onToggle,
}: {
  c: HealthCase;
  plan: string[];
  onToggle: (id: string) => void;
}) {
  const full = plan.length >= c.maxInterventions;
  return (
    <section className="space-y-3">
      <h3 className="text-xl font-bold uppercase text-ink">Build your plan</h3>
      <p className="text-sm text-ink">
        Choose up to {c.maxInterventions} actions that could improve {c.character.name}'s routine.
      </p>
      <div className="vp-card p-3">
        <p className="vp-label text-ink">
          Plan slots · {plan.length} / {c.maxInterventions}
        </p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {Array.from({ length: c.maxInterventions }).map((_, i) => {
            const it = c.interventions.find((x) => x.id === plan[i]);
            return (
              <div
                key={i}
                className={cn(
                  "grid min-h-16 place-items-center rounded-lg border-[3px] p-1 text-center text-[0.65rem] font-bold uppercase leading-tight",
                  it
                    ? "animate-pop-in border-ink bg-yellow text-ink shadow-[2px_2px_0_0_var(--ink)]"
                    : "border-dashed border-ink/40 bg-surface-2 text-muted-foreground",
                )}
              >
                {it ? it.title : i + 1}
              </div>
            );
          })}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {c.interventions.map((it) => (
          <InterventionCard
            key={it.id}
            item={it}
            selected={plan.includes(it.id)}
            slot={plan.indexOf(it.id) + 1 || undefined}
            disabled={full}
            onToggle={() => onToggle(it.id)}
          />
        ))}
      </div>
    </section>
  );
}
