import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  BarChart3,
  Dumbbell,
  Flame,
  Search,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { AchievementBadge } from "@/components/vp/AchievementBadge";
import { AppLayout } from "@/components/vp/AppLayout";
import { AvatarFigure } from "@/components/vp/AvatarCard";
import { SafetyNotice } from "@/components/vp/SafetyNotice";
import { statIcons } from "@/components/vp/icons";
import { DemoTag, EmptyState, GameCard, SectionHeader, XPBar, toneFill } from "@/components/vp/ui";
import { exerciseList } from "@/lib/pose/exercises";
import { badges, demoUser, detectiveRank, emptyStates, wellnessStats } from "@/data/mock";
import { cn } from "@/lib/utils";
import { useGame } from "@/lib/game-state";
import { WellnessHistory } from "@/components/dashboard/WellnessHistory";
import { SkillsSection } from "@/components/vp/SkillsSection";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({
    meta: [
      { title: "Your Journey — VIEW POINT FIT" },
      {
        name: "description",
        content: "Your player card, wellness journey, detective progress and collectible badges.",
      },
      { property: "og:title", content: "Your Journey — VIEW POINT FIT" },
      { property: "og:description", content: "Levels, XP, streaks and achievements." },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const { xp, levelInfo, streak, earnedBadges, solvedCases, poseHistory } = useGame();
  const doneEx = exerciseList.filter((e) => poseHistory.some((s) => s.exercise === e.id));
  const u = {
    ...demoUser,
    level: levelInfo.level,
    levelTitle: levelInfo.title,
    xp: levelInfo.xpIntoLevel,
    xpToNextLevel: levelInfo.xpForLevel ?? levelInfo.xpIntoLevel,
    streak,
  };
  const myBadges = badges.map((b) => ({ ...b, earned: earnedBadges.includes(b.id) }));
  const anyEarned = myBadges.some((b) => b.earned);
  return (
    <AppLayout title="Your Journey" subtitle="Player profile">
      <section className="vp-card vp-pop-lg vp-dots overflow-hidden bg-yellow p-5">
        <div className="flex items-center gap-4">
          <AvatarFigure size={96} />
          <div className="min-w-0 flex-1">
            <p className="vp-label text-ink">Level {u.level}</p>
            <p
              className="truncate text-2xl font-bold uppercase text-ink"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {u.levelTitle}
            </p>
            <XPBar value={u.xp} max={u.xpToNextLevel} tone="pink" size="lg" className="mt-3" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { icon: Star, k: "Level", v: String(u.level) },
            { icon: Zap, k: "Total XP", v: String(xp) },
            { icon: Flame, k: "Streak", v: `${u.streak} days` },
          ].map(({ icon: Icon, k, v }) => (
            <div
              key={k}
              className="rounded-xl border-[3px] border-ink bg-surface p-2 text-center text-ink"
            >
              <Icon className="mx-auto h-4 w-4" />
              <p className="vp-label mt-1 text-[0.58rem] text-muted-foreground">{k}</p>
              <p className="truncate text-sm font-bold">{v}</p>
            </div>
          ))}
        </div>
      </section>

      <WellnessHistory inspect />

      <section>
        <SectionHeader
          kicker="Lab"
          title="Health Detective"
          icon={<Search className="h-4 w-4" />}
        />
        <p className="vp-label mb-3 text-ink">
          Cases solved: {solvedCases.length} / {detectiveRank.totalCases}
        </p>
        {solvedCases.length === 0 ? (
          <EmptyState
            icon={<Search className="h-6 w-6" />}
            title={emptyStates.cases.title}
            body={`${emptyStates.cases.body} Cases solved: 0 / ${detectiveRank.totalCases}.`}
            action={
              <Link
                to="/lab/$caseId"
                params={{ caseId: "001" }}
                className="vp-label vp-pop vp-press inline-flex min-h-12 items-center gap-2 rounded-xl border-[3px] border-ink bg-pink px-4 text-surface"
              >
                {emptyStates.cases.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
        ) : null}
      </section>

      <section>
        <SectionHeader
          kicker="Movement"
          title="Pose Coach"
          icon={<Dumbbell className="h-4 w-4" />}
        />
        <GameCard>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["Sessions completed", String(poseHistory.length)],
              ["Exercises completed", `${doneEx.length} / 3`],
            ].map(([k, v]) => (
              <div
                key={k}
                className="rounded-xl border-[3px] border-ink bg-surface-2 p-2 text-center"
              >
                <p className="vp-label text-[0.6rem] text-muted-foreground">{k}</p>
                <p className="text-xl font-bold text-ink">{v}</p>
              </div>
            ))}
          </div>
          <ul className="mt-3 grid grid-cols-3 gap-2 text-center">
            {exerciseList.map((e) => (
              <li
                key={e.id}
                className={cn(
                  "vp-label rounded-lg border-2 border-ink p-2 text-ink",
                  doneEx.includes(e) ? "bg-lime" : "bg-surface",
                )}
              >
                {e.name} {doneEx.includes(e) ? "✓" : "—"}
              </li>
            ))}
          </ul>
        </GameCard>
      </section>

      <section>
        <SectionHeader kicker="Skill tree" title="Skills" icon={<Sparkles className="h-4 w-4" />} />
        <SkillsSection />
      </section>

      <section>
        <SectionHeader
          kicker="Collection"
          title="Achievements"
          icon={<Award className="h-4 w-4" />}
        />
        <GameCard>
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
            {myBadges.map((b) => (
              <AchievementBadge key={b.id} badge={b} />
            ))}
          </div>
          {!anyEarned ? (
            <p className="vp-label mt-5 text-center text-muted-foreground">
              {emptyStates.badges.title} — {emptyStates.badges.body}
            </p>
          ) : null}
        </GameCard>
      </section>

      <SafetyNotice />
    </AppLayout>
  );
}
