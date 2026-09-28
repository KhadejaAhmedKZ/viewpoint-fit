import { createFileRoute } from "@tanstack/react-router";
import { FolderSearch, Search, ShieldCheck } from "lucide-react";
import { AppLayout } from "@/components/vp/AppLayout";
import { CaseCard } from "@/components/vp/CaseCard";
import { SafetyNotice } from "@/components/vp/SafetyNotice";
import { Deco, SectionHeader, Sticker, XPBar } from "@/components/vp/ui";
import { cases, detectiveRank } from "@/data/mock";
import { getPlayableCase } from "@/data/cases";
import { badges } from "@/data/mock";
import { useGame } from "@/lib/game-state";

export const Route = createFileRoute("/_authenticated/lab/")({
  head: () => ({
    meta: [
      { title: "VIEW POINT LAB — Health Detective" },
      {
        name: "description",
        content:
          "Choose your case: investigate fictional lifestyle mysteries about sleep, movement, stress and recovery.",
      },
      { property: "og:title", content: "VIEW POINT LAB — Health Detective" },
      { property: "og:description", content: "Three detective dossiers. Crack the case, earn XP." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LabPage,
});

function LabPage() {
  const { solvedCases, caseRewards, bestScores } = useGame();
  const solved = solvedCases.length;
  const r = {
    ...detectiveRank,
    casesSolved: solved,
    xp: Object.values(caseRewards).reduce((a, x) => a + x.xp, 0),
    title:
      solved >= 3
        ? "Pattern Master"
        : solved >= 2
          ? "Movement Investigator"
          : solved > 0
            ? "Lifestyle Detective"
            : detectiveRank.title,
    nextRank:
      solved >= 3
        ? "Max rank"
        : solved >= 2
          ? "Pattern Master"
          : solved > 0
            ? "Movement Investigator"
            : detectiveRank.nextRank,
  };
  const list = cases.map((c) => {
    const locked = !!c.requiresCaseId && !solvedCases.includes(c.requiresCaseId);
    const soon = !locked && !getPlayableCase(c.id);
    const pc = getPlayableCase(c.id);
    const reward = caseRewards[c.id];
    const closed = reward
      ? {
          best: bestScores[c.id] ?? reward.score,
          xp: reward.xp,
          badge: badges.find((b) => b.id === pc?.badgeId)?.name,
        }
      : undefined;
    return { ...c, locked, soon, closed };
  });
  return (
    <AppLayout title="VIEW POINT LAB" subtitle="Health Detective">
      <section className="vp-card vp-pop-lg vp-grid relative overflow-hidden bg-purple p-5 text-surface">
        <Deco kind="bolt" className="right-5 top-5 text-yellow" />
        <Sticker tone="yellow" rotate={-3}>
          <ShieldCheck className="h-3 w-3" /> Detective Rank
        </Sticker>
        <p
          className="mt-3 text-2xl font-bold uppercase leading-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {r.title}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            ["Solved", `${r.casesSolved} / ${r.totalCases}`],
            ["XP", String(r.xp)],
            ["Next", r.nextRank],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border-[3px] border-ink bg-surface p-2 text-ink">
              <p className="vp-label text-[0.58rem] text-muted-foreground">{k}</p>
              <p className="truncate text-sm font-bold">{v}</p>
            </div>
          ))}
        </div>
        <XPBar value={r.casesSolved} max={r.totalCases} tone="yellow" className="mt-4" />
      </section>

      {solved >= 3 ? (
        <section className="vp-card vp-pop-lg animate-pop-in bg-yellow p-5 text-ink">
          <p className="vp-label text-pink">Foundation cases complete</p>
          <p className="text-4xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            3 / 3
          </p>
          <ol className="mt-3 space-y-2">
            {[
              ["#001", "Guided Investigation", "Look beyond the gym."],
              ["#002", "Pattern Investigation", "Look across the week."],
              ["#003", "Systems Investigation", "Look beyond the averages."],
            ].map(([id, mode, lesson]) => (
              <li key={id} className="rounded-xl border-[3px] border-ink bg-surface p-3">
                <p className="vp-label">
                  Case {id} · ✓ {mode}
                </p>
                <p className="font-bold">{lesson}</p>
              </li>
            ))}
          </ol>
          <p className="vp-label mt-3">Detective rank: Pattern Master</p>
          <p className="text-xs text-muted-foreground">Game rank only — not medical expertise.</p>
        </section>
      ) : null}

      <section>
        <SectionHeader
          kicker="Case files"
          title="Choose your case"
          icon={<FolderSearch className="h-4 w-4" />}
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <CaseCard key={c.id} item={c} soon={c.soon} closed={c.closed} />
          ))}
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Search className="h-3.5 w-3.5" /> Every character is fictional.
        </p>
      </section>

      <SafetyNotice />
    </AppLayout>
  );
}
