import { DIFFICULTY_LABEL, type CaseDifficulty } from "@/types/cases";
import { StatusChip } from "@/components/vp/ui";
import { cn } from "@/lib/utils";

const tone = { easy: "lime", medium: "yellow", hard: "pink" } as const;
const dot = { easy: "bg-lime", medium: "bg-yellow", hard: "bg-pink" } as const;

export function DifficultyChip({
  difficulty,
  className,
}: {
  difficulty: CaseDifficulty;
  className?: string;
}) {
  return (
    <StatusChip
      tone={tone[difficulty]}
      className={cn("text-[0.6rem]", className)}
      icon={<span className={cn("h-2 w-2 rounded-full border border-ink", dot[difficulty])} />}
    >
      {difficulty} — {DIFFICULTY_LABEL[difficulty]}
    </StatusChip>
  );
}
