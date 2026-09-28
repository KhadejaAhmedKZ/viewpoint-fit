import { Lightbulb } from "lucide-react";

export function HintBox({ hint, used, onUse }: { hint: string; used: boolean; onUse: () => void }) {
  if (used)
    return (
      <div className="animate-fade-in grid grid-cols-[auto_minmax(0,1fr)] gap-2 rounded-xl border-[3px] border-ink bg-yellow p-3 text-sm text-ink">
        <Lightbulb className="mt-0.5 h-4 w-4" />
        <p>
          <span className="vp-label">Hint · </span>
          {hint}
        </p>
      </div>
    );
  return (
    <button
      type="button"
      onClick={onUse}
      className="vp-label vp-press inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-dashed border-ink bg-surface px-3 text-ink"
    >
      <Lightbulb className="h-4 w-4" /> Need a hint?{" "}
      <span className="text-muted-foreground">(lowers reasoning bonus)</span>
    </button>
  );
}
