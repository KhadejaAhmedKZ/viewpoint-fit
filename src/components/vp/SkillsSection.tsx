import { Lock, Sparkles } from "lucide-react";
import { skills } from "@/data/skills";
import { useGame } from "@/lib/game-state";
import { cn } from "@/lib/utils";
import { toneFill } from "./ui";

/** Reusable skill list. Unlocks come from game state. */
export function SkillsSection() {
  const { unlockedSkills } = useGame();
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {skills.map((s) => {
        const on = unlockedSkills.includes(s.id);
        return (
          <div
            key={s.id}
            className={cn("vp-card flex items-center gap-3 p-4", !on && "vp-stripes bg-surface-2")}
          >
            <span
              className={cn(
                "grid h-12 w-12 shrink-0 place-items-center rounded-xl border-[3px] border-ink",
                on ? toneFill[s.tone] : "bg-surface text-muted-foreground",
              )}
            >
              {on ? <Sparkles className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
            </span>
            <div className="min-w-0">
              <p className="font-bold uppercase text-ink">{s.name}</p>
              <p className="text-xs text-muted-foreground">
                {on ? s.description : `Unlock by solving ${s.source}.`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
