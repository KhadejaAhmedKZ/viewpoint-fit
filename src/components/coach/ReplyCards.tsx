import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Footprints,
  Lightbulb,
  ListChecks,
  Moon,
  Phone,
  Plus,
  RotateCcw,
  Salad,
  Search,
  ShieldAlert,
  WifiOff,
  Zap,
} from "lucide-react";
import { agents, type AgentId } from "@/lib/coach/agents";
import type { ChatMsg, SpoilerNotice } from "@/lib/coach/coach-state";
import type { SafetyNotice } from "@/lib/coach/safety";
import { playableCases } from "@/data/cases";
import { useGame } from "@/lib/game-state";
import { cn } from "@/lib/utils";
import { GameButton, StatusChip, toneFill } from "@/components/vp/ui";

export const agentIcons: Record<AgentId, typeof Zap> = {
  movement: Footprints,
  nutrition: Salad,
  recovery: Moon,
  wellness: Zap,
  education: Lightbulb,
  case: Search,
};

export function AgentChip({ id }: { id: AgentId }) {
  const Icon = agentIcons[id];
  return (
    <StatusChip tone={agents[id].tone} icon={<Icon className="h-3 w-3" />}>
      {agents[id].chip}
    </StatusChip>
  );
}

function MayaLabel({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <span className="vp-label rounded-md border-2 border-ink bg-yellow px-2 py-0.5 text-ink">
        Maya
      </span>
      {children}
    </div>
  );
}

const linkTo = {
  pose: { to: "/pose", label: "Open Pose Coach" },
  progress: { to: "/progress", label: "View full progress" },
  lab: { to: "/lab", label: "Open VIEW POINT LAB" },
} as const;

export function ReplyCard({
  msg,
  onSend,
}: {
  msg: Extract<ChatMsg, { kind: "reply" }>;
  onSend: (t: string) => void;
}) {
  const { reply, route } = msg;
  const { aiMission, addAiMission, solvedCases } = useGame();
  const related =
    reply.relatedCaseId !== "none" && solvedCases.includes(reply.relatedCaseId)
      ? playableCases[reply.relatedCaseId]
      : undefined;
  const mine =
    aiMission && reply.missionSuggestion && aiMission.title === reply.missionSuggestion.title;
  const follow = reply.followUps.length
    ? reply.followUps
    : ["Why does that help?", "Give me a simple plan"];
  return (
    <article data-maya-reply className="vp-card vp-pop animate-pop-in bg-surface p-4">
      <MayaLabel>
        <AgentChip id={reply.agent} />
      </MayaLabel>
      <p className="vp-label text-muted-foreground">{agents[reply.agent].chip} view</p>
      <h3 className="text-xl font-bold uppercase leading-tight text-ink">{reply.title}</h3>
      <p className="mt-1 text-sm text-ink">{reply.summary}</p>
      {reply.why && (
        <div className="mt-3 rounded-xl border-2 border-ink bg-surface-2 p-3">
          <p className="vp-label flex items-center gap-1 text-ink">
            <Lightbulb className="h-3.5 w-3.5" /> Why it matters
          </p>
          <p className="mt-1 text-sm text-ink">{reply.why}</p>
          {reply.example && (
            <p className="mt-2 text-sm italic text-ink">Example: {reply.example}</p>
          )}
        </div>
      )}
      {reply.actions.length > 0 && (
        <div className="mt-3">
          <p className="vp-label flex items-center gap-1 text-ink">
            <ListChecks className="h-3.5 w-3.5" /> Try today
          </p>
          <ul className="mt-1 space-y-1 text-sm text-ink">
            {reply.actions.map((a) => (
              <li key={a} className="flex gap-2">
                <span aria-hidden>→</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {reply.missionSuggestion && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-dashed border-ink bg-yellow/30 p-3">
          <div className="min-w-0">
            <p className="vp-label text-ink">Add as mission · +40 XP</p>
            <p className="font-bold text-ink">{reply.missionSuggestion.title}</p>
          </div>
          {mine ? (
            <StatusChip tone="lime" icon={<Check className="h-3 w-3" />}>
              Added to Home
            </StatusChip>
          ) : aiMission ? (
            <StatusChip tone="muted">Today's AI mission already added</StatusChip>
          ) : (
            <GameButton
              tone="pink"
              onClick={() => addAiMission(reply.missionSuggestion!)}
              className="min-h-10 px-3 py-2"
            >
              <Plus className="h-4 w-4" /> Add to today
            </GameButton>
          )}
        </div>
      )}
      {related && (
        <div className="mt-3 rounded-xl border-2 border-ink bg-purple/10 p-3">
          <p className="vp-label text-ink">Related Lab lesson · Case #{related.id}</p>
          <p className="font-bold uppercase text-ink">
            {related.reveal.lessonTitle ?? related.reveal.headline}
          </p>
          <Link
            to="/lab/$caseId"
            params={{ caseId: related.id }}
            className="vp-label vp-press mt-2 inline-flex min-h-9 items-center gap-1 rounded-lg border-2 border-ink bg-surface px-2.5 text-ink"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Replay case
          </Link>
        </div>
      )}
      {reply.link !== "none" && (
        <Link
          to={linkTo[reply.link].to}
          className="vp-label vp-press mt-3 inline-flex min-h-10 items-center gap-1 rounded-lg border-2 border-ink bg-cyan px-3 text-ink"
        >
          {linkTo[reply.link].label} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
      {(reply.disclaimer || msg.caution) && (
        <p className="mt-3 rounded-lg border-2 border-ink bg-surface-2 p-2 text-xs text-ink">
          {reply.disclaimer ??
            "If this persists, is severe or feels unusual, please speak with a qualified healthcare professional."}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {follow.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onSend(f)}
            className="vp-label vp-press rounded-full border-2 border-ink bg-surface px-3 py-1.5 text-left text-ink"
          >
            {f}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onSend("Explain more about that.")}
          className="vp-label vp-press rounded-full border-2 border-dashed border-ink bg-surface-2 px-3 py-1.5 text-ink"
        >
          Explain more
        </button>
      </div>
      <details className="mt-3 text-xs text-muted-foreground">
        <summary className="vp-label cursor-pointer select-none text-ink">
          Why this view? <ChevronDown className="inline h-3 w-3" />
        </summary>
        <p className="mt-1">{route.reason}</p>
      </details>
    </article>
  );
}

export function PlainCard({ msg }: { msg: Extract<ChatMsg, { kind: "plain" }> }) {
  return (
    <article className="vp-card bg-surface p-4">
      <MayaLabel>
        <AgentChip id={msg.route.agent} />
      </MayaLabel>
      <p className="whitespace-pre-wrap text-sm text-ink">{msg.text}</p>
    </article>
  );
}

export function NoticeCard({ notice }: { notice: SafetyNotice | SpoilerNotice }) {
  const [hint, setHint] = useState(false);
  if (notice.tone === "urgent") {
    // Deliberately plain: no game chips, no XP, no playful styling.
    return (
      <article role="alert" className="rounded-2xl border-[3px] border-ink bg-surface p-4">
        <p className="flex items-center gap-2 text-xl font-bold uppercase text-ink">
          <ShieldAlert className="h-6 w-6" /> {notice.title}
        </p>
        <p className="mt-2 font-semibold text-ink">{notice.body}</p>
        <ul className="mt-2 space-y-1 text-sm text-ink">
          {notice.bullets.map((b, i) => (
            <li key={b} className="flex gap-2">
              {i === 0 ? <Phone className="mt-0.5 h-4 w-4 shrink-0" /> : <span aria-hidden>•</span>}
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </article>
    );
  }
  return (
    <article
      className={cn("vp-card p-4", notice.tone === "spoiler" ? "bg-surface" : "bg-surface-2")}
    >
      <MayaLabel>
        {notice.tone === "spoiler" ? (
          <AgentChip id="case" />
        ) : (
          <StatusChip tone="white" icon={<ShieldAlert className="h-3 w-3" />}>
            Safety first
          </StatusChip>
        )}
      </MayaLabel>
      <h3 className="text-lg font-bold uppercase text-ink">{notice.title}</h3>
      <p className="mt-1 text-sm text-ink">{notice.body}</p>
      {notice.bullets.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm text-ink">
          {notice.bullets.map((b) => (
            <li key={b}>• {b}</li>
          ))}
        </ul>
      )}
      {notice.tone === "spoiler" && (
        <div className="mt-3 flex flex-wrap gap-2">
          {hint ? (
            <p className="rounded-lg border-2 border-ink bg-yellow/40 p-2 text-sm text-ink">
              <BookOpen className="mr-1 inline h-4 w-4" />
              Hint: {notice.hint}
            </p>
          ) : (
            <GameButton tone="yellow" onClick={() => setHint(true)} className="min-h-10 px-3 py-2">
              Show a small hint
            </GameButton>
          )}
          <Link
            to="/lab/$caseId"
            params={{ caseId: notice.caseId }}
            className="vp-label vp-press inline-flex min-h-10 items-center gap-1 rounded-lg border-2 border-ink bg-cyan px-3 text-ink"
          >
            Open case <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </article>
  );
}

export function ErrorCard({
  msg,
  onRetry,
  onGuidance,
}: {
  msg: Extract<ChatMsg, { kind: "error" }>;
  onRetry: () => void;
  onGuidance: () => void;
}) {
  const billing = msg.status === 402 || msg.status === 403;
  return (
    <article role="status" className="vp-card border-dashed bg-surface p-4">
      <p className="flex items-center gap-2 text-lg font-bold uppercase text-ink">
        <WifiOff className="h-5 w-5" /> Coach connection lost
      </p>
      <p className="mt-1 text-sm text-ink">
        Your wellness data is safe. Try sending your message again.
      </p>
      {billing || msg.status === 500 ? (
        <p className="mt-1 text-xs text-muted-foreground">{msg.message}</p>
      ) : null}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <GameButton tone="yellow" onClick={onRetry} disabled={billing}>
          <RotateCcw className="h-4 w-4" /> Retry
        </GameButton>
        <GameButton tone="white" onClick={onGuidance}>
          Use quick guidance
        </GameButton>
      </div>
    </article>
  );
}

export function CrewCard({ id }: { id: AgentId }) {
  const a = agents[id];
  const Icon = agentIcons[id];
  return (
    <div className="vp-card flex items-center gap-3 bg-surface p-3">
      <span
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-xl border-[3px] border-ink",
          toneFill[a.tone],
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="font-bold uppercase text-ink">{a.name}</p>
        <p className="text-xs text-muted-foreground">{a.focus}</p>
      </div>
    </div>
  );
}
