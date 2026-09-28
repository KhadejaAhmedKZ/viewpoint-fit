import { Check, Lightbulb, Link2 } from "lucide-react";
import { CLASSIFICATION_LABEL, type CaseSession, type HealthCase } from "@/types/cases";
import { StatusChip } from "@/components/vp/ui";
import { groupHit } from "@/lib/cases/scoring";
import { ClueBoard } from "./ClueBoard";

export function CaseReveal({ c, s }: { c: HealthCase; s: CaseSession }) {
  const hyp = c.hypotheses.find((h) => h.id === s.hypothesisId);
  return (
    <section className="space-y-4">
      <div className="vp-card vp-pop-lg vp-dots bg-yellow p-5">
        <p className="vp-label text-pink">Case reveal</p>
        <h3
          className="mt-1 text-3xl font-bold uppercase leading-none text-ink"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {c.reveal.headline}
        </h3>
        {c.reveal.explanation.map((p) => (
          <p key={p} className="mt-3 text-base leading-relaxed text-ink">
            {p}
          </p>
        ))}
      </div>

      <div className="vp-card bg-purple p-4 text-surface">
        <p className="vp-label flex items-center gap-2">
          <Lightbulb className="h-4 w-4" /> The key lesson
        </p>
        {c.reveal.lessonTitle ? (
          <p
            className="mt-1 text-2xl font-bold uppercase leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {c.reveal.lessonTitle}
          </p>
        ) : null}
        <p className="mt-1 text-lg font-bold leading-snug">{c.reveal.lesson}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="vp-card p-4">
          <p className="vp-label text-ink">What you found</p>
          <ul className="mt-2 space-y-2">
            {c.reveal.found.map((f, i) => {
              const g = c.requiredClues[i];
              const hit = g !== undefined && groupHit(g, s.clues);
              return (
                <li key={f} className="flex items-center gap-2 font-bold text-ink">
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-md border-2 border-ink ${hit ? "bg-lime" : "bg-surface-2"}`}
                  >
                    <Check className="h-4 w-4" />
                  </span>
                  {f}
                  {!hit ? <span className="vp-label text-muted-foreground">missed</span> : null}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="vp-card p-4">
          <p className="vp-label flex items-center gap-2 text-ink">
            <Link2 className="h-4 w-4" /> {c.reveal.supportingTitle ?? "Supporting patterns"}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {c.reveal.supporting.map((x) => (
              <StatusChip key={x} tone="white">
                {x}
              </StatusChip>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            These may interact with sleep, energy and recovery — they can support or work against a
            routine.
          </p>
        </div>
      </div>

      {c.reveal.strengths ? (
        <div className="vp-card bg-lime p-4">
          <p className="vp-label text-ink">Current strengths</p>
          <ul className="mt-2 space-y-1.5">
            {c.reveal.strengths.map((x) => (
              <li key={x} className="flex items-center gap-2 font-bold text-ink">
                <Check className="h-4 w-4" /> {x}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-ink">
            Investigating also means noticing what is already working.
          </p>
        </div>
      ) : null}

      {c.evidence.some((e) => e.classification) ? (
        <div className="vp-card p-4">
          <p className="vp-label text-ink">Evidence, classified</p>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {c.evidence.map((e) =>
              e.classification ? (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-2 rounded-lg border-2 border-ink px-2 py-1 text-sm text-ink"
                >
                  <span className="min-w-0 font-bold">{e.title}</span>
                  <span
                    className={`vp-label shrink-0 rounded px-1.5 text-[0.55rem] ${{ pattern: "bg-pink text-surface", context: "bg-cyan", strength: "bg-lime", distractor: "bg-surface-2" }[e.classification]}`}
                  >
                    {CLASSIFICATION_LABEL[e.classification]}
                  </span>
                </li>
              ) : null,
            )}
          </ul>
        </div>
      ) : null}

      {c.reveal.notMain ? (
        <div className="vp-card p-4">
          <p className="vp-label text-ink">What wasn't the main pattern?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {c.reveal.notMain.map((x) => (
              <StatusChip key={x} tone="muted" className="line-through decoration-2">
                {x}
              </StatusChip>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Evidence can also help rule out simple explanations.
          </p>
        </div>
      ) : null}

      {hyp ? (
        <div className="vp-card p-4">
          <p className="vp-label text-ink">Your theory</p>
          <p className="mt-1 italic text-ink">“{hyp.text}”</p>
          <p className="mt-1 text-sm font-bold text-pink">{hyp.feedback}</p>
          {s.theory ? (
            <p className="mt-2 text-sm text-muted-foreground">Your note: {s.theory}</p>
          ) : null}
        </div>
      ) : null}

      <ClueBoard c={c} clues={s.clues} />
    </section>
  );
}
