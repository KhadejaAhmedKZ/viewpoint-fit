import { useState } from "react";
import { Link2, X } from "lucide-react";
import type { CaseConnections, SystemNode } from "@/types/cases";
import { GameButton } from "@/components/vp/ui";
import { cn } from "@/lib/utils";

const SYSTEMS: { id: SystemNode["system"]; label: string }[] = [
  { id: "work", label: "💼 Work" },
  { id: "sleep", label: "🌙 Sleep" },
  { id: "training", label: "🏋️ Training" },
  { id: "recovery", label: "⚡ Recovery" },
  { id: "routine", label: "🔄 Routine" },
];

/** Select factor A → factor B → Connect. Individual correctness stays hidden until the reveal. */
export function SystemBoard({
  cfg,
  connections,
  validCount,
  onConnect,
  onRemove,
}: {
  cfg: CaseConnections;
  connections: string[];
  validCount: number;
  onConnect: (a: string, b: string) => void;
  onRemove: (key: string) => void;
}) {
  const [a, setA] = useState<string | null>(null);
  const [b, setB] = useState<string | null>(null);
  const label = (id: string) => cfg.nodes.find((n) => n.id === id)?.label ?? id;
  const pick = (id: string) => {
    if (a === id) return setA(null);
    if (b === id) return setB(null);
    if (!a) setA(id);
    else setB(id);
  };
  const complete = validCount >= cfg.required;
  return (
    <section className="vp-card vp-grid space-y-3 bg-cyan p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="vp-label flex items-center gap-2 text-ink">
          <Link2 className="h-4 w-4" /> System connection board
        </p>
        <span
          className={cn(
            "vp-label rounded-md border-2 border-ink px-2 py-0.5 text-ink",
            complete ? "bg-lime" : "bg-surface",
          )}
        >
          {Math.min(validCount, cfg.required)} / {cfg.required}
        </span>
      </div>
      {complete ? (
        <p className="animate-pop-in vp-label rounded-lg border-2 border-ink bg-yellow p-2 text-center text-ink">
          Pattern network complete
        </p>
      ) : (
        <p className="text-sm text-ink">
          Tap factor A, then factor B, then connect. Link factors that may influence each other.
        </p>
      )}
      <div className="space-y-2">
        {SYSTEMS.map((sys) => (
          <div key={sys.id}>
            <p className="vp-label text-[0.6rem] text-ink">{sys.label}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {cfg.nodes
                .filter((n) => n.system === sys.id)
                .map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => pick(n.id)}
                    aria-pressed={a === n.id || b === n.id}
                    className={cn(
                      "vp-press min-h-10 rounded-lg border-2 border-ink px-2.5 text-sm font-bold text-ink shadow-[2px_2px_0_0_var(--ink)]",
                      a === n.id ? "bg-yellow" : b === n.id ? "bg-pink text-surface" : "bg-surface",
                    )}
                  >
                    {a === n.id ? "A · " : b === n.id ? "B · " : ""}
                    {n.label}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
      <GameButton
        tone="pink"
        disabled={!a || !b}
        onClick={() => {
          onConnect(a!, b!);
          setA(null);
          setB(null);
        }}
        className="w-full"
      >
        {a && b ? `Connect ${label(a)} ↔ ${label(b)}` : "Select two factors"}
      </GameButton>
      {connections.length ? (
        <ul className="space-y-1.5">
          {connections.map((k) => {
            const [x, y] = k.split("|");
            return (
              <li
                key={k}
                className="animate-pop-in flex items-center justify-between gap-2 rounded-lg border-2 border-ink bg-surface px-2.5 py-1.5 text-sm font-bold text-ink"
              >
                <span className="min-w-0">
                  {label(x!)} ↔ {label(y!)}
                </span>
                <button
                  type="button"
                  aria-label="Remove connection"
                  onClick={() => onRemove(k)}
                  className="grid h-8 w-8 shrink-0 place-items-center"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
