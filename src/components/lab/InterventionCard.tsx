import { Check, Plus } from "lucide-react";
import type { CaseIntervention } from "@/types/cases";
import { cn } from "@/lib/utils";

export function InterventionCard({
  item,
  selected,
  slot,
  disabled,
  onToggle,
}: {
  item: CaseIntervention;
  selected: boolean;
  slot?: number | undefined;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled && !selected}
      onClick={onToggle}
      className={cn(
        "vp-card relative grid min-h-24 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 p-3 text-left",
        selected ? "bg-lime" : "bg-surface",
        disabled && !selected ? "opacity-50" : "vp-press",
      )}
    >
      <span className="min-w-0">
        <span className="block text-base font-bold uppercase leading-tight text-ink">
          {item.title}
        </span>
        <span className="mt-1 block text-sm text-ink">{item.description}</span>
      </span>
      <span
        className={cn(
          "grid h-10 w-10 place-items-center rounded-lg border-[3px] border-ink font-bold",
          selected ? "bg-ink text-yellow" : "bg-surface text-ink",
        )}
      >
        {selected ? (slot ?? <Check className="h-4 w-4" />) : <Plus className="h-4 w-4" />}
      </span>
    </button>
  );
}
