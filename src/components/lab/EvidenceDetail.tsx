import { Pin, PinOff, X } from "lucide-react";
import type { CaseEvidence, TimelineDay } from "@/types/cases";
import { TimelineView } from "./TimelineView";
import { GameButton } from "@/components/vp/ui";

export function EvidenceDetail({
  ev,
  pinned,
  onTogglePin,
  onClose,
  timeline,
}: {
  ev: CaseEvidence;
  pinned: boolean;
  onTogglePin: () => void;
  onClose: () => void;
  timeline?: TimelineDay[] | undefined;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={ev.title}
      onClick={onClose}
    >
      <div
        className="animate-pop-in vp-card vp-pop-lg w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-[3px] border-ink bg-yellow px-4 py-2">
          <span className="vp-label text-ink">Evidence · {ev.category}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-lg border-2 border-ink bg-surface text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3 p-5">
          <h3
            className="text-2xl font-bold uppercase text-ink"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {ev.title}
          </h3>
          {ev.note ? (
            <p className="vp-label inline-block rounded border-2 border-ink bg-cyan px-2 py-0.5 text-[0.6rem] text-ink">
              {ev.note}
            </p>
          ) : null}
          {ev.isTimeline && (ev.timelineDays ?? timeline) ? (
            <>
              <TimelineView days={(ev.timelineDays ?? timeline)!} />
              {ev.summary ? <p className="vp-label text-ink">{ev.summary}</p> : null}
            </>
          ) : (
            <p className="inline-block rounded-lg border-[3px] border-ink bg-pink px-3 py-1 text-xl font-bold uppercase text-surface">
              {ev.value}
            </p>
          )}
          <p className="text-base italic leading-relaxed text-ink">“{ev.description}”</p>
          <GameButton tone={pinned ? "white" : "pink"} onClick={onTogglePin} className="w-full">
            {pinned ? (
              <>
                <PinOff className="h-4 w-4" /> Remove from clue board
              </>
            ) : (
              <>
                <Pin className="h-4 w-4" /> Add to clue board
              </>
            )}
          </GameButton>
        </div>
      </div>
    </div>
  );
}
