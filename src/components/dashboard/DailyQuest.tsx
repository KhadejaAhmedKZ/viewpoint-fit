import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Flag, Zap } from "lucide-react";
import { useGame } from "@/lib/game-state";
import { statIcons } from "@/components/vp/icons";
import { Deco, Sticker } from "@/components/vp/ui";
import type { DailyQuest as Quest } from "@/types";

export function DailyQuest({ quest }: { quest: Quest }) {
  const Icon = statIcons[quest.category];
  const { dailyQuestDone } = useGame();
  return (
    <section className="vp-card vp-pop-lg relative overflow-hidden bg-ink p-5 text-surface">
      <Deco kind="star" className="right-5 top-5 text-yellow" />
      <Sticker tone="yellow" rotate={-3}>
        <Flag className="h-3 w-3" /> Daily Quest
      </Sticker>
      <div className="mt-4 flex items-center gap-3">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-[3px] border-yellow bg-pink text-surface">
          <Icon className="h-7 w-7" />
        </span>
        <div className="min-w-0">
          <h3 className="text-2xl font-bold uppercase leading-tight text-yellow sm:text-3xl">
            {quest.title}
          </h3>
          <p className="text-sm text-surface/80">{quest.description}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        {dailyQuestDone ? (
          <span className="vp-label inline-flex items-center gap-1 rounded-full border-2 border-yellow bg-lime px-3 py-1.5 text-ink">
            <Check className="h-3.5 w-3.5" strokeWidth={4} /> Quest complete · +{quest.xp} XP earned
          </span>
        ) : (
          <span className="vp-label animate-xp-pulse inline-flex items-center gap-1 rounded-full border-2 border-yellow bg-yellow px-3 py-1.5 text-ink">
            <Zap className="h-3.5 w-3.5 fill-current" /> Reward +{quest.xp} XP
          </span>
        )}
        <Link
          to={quest.to}
          className="vp-label vp-press inline-flex min-h-12 items-center gap-2 rounded-xl border-[3px] border-ink bg-yellow px-5 text-sm text-ink shadow-[4px_4px_0_0_var(--cyber-pink)]"
        >
          {dailyQuestDone ? "Train again" : quest.cta} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
