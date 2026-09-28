import { Dumbbell, Footprints, PersonStanding, Target } from "lucide-react";
import { exerciseList, type ExerciseId } from "@/lib/pose/exercises";
import { useGame } from "@/lib/game-state";
import { cn } from "@/lib/utils";
import { StatusChip, toneFill } from "@/components/vp/ui";

const icons: Record<ExerciseId, typeof Dumbbell> = {
  squat: PersonStanding,
  curl: Dumbbell,
  lunge: Footprints,
};

export function ExercisePicker({
  selected,
  onSelect,
}: {
  selected: ExerciseId;
  onSelect: (id: ExerciseId) => void;
}) {
  const { poseHistory } = useGame();
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {exerciseList.map((ex) => {
        const Icon = icons[ex.id];
        const on = selected === ex.id;
        const best = Math.max(
          -1,
          ...poseHistory.filter((s) => s.exercise === ex.id).map((s) => s.formConsistency),
        );
        return (
          <button
            key={ex.id}
            type="button"
            onClick={() => onSelect(ex.id)}
            aria-pressed={on}
            aria-label={`Start ${ex.name}`}
            className={cn("vp-card vp-pop vp-press p-4 text-left", on ? "bg-yellow" : "bg-surface")}
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "grid h-11 w-11 place-items-center rounded-xl border-[3px] border-ink",
                  toneFill[ex.tone],
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <StatusChip tone={on ? "ink" : "lime"}>{on ? "Selected" : "Ready"}</StatusChip>
            </div>
            <h3 className="mt-3 text-xl font-bold uppercase text-ink">{ex.name}</h3>
            <p className="flex items-center gap-2 text-sm text-ink">
              <Target className="h-4 w-4" /> {ex.targetReps} reps · {ex.difficulty}
            </p>
            <p className="vp-label mt-2 text-ink">
              {best >= 0 ? `Best form ${best}` : on ? "Selected" : "Start"}
            </p>
          </button>
        );
      })}
    </div>
  );
}
