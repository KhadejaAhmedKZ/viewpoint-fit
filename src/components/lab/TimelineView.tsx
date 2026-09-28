import type { TimelineDay } from "@/types/cases";
import { cn } from "@/lib/utils";

/** Conceptual 7-day bar strip. Heights are illustrative, not measurements. */
export function TimelineView({
  days,
  tone = "pink",
  compact,
}: {
  days: TimelineDay[];
  tone?: "pink" | "lime" | "cyan";
  compact?: boolean;
}) {
  const fill = { pink: "bg-pink", lime: "bg-lime", cyan: "bg-cyan" }[tone];
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((d, i) => (
        <div key={d.day} className="flex flex-col items-center gap-1">
          <div
            className={cn(
              "relative flex w-full items-end overflow-hidden rounded-md border-2 border-ink bg-surface",
              compact ? "h-16" : "h-28",
            )}
          >
            <div
              className={cn(
                "animate-bar w-full origin-bottom border-t-2 border-ink",
                fill,
                d.level < 15 && "vp-stripes bg-surface-2",
              )}
              style={{ height: `${Math.max(6, d.level)}%`, animationDelay: `${i * 90}ms` }}
            />
          </div>
          <span className="vp-label text-[0.6rem] text-ink">{d.day}</span>
          {d.value ? (
            <span className="text-center text-[0.65rem] font-bold leading-tight text-ink">
              {d.value}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
