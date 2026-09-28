import { History } from "lucide-react";
import { exercises } from "@/lib/pose/exercises";
import { useGame } from "@/lib/game-state";
import { EmptyState, GameCard, SectionHeader } from "@/components/vp/ui";

export function RecentSessions() {
  const { poseHistory } = useGame();
  return (
    <section>
      <SectionHeader
        kicker="This visit"
        title="Recent sessions"
        icon={<History className="h-4 w-4" />}
      />
      {poseHistory.length === 0 ? (
        <EmptyState
          icon={<History className="h-6 w-6" />}
          title="No sessions yet"
          body="Finish a Squat, Bicep Curl or Lunge session and it will show up here. Sessions reset when you refresh."
        />
      ) : (
        <GameCard className="divide-y-2 divide-ink/15 p-0">
          {poseHistory.slice(0, 6).map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="font-bold uppercase text-ink">
                  {exercises[s.exercise].name}
                  {s.side ? ` · ${s.side} arm` : ""}
                </p>
                <p className="vp-label text-muted-foreground">
                  {s.reps} / {s.targetReps}
                  {s.leftReps !== undefined ? ` · L${s.leftReps} R${s.rightReps}` : ""}
                </p>
              </div>
              <p className="vp-label shrink-0 text-right text-ink">
                Form {s.formConsistency}
                <br />
                {s.durationSeconds} sec
              </p>
            </div>
          ))}
        </GameCard>
      )}
    </section>
  );
}
