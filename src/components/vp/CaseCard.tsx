import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Construction,
  Lock,
  Target,
  Trophy,
  UserRound,
} from "lucide-react";
import type { CaseSummary, Difficulty } from "@/types";
import { cn } from "@/lib/utils";
import { StatusChip, Sticker } from "./ui";
import { DifficultyChip } from "@/components/lab/DifficultyChip";

const difficulty: Record<Difficulty, { tone: "lime" | "yellow" | "pink"; dot: string }> = {
  easy: { tone: "lime", dot: "bg-lime" },
  medium: { tone: "yellow", dot: "bg-yellow" },
  hard: { tone: "pink", dot: "bg-pink" },
};

/** Detective dossier. Locked cases shake when tapped. */
export interface ClosedInfo {
  best: number;
  xp: number;
  badge?: string | undefined;
}

export function CaseCard({
  item,
  soon,
  closed,
}: {
  item: CaseSummary;
  soon?: boolean;
  closed?: ClosedInfo | undefined;
}) {
  const solved = !!closed;
  const [shake, setShake] = useState(0);
  const d = difficulty[item.difficulty];

  const body = (
    <article
      key={shake}
      className={cn(
        "vp-card vp-pop relative h-full overflow-hidden",
        item.locked ? "bg-surface-2" : "vp-lift",
        shake > 0 && "animate-shake",
      )}
    >
      {/* Folder tab */}
      <div
        className={cn(
          "flex items-center justify-between border-b-[3px] border-ink px-4 py-2",
          item.locked ? "bg-surface" : "bg-yellow",
        )}
      >
        <span className="vp-label text-ink">Case #{item.id}</span>
        <DifficultyChip difficulty={item.difficulty} />
      </div>

      <div className={cn("space-y-3 p-4", item.locked && "opacity-70")}>
        <h3
          className={cn(
            "text-xl font-bold uppercase leading-tight text-ink",
            item.locked && "pr-20",
          )}
        >
          {item.title}
        </h3>
        <p className="border-l-4 border-pink pl-3 text-sm italic text-ink">“{item.story}”</p>

        <ul className="space-y-1.5 text-sm text-ink">
          <li className="flex items-center gap-2">
            <UserRound className="h-4 w-4 shrink-0" /> {item.characterName}, {item.characterAge}
          </li>
          <li className="flex items-center gap-2">
            <Target className="h-4 w-4 shrink-0" /> {item.mission}
          </li>
          <li className="flex items-center gap-2 font-bold">
            <Trophy className="h-4 w-4 shrink-0" /> Up to {item.maxXp} XP
          </li>
        </ul>

        <div className="flex flex-wrap gap-1.5">
          {item.themes.map((t) => (
            <StatusChip key={t} tone="white" className="text-[0.6rem]">
              {t}
            </StatusChip>
          ))}
        </div>

        {closed ? (
          <div className="grid grid-cols-3 gap-1.5 rounded-xl border-[3px] border-ink bg-lime p-2 text-center text-ink">
            <div className="col-span-3 vp-label flex items-center justify-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Case closed
            </div>
            <div className="rounded-md border-2 border-ink bg-surface p-1">
              <p className="vp-label text-[0.55rem] text-muted-foreground">Best</p>
              <p className="font-bold">{closed.best}</p>
            </div>
            <div className="rounded-md border-2 border-ink bg-surface p-1">
              <p className="vp-label text-[0.55rem] text-muted-foreground">XP</p>
              <p className="font-bold">+{closed.xp}</p>
            </div>
            <div className="rounded-md border-2 border-ink bg-surface p-1">
              <p className="vp-label text-[0.55rem] text-muted-foreground">Badge</p>
              <p className="truncate text-[0.65rem] font-bold uppercase">{closed.badge ?? "—"}</p>
            </div>
          </div>
        ) : null}

        {item.locked ? (
          <div className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-[3px] border-dashed border-ink bg-surface">
            <Lock className="h-4 w-4" />
            <span className="vp-label text-ink">{item.unlockRequirement}</span>
          </div>
        ) : (
          <div
            className={cn(
              "vp-label flex min-h-12 items-center justify-center gap-2 rounded-xl border-[3px] border-ink",
              soon ? "bg-cyan text-ink" : "bg-pink text-surface",
            )}
          >
            {soon ? (
              <>
                <Construction className="h-4 w-4" /> Available · coming next
              </>
            ) : solved ? (
              <>
                Review / replay <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Investigate <ArrowRight className="h-4 w-4" />
              </>
            )}
          </div>
        )}
      </div>

      {item.locked ? (
        <Sticker tone="ink" rotate={8} className="absolute right-3 top-[3.6rem]">
          <Lock className="h-3 w-3" /> Locked
        </Sticker>
      ) : solved ? (
        <Sticker tone="lime" rotate={8} className="absolute right-3 top-[3.6rem]">
          <CheckCircle2 className="h-3 w-3" /> Solved
        </Sticker>
      ) : null}
    </article>
  );

  if (item.locked) {
    return (
      <button
        type="button"
        aria-disabled
        aria-label={`${item.title} locked. ${item.unlockRequirement ?? ""}`}
        onClick={() => setShake((s) => s + 1)}
        className="block h-full w-full text-left"
      >
        {body}
      </button>
    );
  }

  return (
    <Link to="/lab/$caseId" params={{ caseId: item.id }} className="block h-full">
      {body}
    </Link>
  );
}
