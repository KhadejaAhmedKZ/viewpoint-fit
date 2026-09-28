import type { HealthCase } from "@/types/cases";
import { cn } from "@/lib/utils";

export function HypothesisPanel({
  c,
  selected,
  theory,
  onSelect,
  onTheory,
}: {
  c: HealthCase;
  selected: string | null;
  theory: string;
  onSelect: (id: string) => void;
  onTheory: (t: string) => void;
}) {
  const tf = c.theoryFirst;
  const theoryInput = (
    <label className="block">
      <span className="vp-label text-ink">{tf ? "Your hypothesis" : "Your theory (optional)"}</span>
      {tf ? <span className="mt-1 block font-bold text-ink">{tf.prompt}</span> : null}
      <input
        type="text"
        value={theory}
        maxLength={160}
        onChange={(e) => onTheory(e.target.value)}
        placeholder={tf?.placeholder ?? "Explain what you think is happening…"}
        className="mt-1 min-h-12 w-full rounded-xl border-[3px] border-ink bg-surface px-3 text-base text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-yellow"
      />
      <span className="mt-1 block text-xs text-muted-foreground">
        Just for you — it isn't graded.
      </span>
    </label>
  );
  if (tf && !theory.trim())
    return (
      <section className="space-y-3">
        {theoryInput}
        <p className="vp-label text-muted-foreground">
          Write your hypothesis to unlock the choices.
        </p>
      </section>
    );
  return (
    <section className="space-y-3">
      {tf ? theoryInput : null}
      <h3 className="text-xl font-bold uppercase text-ink">
        What pattern do you think is most important?
      </h3>
      <div className="grid gap-3" role="radiogroup">
        {c.hypotheses.map((h, i) => (
          <button
            key={h.id}
            type="button"
            role="radio"
            aria-checked={selected === h.id}
            onClick={() => onSelect(h.id)}
            className={cn(
              "vp-card vp-press grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 p-3 text-left",
              selected === h.id ? "bg-yellow" : "bg-surface",
            )}
          >
            <span
              className={cn(
                "grid h-9 w-9 place-items-center rounded-lg border-[3px] border-ink font-bold",
                selected === h.id ? "bg-pink text-surface" : "bg-surface text-ink",
              )}
            >
              {String.fromCharCode(65 + i)}
            </span>
            <span className="text-base font-bold leading-snug text-ink">“{h.text}”</span>
          </button>
        ))}
      </div>
      {tf ? null : theoryInput}
    </section>
  );
}
