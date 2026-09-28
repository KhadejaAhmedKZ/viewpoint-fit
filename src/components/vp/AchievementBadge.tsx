import { Award, Lock } from "lucide-react";
import type { Badge } from "@/types";
import { cn } from "@/lib/utils";
import { toneFill } from "./ui";

export function AchievementBadge({ badge }: { badge: Badge }) {
  return (
    <article className="flex flex-col items-center text-center">
      <div
        className={cn(
          "relative grid h-20 w-20 place-items-center rounded-full border-[3px] border-ink shadow-[4px_4px_0_0_var(--ink)]",
          badge.earned ? toneFill[badge.tone] : "vp-stripes bg-surface-2 text-muted-foreground",
        )}
      >
        <Award className="h-9 w-9" />
        {!badge.earned ? (
          <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-[3px] border-ink bg-surface text-ink">
            <Lock className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </div>
      <p className="vp-label mt-3 text-ink">{badge.name}</p>
      <p className="mt-1 text-xs text-muted-foreground">{badge.description}</p>
    </article>
  );
}
