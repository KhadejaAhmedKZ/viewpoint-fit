import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, RefreshCcw, RotateCcw, Search } from "lucide-react";
import type { HealthCase } from "@/types/cases";
import { useGame } from "@/lib/game-state";
import { canAdvance, validConnections } from "@/lib/cases/caseProgress";
import { simulateCase } from "@/lib/cases/simulation";
import { scoreCase, xpForScore } from "@/lib/cases/scoring";
import { GameButton } from "@/components/vp/ui";
import { CaseBrief } from "./CaseBrief";
import { CaseProgress } from "./CaseProgress";
import { CaseResults } from "./CaseResults";
import { CaseReveal } from "./CaseReveal";
import { CaseSafety } from "./CaseSafety";
import { ClueBoard } from "./ClueBoard";
import { EvidenceCard } from "./EvidenceCard";
import { EvidenceDetail } from "./EvidenceDetail";
import { HintBox } from "./HintBox";
import { HypothesisPanel } from "./HypothesisPanel";
import { PlanBuilder } from "./PlanBuilder";
import { SimulationChart } from "./SimulationChart";
import { TimelineView } from "./TimelineView";
import { SnapshotPanel } from "./SnapshotPanel";
import { SystemBoard } from "./SystemBoard";
import { SystemMap } from "./SystemMap";

/** Renders any HealthCase from data. All rules live in src/lib/cases. */
export function CaseEngine({ c }: { c: HealthCase }) {
  const {
    getCaseSession,
    dispatchCase,
    claimCaseReward,
    caseRewards,
    bestScores,
    recordCaseScore,
  } = useGame();
  const s = getCaseSession(c.id);
  const d = useCallback(
    (a: Parameters<typeof dispatchCase>[1]) => dispatchCase(c, a),
    [c, dispatchCase],
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const [simDone, setSimDone] = useState(false);
  const [firstClaim, setFirstClaim] = useState(false);
  const flash = (text: string) => setToast({ id: Date.now(), text });

  const series = useMemo(() => simulateCase(c, s.plan), [c, s.plan]);
  const score = useMemo(() => scoreCase(c, s), [c, s]);
  const onSimDone = useCallback(() => setSimDone(true), []);
  const ready = canAdvance(c, s);
  const replay = !!caseRewards[c.id] && !firstClaim;

  // Hidden evidence (Medium+): appears once enough cards have been inspected.
  const isVisible = (e: (typeof c.evidence)[number]) =>
    !e.unlockAfter || s.discovered.length >= e.unlockAfter;
  const visible = c.evidence.filter(isVisible);
  const hiddenLeft = c.evidence.length - visible.length;
  const timelineEv =
    c.evidence.find((e) => e.isTimeline && isVisible(e) && !s.discovered.includes(e.id)) ??
    c.evidence.find((e) => e.isTimeline);
  const timelineUnlocked = !!timelineEv && isVisible(timelineEv);
  const newest = visible[visible.length - 1];
  const prevCount = useRef(visible.length);
  useEffect(() => {
    if (visible.length > prevCount.current && s.stage === "investigation")
      flash(newest?.file ? `New file unlocked · ${newest.file}` : "New evidence unlocked!");
    prevCount.current = visible.length;
  }, [visible.length, newest, s.stage]);
  const validConn = validConnections(c, s);

  const open = (id: string) => {
    if (!s.discovered.includes(id))
      flash(id === timelineEv?.id ? "Timeline added to case file" : "Evidence added +10");
    d({ type: "discover", id });
    setOpenId(id);
  };
  const togglePin = (id: string) => {
    if (!s.clues.includes(id)) flash("Clue pinned");
    d({ type: "toggleClue", id });
  };
  const togglePlan = (id: string) => {
    if (!s.plan.includes(id) && s.plan.length === c.maxInterventions - 1) flash("Plan ready");
    d({ type: "togglePlan", id });
  };
  const finish = () => {
    recordCaseScore(c.id, score.total);
    if (claimCaseReward(c, score.total, xpForScore(c, score.total))) setFirstClaim(true);
    d({ type: "advance" });
  };
  const reset = () => {
    setSimDone(false);
    setFirstClaim(false);
    setOpenId(null);
    d({ type: "reset" });
  };

  const opened = c.evidence.find((e) => e.id === openId);
  const detectivePoints = s.discovered.length * 10;

  let body: ReactNode = null;
  let cta: ReactNode = null;

  switch (s.stage) {
    case "briefing":
      body = <CaseBrief c={c} onStart={() => d({ type: "advance" })} />;
      break;
    case "investigation":
      if (c.snapshot && !s.impression) {
        body = <SnapshotPanel c={c} onDone={(value) => d({ type: "setImpression", value })} />;
        break;
      }
      body = (
        <>
          <div className="vp-card grid grid-cols-3 gap-2 bg-yellow p-3 text-center">
            {[
              [
                "Evidence found",
                `${s.discovered.length} / ${visible.length}${hiddenLeft ? "+?" : ""}`,
              ],
              ["Clues selected", String(s.clues.length)],
              ["Detective pts", String(detectivePoints)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border-2 border-ink bg-surface p-2">
                <p className="vp-label text-[0.58rem] text-muted-foreground">{k}</p>
                <p className="text-lg font-bold text-ink">{v}</p>
              </div>
            ))}
          </div>
          <ClueBoard c={c} clues={s.clues} onRemove={(id) => d({ type: "toggleClue", id })} />
          {timelineEv && timelineUnlocked && !s.discovered.includes(timelineEv.id) ? (
            <button
              type="button"
              onClick={() => open(timelineEv.id)}
              className="animate-pop-in vp-card vp-pop-lg vp-press flex w-full items-center gap-3 bg-pink p-4 text-left text-surface"
            >
              <CalendarDays className="h-8 w-8 shrink-0" />
              <span>
                <span className="vp-label block text-yellow">New evidence unlocked</span>
                <span
                  className="text-xl font-bold uppercase"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {timelineEv.title}
                </span>
              </span>
            </button>
          ) : null}
          {hiddenLeft > 0 ? (
            <p className="vp-label rounded-lg border-2 border-dashed border-ink bg-surface-2 p-2 text-center text-muted-foreground">
              {hiddenLeft} hidden evidence · keep investigating
            </p>
          ) : null}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-xl font-bold uppercase text-ink">
              <Search className="h-5 w-5" /> Case file
            </h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {visible.map((ev, i) => (
                <EvidenceCard
                  key={ev.id}
                  ev={ev}
                  index={i}
                  discovered={s.discovered.includes(ev.id)}
                  pinned={s.clues.includes(ev.id)}
                  onOpen={() => open(ev.id)}
                  timeline={c.timeline?.days}
                />
              ))}
            </div>
          </div>
          <HintBox hint={c.hint} used={s.hintUsed} onUse={() => d({ type: "useHint" })} />
        </>
      );
      cta = (
        <GameButton
          tone="pink"
          disabled={!ready}
          onClick={() => d({ type: "advance" })}
          className="w-full"
        >
          {ready ? (
            <>
              Connect the clues <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            `Inspect ${Math.max(0, c.minEvidenceToAnalyze - s.discovered.length)} more & pin a clue`
          )}
        </GameButton>
      );
      break;
    case "analysis":
      body = (
        <>
          <p className="vp-label text-pink">Connect the clues</p>
          <ClueBoard c={c} clues={s.clues} />
          {c.connections ? (
            <SystemBoard
              cfg={c.connections}
              connections={s.connections}
              validCount={validConn}
              onConnect={(a, b) => d({ type: "connect", a, b })}
              onRemove={(key) => d({ type: "disconnect", key })}
            />
          ) : null}
          {c.connections && validConn < c.connections.required ? (
            <p className="vp-label rounded-lg border-2 border-dashed border-ink bg-surface-2 p-3 text-center text-muted-foreground">
              Make {c.connections.required} valid system connections to unlock your hypothesis
            </p>
          ) : (
            <HypothesisPanel
              c={c}
              selected={s.hypothesisId}
              theory={s.theory}
              onSelect={(id) => d({ type: "chooseHypothesis", id })}
              onTheory={(text) => d({ type: "setTheory", text })}
            />
          )}
          <HintBox hint={c.hint} used={s.hintUsed} onUse={() => d({ type: "useHint" })} />
          {c.theoryFirst ? null : (
            <button
              type="button"
              onClick={() => d({ type: "skipHypothesis" })}
              className="vp-label min-h-11 text-muted-foreground underline"
            >
              Skip theory (reasoning bonus 60)
            </button>
          )}
        </>
      );
      cta = (
        <GameButton
          tone="pink"
          disabled={!ready}
          onClick={() => d({ type: "advance" })}
          className="w-full"
        >
          Submit theory <ArrowRight className="h-4 w-4" />
        </GameButton>
      );
      break;
    case "plan":
      body = <PlanBuilder c={c} plan={s.plan} onToggle={togglePlan} />;
      cta = (
        <GameButton
          tone="pink"
          disabled={!ready}
          onClick={() => {
            setSimDone(false);
            d({ type: "advance" });
          }}
          className="w-full"
        >
          Run simulation <ArrowRight className="h-4 w-4" />
        </GameButton>
      );
      break;
    case "simulation":
      body = (
        <>
          <div className="rounded-xl border-[3px] border-ink bg-cyan p-3 text-ink">
            <p className="vp-label">Educational simulation</p>
            <p className="text-sm">
              Illustrative wellness scenario — not a prediction of medical outcomes. 4 weeks, 80%
              adherence.
            </p>
          </div>
          <SimulationChart c={c} series={series} onDone={onSimDone} />
          {c.systemMap && simDone ? <SystemMap c={c} plan={s.plan} /> : null}
          {c.weeklyDistribution && simDone ? (
            <div className="animate-fade-in vp-card grid gap-4 p-4 sm:grid-cols-2">
              <div>
                <p className="vp-label text-ink">Before</p>
                <p className="mb-2 text-xs text-muted-foreground">
                  Mon–Thu low · Fri–Sat very high
                </p>
                <TimelineView days={c.weeklyDistribution.before} tone="pink" compact />
              </div>
              <div>
                <p className="vp-label text-ink">Plan</p>
                <p className="mb-2 text-xs text-muted-foreground">
                  Activity spread more evenly across the week
                </p>
                <TimelineView days={c.weeklyDistribution.plan} tone="lime" compact />
              </div>
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Conceptual picture only — not future step counts.
              </p>
            </div>
          ) : null}
        </>
      );
      cta = (
        <GameButton
          tone="pink"
          disabled={!simDone}
          onClick={() => d({ type: "advance" })}
          className="w-full"
        >
          Open case reveal <ArrowRight className="h-4 w-4" />
        </GameButton>
      );
      break;
    case "reveal":
      body = <CaseReveal c={c} s={s} />;
      cta = (
        <GameButton tone="pink" onClick={finish} className="w-full">
          See case score <ArrowRight className="h-4 w-4" />
        </GameButton>
      );
      break;
    case "results":
      body = (
        <CaseResults
          c={c}
          score={score}
          reward={caseRewards[c.id]}
          firstClaim={firstClaim}
          best={bestScores[c.id]}
        />
      );
      break;
  }

  const canBack = ["investigation", "analysis", "plan"].includes(s.stage);

  return (
    <div className="space-y-5">
      {replay ? (
        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-xl border-[3px] border-ink bg-cyan p-3 text-ink">
          <RefreshCcw className="mt-0.5 h-5 w-5" />
          <div>
            <p className="vp-label">
              Replay mode{bestScores[c.id] !== undefined ? ` · Best score ${bestScores[c.id]}` : ""}
            </p>
            <p className="text-sm">
              XP and badges have already been claimed. Replay this case to improve your
              understanding.
            </p>
          </div>
        </div>
      ) : null}
      <CaseProgress stage={s.stage} />
      {body}
      {cta ? (
        <div className="sticky bottom-24 z-30 flex gap-2 md:bottom-4">
          {canBack ? (
            <GameButton tone="white" onClick={() => d({ type: "back" })} className="shrink-0 px-3">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </GameButton>
          ) : null}
          <div className="min-w-0 flex-1">{cta}</div>
        </div>
      ) : null}
      <CaseSafety />
      {s.stage !== "briefing" ? (
        <button
          type="button"
          onClick={reset}
          className="vp-label vp-press inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-dashed border-ink bg-surface px-3 text-ink"
        >
          <RotateCcw className="h-4 w-4" /> Reset case
        </button>
      ) : null}

      {opened ? (
        <EvidenceDetail
          ev={opened}
          timeline={c.timeline?.days}
          pinned={s.clues.includes(opened.id)}
          onTogglePin={() => togglePin(opened.id)}
          onClose={() => setOpenId(null)}
        />
      ) : null}
      {toast ? (
        <div
          key={toast.id}
          role="status"
          className="animate-toast pointer-events-none fixed left-1/2 top-24 z-[60] rounded-xl border-[3px] border-ink bg-yellow px-4 py-2 text-ink shadow-[4px_4px_0_0_var(--cyber-pink)]"
        >
          <p className="vp-label">{toast.text}</p>
        </div>
      ) : null}
    </div>
  );
}
