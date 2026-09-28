import { Pin, X } from "lucide-react";
import type { HealthCase } from "@/types/cases";

const tilts = [-2, 1.5, -1, 2, -1.5, 1];

export function ClueBoard({
  c,
  clues,
  onRemove,
}: {
  c: HealthCase;
  clues: string[];
  onRemove?: (id: string) => void;
}) {
  const items = clues.map((id) => c.evidence.find((e) => e.id === id)).filter(Boolean);
  return (
    <section className="vp-card vp-grid bg-cyan p-4">
      <p className="vp-label flex items-center gap-2 text-ink">
        <Pin className="h-4 w-4" /> Clue board · {items.length}
      </p>
      {items.length === 0 ? (
        <p className="mt-2 rounded-lg border-2 border-dashed border-ink bg-surface/70 p-3 text-sm text-ink">
          Inspect evidence and pin what looks important.
        </p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2">
          {items.map((e, i) => (
            <li
              key={e!.id}
              className="animate-pop-in vp-label inline-flex min-h-10 items-center gap-1.5 rounded-md border-2 border-ink bg-surface px-2.5 text-ink shadow-[2px_2px_0_0_var(--ink)]"
              style={{ transform: `rotate(${tilts[i % tilts.length]}deg)` }}
            >
              <span className="h-2.5 w-2.5 rounded-full border border-ink bg-pink" />
              {e!.pinLabel}
              {onRemove ? (
                <button
                  type="button"
                  aria-label={`Unpin ${e!.title}`}
                  onClick={() => onRemove(e!.id)}
                  className="-mr-1 grid h-7 w-7 place-items-center"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
