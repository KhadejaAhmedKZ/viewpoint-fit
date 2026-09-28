import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import type { Mission } from "@/types";
import { cn } from "@/lib/utils";
import { statIcons, statTones } from "./icons";
import { XPBar, XPTag, toneFill } from "./ui";

/** Quest-style mission rendered from data. Completing awards XP once. */
export function MissionCard({
  mission,
  onComplete,
}: {
  mission: Mission;
  onComplete: (id: string) => void;
}) {
  const done = mission.completed;
  const Icon = statIcons[mission.category];
  const tone = statTones[mission.category];
  const pct = done ? 100 : mission.target ? ((mission.progress ?? 0) / mission.target) * 100 : 0;

  return (
    <article
      className={cn(
        "vp-pop grid w-full grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-2xl border-[3px] border-ink bg-surface p-3",
        done && "bg-surface-2",
      )}
    >
      <span
        className={cn(
          "grid h-12 w-12 place-items-center rounded-xl border-[3px] border-ink",
          toneFill[tone],
        )}
      >
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="vp-label text-muted-foreground">{mission.category}</p>
          <XPTag xp={mission.xp} />
        </div>
        <p className={cn("font-bold leading-snug text-ink", done && "line-through opacity-60")}>
          {mission.title}
        </p>
        <p className="text-xs text-muted-foreground">{mission.description}</p>
        <XPBar value={pct} tone={tone} size="sm" className="mt-2" />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          {mission.target && !done ? (
            <span className="vp-label text-muted-foreground">
              {mission.progress ?? 0} / {mission.target}
            </span>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            {mission.route && !done ? (
              <Link
                to={mission.route}
                className="vp-label vp-press inline-flex min-h-9 items-center gap-1 rounded-lg border-2 border-ink bg-cyan px-2.5 text-ink"
              >
                Go <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : null}
            {done ? (
              <span className="vp-label inline-flex min-h-9 items-center gap-1 rounded-lg border-2 border-ink bg-lime px-2.5 text-ink">
                <Check className="animate-check h-4 w-4" strokeWidth={4} /> Done
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onComplete(mission.id)}
                className="vp-label vp-press inline-flex min-h-9 items-center gap-1 rounded-lg border-2 border-dashed border-ink bg-surface px-2.5 text-ink"
              >
                <Check className="h-3.5 w-3.5" /> Mark done
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
