import { useGame } from "@/lib/game-state";
import { Award, Check, NotebookPen, RotateCcw, Zap } from "lucide-react";
import { poseConfig } from "@/config/poseConfig";
import { badges } from "@/data/mock";
import { strongNote, type ExerciseDefinition } from "@/lib/pose/exercises";
import type { Side } from "@/lib/pose/detector";
import {
  formatTime,
  formConsistency,
  trackingQuality,
  type SessionStats,
} from "@/lib/pose/sessionMetrics";
import { GameButton, Sticker } from "@/components/vp/ui";

export interface SummaryData {
  stats: SessionStats;
  xp: boolean;
  badges: string[];
  side: Side;
}

export function SessionSummary({
  ex,
  data,
  onAgain,
}: {
  ex: ExerciseDefinition;
  data: SummaryData;
  onAgain: () => void;
}) {
  const { user } = useGame();
  const { stats } = data;
  const rows: [string, string][] = [
    ["Exercise", ex.name],
    ["Reps", `${stats.reps} / ${ex.targetReps}`],
    ["Duration", formatTime(stats.durationMs)],
    ["Form consistency", `${formConsistency(stats)} / 100`],
    ["Tracking quality", `${trackingQuality(stats)}%`],
    ...(ex.usesSide ? [["Arm", data.side.toUpperCase()] as [string, string]] : []),
    ...(ex.id === "lunge"
      ? ([
          ["Left reps", `${stats.leftReps}`],
          ["Right reps", `${stats.rightReps}`],
        ] as [string, string][])
      : []),
  ];
  const notes = ex.notes(stats);
  return (
    <section className="vp-card vp-pop-lg animate-pop-in bg-surface p-5" aria-live="polite">
      <Sticker tone="lime" rotate={-3}>
        <Check className="h-3 w-3" strokeWidth={4} /> Session complete
      </Sticker>
      <h2 className="mt-3 text-3xl font-bold uppercase text-ink">Quest complete!</h2>
      <p className="vp-label text-ink">
        {stats.reps} / {ex.targetReps} {ex.name}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-2">
        {rows.map(([k, v]) => (
          <div key={k} className="rounded-xl border-2 border-ink bg-surface-2 p-2">
            <dt className="vp-label text-[0.65rem] text-muted-foreground">{k}</dt>
            <dd className="text-lg font-bold text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="vp-label mt-2 text-[0.65rem] text-muted-foreground">
        Form consistency · Prototype coaching metric
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {data.xp ? (
          <span className="vp-label animate-xp-pulse inline-flex items-center gap-1 rounded-full border-2 border-ink bg-yellow px-3 py-1.5 text-ink">
            <Zap className="h-3.5 w-3.5 fill-current" /> +{poseConfig.questXp} XP · Daily Quest
            complete
          </span>
        ) : (
          <span className="vp-label inline-flex items-center gap-1 rounded-full border-2 border-ink bg-surface-2 px-3 py-1.5 text-ink">
            {user
              ? "Daily Quest XP already claimed today"
              : "Demo session · sign in to save progress and earn XP"}
          </span>
        )}
        {data.badges.map((id) => (
          <span
            key={id}
            className="vp-label animate-pop-in inline-flex items-center gap-1 rounded-full border-2 border-ink bg-pink px-3 py-1.5 text-surface"
          >
            <Award className="h-3.5 w-3.5" /> Badge unlocked:{" "}
            {badges.find((b) => b.id === id)?.name}
          </span>
        ))}
      </div>
      <h3 className="vp-label mt-5 flex items-center gap-2 text-ink">
        <NotebookPen className="h-4 w-4" /> Coach notes
      </h3>
      <ul className="mt-2 space-y-1 text-sm text-ink">
        {(notes.length ? notes : [strongNote[ex.id]]).map((n) => (
          <li key={n}>• {n}</li>
        ))}
      </ul>
      <GameButton tone="pink" onClick={onAgain} className="mt-5 w-full">
        <RotateCcw className="h-4 w-4" /> Do another session
      </GameButton>
    </section>
  );
}
