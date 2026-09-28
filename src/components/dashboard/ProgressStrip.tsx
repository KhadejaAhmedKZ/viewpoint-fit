import { Flame } from "lucide-react";
import { AvatarFigure } from "@/components/vp/AvatarCard";
import { GameCard, LevelBadge, XPBar } from "@/components/vp/ui";
import { useGame } from "@/lib/game-state";

export function ProgressStrip() {
  const { xp, levelInfo, streak } = useGame();
  return (
    <GameCard className="vp-grid">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="flex items-center gap-3">
          <AvatarFigure size={72} />
          <div className="min-w-0 flex-1">
            <p className="vp-label text-muted-foreground">Total {xp} XP</p>
            <p
              className="truncate text-xl font-bold uppercase text-ink"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {levelInfo.title}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <LevelBadge level={levelInfo.level} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <XPBar
                key={xp}
                value={levelInfo.xpIntoLevel}
                max={levelInfo.xpForLevel ?? 1}
                tone="pink"
              />
              <span className="vp-label shrink-0 text-ink">
                {levelInfo.xpForLevel
                  ? `${levelInfo.xpIntoLevel} / ${levelInfo.xpForLevel}`
                  : "Max"}
              </span>
            </div>
          </div>
        </div>
        <div className="rounded-xl border-[3px] border-ink bg-surface p-3">
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 fill-current text-pink" />
            <p
              className="text-2xl font-bold text-ink"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {streak} {streak === 1 ? "day" : "days"}
            </p>
            <span className="vp-label text-muted-foreground">Daily streak</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Complete at least one mission each day to continue your streak.
          </p>
        </div>
      </div>
    </GameCard>
  );
}
