import { useState } from "react";
import { ArrowRight, Activity } from "lucide-react";
import type { HealthCase } from "@/types/cases";
import { GameButton } from "@/components/vp/ui";

/** Hard-mode opener: wellness snapshot + unscored First Impression. */
export function SnapshotPanel({ c, onDone }: { c: HealthCase; onDone: (v: "yes" | "no") => void }) {
  const [answer, setAnswer] = useState<"yes" | "no" | null>(null);
  return (
    <section className="space-y-4">
      <div className="vp-card vp-pop-lg p-4">
        <p className="vp-label flex items-center gap-2 text-pink">
          <Activity className="h-4 w-4" /> Wellness snapshot
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {c.snapshot!.map((x) => (
            <div key={x.label} className="rounded-xl border-[3px] border-ink bg-surface p-3">
              <p className="vp-label text-[0.6rem] text-muted-foreground">{x.label}</p>
              <p className="text-lg font-bold uppercase leading-tight text-ink">{x.value}</p>
              {x.note ? (
                <p className="mt-1 text-[0.65rem] font-bold uppercase text-purple">{x.note}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <div className="vp-card bg-yellow p-4">
        <p className="vp-label text-ink">First impression</p>
        <p
          className="mt-1 text-xl font-bold uppercase text-ink"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Does anything immediately stand out?
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(["yes", "no"] as const).map((v) => (
            <GameButton key={v} tone={answer === v ? "pink" : "white"} onClick={() => setAnswer(v)}>
              {v === "yes" ? "Yes" : "Not really"}
            </GameButton>
          ))}
        </div>
      </div>
      {answer ? (
        <div className="animate-pop-in vp-card bg-purple p-4 text-surface">
          <p className="vp-label text-yellow">System message</p>
          <p className="mt-1 text-lg font-bold">“Hard cases aren't always hidden in one number.”</p>
          <GameButton tone="yellow" onClick={() => onDone(answer)} className="mt-3 w-full">
            Dig deeper <ArrowRight className="h-4 w-4" />
          </GameButton>
        </div>
      ) : null}
    </section>
  );
}
