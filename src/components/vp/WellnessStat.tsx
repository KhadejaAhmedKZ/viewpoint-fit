import { TrendingDown, TrendingUp } from "lucide-react";
import type { WellnessStat as Stat } from "@/types";
import { cn } from "@/lib/utils";
import { statIcons } from "./icons";
import { XPBar, toneFill } from "./ui";

export function WellnessStat({ stat }: { stat: Stat }) {
  const Icon = statIcons[stat.id];
  const up = stat.trend >= 0;
  return (
    <article className="vp-card vp-pop vp-lift p-4">
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "grid h-10 w-10 place-items-center rounded-xl border-[3px] border-ink",
            toneFill[stat.tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span
          className={cn(
            "vp-label flex items-center gap-1 rounded-md border-2 border-ink px-1.5 py-0.5",
            up ? "bg-lime text-ink" : "bg-surface-2 text-ink",
          )}
        >
          {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {up ? "+" : ""}
          {stat.trend}
        </span>
      </div>
      <p className="vp-label mt-3 text-muted-foreground">{stat.label}</p>
      <p
        className="text-4xl font-bold leading-none text-ink"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {stat.score}
      </p>
      <p className="vp-label mt-1 text-ink">{stat.status}</p>
      <XPBar value={stat.score} tone={stat.tone} size="sm" className="mt-3" />
      <p className="mt-2 truncate text-xs text-muted-foreground">{stat.detail}</p>
    </article>
  );
}
