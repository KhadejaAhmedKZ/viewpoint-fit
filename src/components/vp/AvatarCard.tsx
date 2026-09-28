import { Sparkles } from "lucide-react";
import { useGame } from "@/lib/game-state";
import { Deco, GameCard, LevelBadge, Sticker, XPBar } from "./ui";

/** Stylized placeholder avatar. Presentation only — no 3D model yet. */
export function AvatarFigure({ size = 112 }: { size?: number }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden className="shrink-0">
      <rect
        x="4"
        y="4"
        width="112"
        height="112"
        rx="24"
        fill="var(--cyber-cyan)"
        stroke="var(--ink)"
        strokeWidth="5"
      />
      <circle
        cx="60"
        cy="44"
        r="18"
        fill="var(--electric-yellow)"
        stroke="var(--ink)"
        strokeWidth="5"
      />
      <rect x="44" y="38" width="32" height="10" rx="5" fill="var(--ink)" />
      <rect x="49" y="41" width="8" height="4" rx="2" fill="var(--cyber-cyan)" />
      <rect x="63" y="41" width="8" height="4" rx="2" fill="var(--cyber-cyan)" />
      <path
        d="M28 112 C30 82 44 70 60 70 C76 70 90 82 92 112 Z"
        fill="var(--cyber-pink)"
        stroke="var(--ink)"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d="M52 84 L60 94 L68 84"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AvatarCard({ compact = false }: { compact?: boolean }) {
  const { levelInfo } = useGame();
  const { level, title: levelTitle, xpIntoLevel: xp } = levelInfo;
  const xpToNextLevel = levelInfo.xpForLevel ?? xp;
  return (
    <GameCard className="vp-grid overflow-hidden">
      <Deco kind="star" className="right-4 top-3 text-yellow drop-shadow-[1px_1px_0_var(--ink)]" />
      <Deco kind="cross" className="bottom-3 right-6 text-pink" />
      <div className="flex items-center gap-4">
        <div className="animate-float" style={{ ["--r" as string]: "-3deg" }}>
          <AvatarFigure size={compact ? 84 : 104} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="vp-label text-muted-foreground">Your View</p>
          <p
            className="truncate text-xl font-bold uppercase text-ink"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {levelTitle}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <LevelBadge level={level} />
            <Sticker tone="purple" rotate={3}>
              <Sparkles className="h-3 w-3" /> Avatar soon
            </Sticker>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <XPBar value={xp} max={xpToNextLevel} tone="pink" />
            <span className="vp-label animate-xp-pulse shrink-0 text-ink">
              {xp} / {xpToNextLevel}
            </span>
          </div>
        </div>
      </div>
    </GameCard>
  );
}
