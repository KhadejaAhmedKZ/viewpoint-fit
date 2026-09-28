import { CalendarDays, Eye, Pin } from "lucide-react";
import type { TimelineDay } from "@/types/cases";
import { TimelineView } from "./TimelineView";
import type { CaseEvidence } from "@/types/cases";
import { cn } from "@/lib/utils";

export function EvidenceCard({
  ev,
  index,
  discovered,
  pinned,
  onOpen,
  timeline,
}: {
  ev: CaseEvidence;
  index: number;
  discovered: boolean;
  pinned: boolean;
  onOpen: () => void;
  timeline?: TimelineDay[] | undefined;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "vp-card vp-press relative flex min-h-28 flex-col items-start gap-1 p-3 text-left",
        discovered ? "bg-surface" : "vp-stripes bg-surface-2",
        pinned && "bg-yellow",
        ev.isTimeline && "animate-pop-in col-span-2 md:col-span-3 lg:col-span-4",
      )}
    >
      <span className="vp-label flex items-center gap-1 text-muted-foreground">
        {ev.isTimeline ? (
          <>
            <CalendarDays className="h-3.5 w-3.5" /> New evidence
          </>
        ) : (
          <>Evidence {String(index + 1).padStart(2, "0")}</>
        )}
      </span>
      <span className="vp-label rounded border-2 border-ink bg-surface px-1.5 py-0.5 text-[0.6rem] text-ink">
        {ev.category}
      </span>
      <span className="text-base font-bold uppercase leading-tight text-ink">{ev.title}</span>
      {discovered && ev.isTimeline && (ev.timelineDays ?? timeline) ? (
        <div className="mt-1 w-full">
          <TimelineView days={(ev.timelineDays ?? timeline)!} compact />
          {ev.summary ? <p className="vp-label mt-1 text-[0.6rem] text-ink">{ev.summary}</p> : null}
        </div>
      ) : discovered ? (
        <span className="text-sm font-bold text-pink">{ev.value}</span>
      ) : (
        <span className="vp-label flex items-center gap-1 text-muted-foreground">
          <Eye className="h-3.5 w-3.5" /> Tap to inspect
        </span>
      )}
      {pinned ? (
        <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-pink text-surface">
          <Pin className="h-3.5 w-3.5" />
        </span>
      ) : null}
    </button>
  );
}
