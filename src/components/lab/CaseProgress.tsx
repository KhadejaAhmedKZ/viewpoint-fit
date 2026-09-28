import { Check } from "lucide-react";
import { CASE_STAGES, type CaseStage } from "@/types/cases";
import { cn } from "@/lib/utils";

/** Compact 7-step stage tracker. Labels collapse to the current step on phones. */
export function CaseProgress({ stage }: { stage: CaseStage }) {
  const idx = CASE_STAGES.findIndex((s) => s.id === stage);
  return (
    <nav aria-label="Case progress" className="vp-card p-3">
      <div className="flex items-center justify-between">
        <p className="vp-label text-muted-foreground">Case progress</p>
        <p className="vp-label text-ink">
          {idx + 1} / {CASE_STAGES.length} · {CASE_STAGES[idx]?.label}
        </p>
      </div>
      <ol className="mt-2 grid grid-cols-7 gap-1">
        {CASE_STAGES.map((s, i) => (
          <li
            key={s.id}
            className="flex flex-col items-center gap-1"
            aria-current={i === idx ? "step" : undefined}
          >
            <span
              className={cn(
                "grid h-7 w-full place-items-center rounded-md border-2 border-ink text-xs font-bold",
                i < idx && "bg-lime text-ink",
                i === idx && "bg-yellow text-ink shadow-[2px_2px_0_0_var(--ink)]",
                i > idx && "bg-surface-2 text-muted-foreground",
              )}
            >
              {i < idx ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                "vp-label hidden text-[0.55rem] sm:block",
                i === idx ? "text-ink" : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
