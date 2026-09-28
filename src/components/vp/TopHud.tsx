import { Link } from "@tanstack/react-router";
import { Flame, Star, Zap } from "lucide-react";
import { appMeta } from "@/data/mock";
import { useGame } from "@/lib/game-state";

export function TopHud() {
  const { xp, streak, levelInfo } = useGame();
  const level = levelInfo.level;

  return (
    <header className="sticky top-0 z-30 border-b-[3px] border-ink bg-cream/95 backdrop-blur">
      <div className="mx-auto grid w-full max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border-[3px] border-ink bg-yellow text-ink shadow-[2px_2px_0_0_var(--ink)]">
            <span className="text-sm font-bold" style={{ fontFamily: "var(--font-display)" }}>
              VP
            </span>
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold leading-none tracking-tight text-ink sm:text-lg">
              VIEW POINT <span className="rounded bg-yellow px-1">FIT</span>
            </h1>
            <p className="vp-label mt-1 truncate text-[0.6rem] text-muted-foreground">
              {appMeta.hudTagline}
            </p>
          </div>
        </Link>
        <div className="flex shrink-0 items-center gap-1.5">
          <HudChip icon={<Star className="h-3.5 w-3.5 fill-current" />} className="bg-yellow">
            <span className="hidden sm:inline">Level</span> {level}
          </HudChip>
          <HudChip icon={<Zap className="h-3.5 w-3.5 fill-current" />} className="bg-cyan">
            {xp}
            <span className="hidden sm:inline"> XP</span>
          </HudChip>
          <HudChip
            icon={<Flame className="h-3.5 w-3.5 fill-current" />}
            className="bg-surface text-pink"
          >
            <span className="text-ink">
              {streak}
              <span className="hidden sm:inline"> day streak</span>
            </span>
          </HudChip>
        </div>
      </div>
    </header>
  );
}

function HudChip({
  icon,
  children,
  className,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string | undefined;
}) {
  return (
    <span
      className={`vp-label flex items-center gap-1 rounded-lg border-2 border-ink px-1.5 py-1 text-ink ${className ?? ""}`}
    >
      {icon}
      {children}
    </span>
  );
}
