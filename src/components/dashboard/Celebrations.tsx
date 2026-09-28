import { Star, Zap } from "lucide-react";
import { GameButton } from "@/components/vp/ui";
import { useGame } from "@/lib/game-state";

const confettiTones = ["bg-yellow", "bg-pink", "bg-cyan", "bg-lime"];

/** Floating "+XP" toast and level-up modal. */
export function Celebrations() {
  const { xpEvent, levelUp, dismissLevelUp } = useGame();
  return (
    <>
      {xpEvent ? (
        <div
          key={xpEvent.id}
          className="animate-toast pointer-events-none fixed bottom-28 left-1/2 z-50 rounded-xl border-[3px] border-ink bg-yellow px-4 py-2 text-center text-ink shadow-[4px_4px_0_0_var(--cyber-pink)]"
          role="status"
        >
          <p className="vp-label">{xpEvent.label}</p>
          <p
            className="flex items-center justify-center gap-1 text-2xl font-bold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <Zap className="h-5 w-5 fill-current" /> +{xpEvent.xp} XP
          </p>
        </div>
      ) : null}
      {levelUp ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Level up"
        >
          <div className="animate-pop-in vp-card vp-pop-lg vp-dots relative w-full max-w-sm overflow-visible bg-yellow p-6 text-center text-ink">
            {Array.from({ length: 14 }).map((_, i) => (
              <span
                key={i}
                aria-hidden
                className={`animate-confetti absolute left-1/2 top-1/3 h-2.5 w-2.5 rounded-sm border border-ink ${confettiTones[i % 4]}`}
                style={{
                  ["--dx" as string]: `${Math.cos((i / 14) * Math.PI * 2) * 150}px`,
                  ["--dy" as string]: `${Math.sin((i / 14) * Math.PI * 2) * 130}px`,
                  ["--rot" as string]: `${i * 50}deg`,
                }}
              />
            ))}
            <Star className="mx-auto h-10 w-10 fill-current text-pink" />
            <p
              className="mt-2 text-4xl font-bold uppercase"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Level up!
            </p>
            <p className="vp-label mt-3 inline-block rounded-md border-2 border-ink bg-ink px-2 py-1 text-yellow">
              Level {levelUp.level}
            </p>
            <p className="mt-2 text-xl font-bold uppercase">{levelUp.title}</p>
            <GameButton tone="pink" className="mt-5 w-full" onClick={dismissLevelUp}>
              Keep going
            </GameButton>
          </div>
        </div>
      ) : null}
    </>
  );
}
