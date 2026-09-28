import { Link } from "@tanstack/react-router";
import { Award, Sparkles, Zap } from "lucide-react";
import type { HealthCase } from "@/types/cases";
import type { CaseScore } from "@/lib/cases/scoring";
import type { CaseReward } from "@/lib/game-state";
import { badges } from "@/data/mock";
import { skills } from "@/data/skills";
import { XPBar } from "@/components/vp/ui";

const confetti = ["bg-yellow", "bg-pink", "bg-cyan", "bg-lime"];

export function CaseResults({
  c,
  score,
  reward,
  firstClaim,
  best,
}: {
  c: HealthCase;
  score: CaseScore;
  reward: CaseReward | undefined;
  firstClaim: boolean;
  best?: number | undefined;
}) {
  const badge = badges.find((b) => b.id === c.badgeId);
  const skill = skills.find((s) => s.id === c.skillId);
  const rows: [string, number][] = [
    ["Clue accuracy", score.clueAccuracy],
    ["Intervention quality", score.interventionQuality],
    ["Evidence completion", score.evidenceCompletion],
    ["Reasoning", score.reasoning],
  ];
  return (
    <section className="space-y-4">
      <div className="vp-card vp-pop-lg vp-dots relative overflow-hidden bg-yellow p-6 text-center">
        {firstClaim
          ? Array.from({ length: 12 }).map((_, i) => (
              <span
                key={i}
                aria-hidden
                className={`animate-confetti absolute left-1/2 top-1/3 h-2.5 w-2.5 rounded-sm border border-ink ${confetti[i % 4]}`}
                style={{
                  ["--dx" as string]: `${Math.cos((i / 12) * Math.PI * 2) * 140}px`,
                  ["--dy" as string]: `${Math.sin((i / 12) * Math.PI * 2) * 110}px`,
                }}
              />
            ))
          : null}
        <p
          className="animate-pop-in text-5xl font-bold uppercase leading-none text-ink"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Case closed
        </p>
        <p className="vp-label mt-2 text-ink">
          Case #{c.id} · {c.title}
        </p>
        <p className="vp-label mt-4 text-muted-foreground">Case score</p>
        <p className="text-6xl font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
          {score.total}
          <span className="text-2xl"> / 100</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Game performance score{best !== undefined ? ` · Best score ${best}` : ""}
        </p>
        {firstClaim && reward ? (
          <p className="animate-xp-pulse mx-auto mt-4 inline-flex items-center gap-1 rounded-xl border-[3px] border-ink bg-ink px-4 py-2 text-2xl font-bold text-yellow">
            <Zap className="h-5 w-5 fill-current" /> +{reward.xp} XP
          </p>
        ) : reward ? (
          <p className="mx-auto mt-4 max-w-xs rounded-xl border-2 border-dashed border-ink bg-surface p-2 text-sm text-ink">
            Reward already claimed (+{reward.xp} XP, score {reward.score}). Replays are for
            practice.
          </p>
        ) : null}
      </div>

      <div className="vp-card space-y-3 p-4">
        {rows.map(([k, v]) => (
          <div key={k}>
            <div className="flex justify-between">
              <p className="vp-label text-ink">{k}</p>
              <p className="font-bold text-ink">{v}</p>
            </div>
            <XPBar value={v} tone="pink" size="sm" className="mt-1" />
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          40% clues · 35% plan · 15% evidence · 10% reasoning
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {badge ? (
          <div className="animate-pop-in vp-card flex items-center gap-3 p-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-[3px] border-ink bg-pink text-surface shadow-[3px_3px_0_0_var(--ink)]">
              <Award className="h-7 w-7" />
            </span>
            <div className="min-w-0">
              <p className="vp-label text-muted-foreground">
                {firstClaim
                  ? "Badge unlocked"
                  : reward
                    ? "Badge earned"
                    : "Case badge · sign in to earn"}
              </p>
              <p className="font-bold uppercase text-ink">{badge.name}</p>
              <p className="text-xs text-muted-foreground">{badge.description}</p>
            </div>
          </div>
        ) : null}
        {skill ? (
          <div className="animate-pop-in vp-card flex items-center gap-3 p-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border-[3px] border-ink bg-lime text-ink shadow-[3px_3px_0_0_var(--ink)]">
              <Sparkles className="h-7 w-7" />
            </span>
            <div className="min-w-0">
              <p className="vp-label text-muted-foreground">
                {firstClaim
                  ? "Skill unlocked"
                  : reward
                    ? "Skill earned"
                    : "Case skill · sign in to earn"}
              </p>
              <p className="font-bold uppercase text-ink">{skill.name}</p>
              <p className="text-xs text-muted-foreground">{skill.description}</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          to="/lab"
          className="vp-label vp-pop vp-press flex min-h-12 items-center justify-center rounded-xl border-[3px] border-ink bg-pink text-surface"
        >
          Back to case files
        </Link>
        <Link
          to="/"
          className="vp-label vp-pop vp-press flex min-h-12 items-center justify-center rounded-xl border-[3px] border-ink bg-surface text-ink"
        >
          Return home
        </Link>
      </div>
    </section>
  );
}
