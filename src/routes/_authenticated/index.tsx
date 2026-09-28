import { NextMove } from "@/components/dashboard/NextMove";
import { PlayerCharacter } from "@/components/characters/PlayerCharacter";
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Swords } from "lucide-react";
import { AppLayout } from "@/components/vp/AppLayout";
import { MissionCard } from "@/components/vp/MissionCard";
import { SafetyNotice } from "@/components/vp/SafetyNotice";
import { SectionHeader, StatusChip, XPTag } from "@/components/vp/ui";
import { ViewScoreCard } from "@/components/dashboard/ViewScoreCard";
import { WellnessStatCard } from "@/components/dashboard/WellnessStatCard";
import { DailyQuest } from "@/components/dashboard/DailyQuest";
import { ProgressStrip } from "@/components/dashboard/ProgressStrip";
import { WeeklyInsight, WeeklyProgress } from "@/components/dashboard/WeeklyProgress";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { demoComponents, demoDimensions, demoWeekly } from "@/data/demoWellness";
import { demoDailyQuest } from "@/data/demoMissions";
import { useGame } from "@/lib/game-state";
import { calculateViewScore, getViewScoreStatus } from "@/lib/wellnessScore";
import { useWellness } from "@/lib/wellness/wellness-state";
import { DailyCheckIn, checkButton } from "@/components/dashboard/DailyCheckIn";
import { WellnessHistory } from "@/components/dashboard/WellnessHistory";
import { dimensionsFor } from "@/lib/wellness/presentation";
import { dailyInsight, dataUsed, suggestMission, viewLabel } from "@/lib/wellness/checkin";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "My Fit — VIEW POINT FIT Wellness Game" },
      {
        name: "description",
        content:
          "Your View Score, daily quest, missions, XP, streak and weekly wellness progress in one game dashboard.",
      },
      { property: "og:title", content: "My Fit — VIEW POINT FIT Wellness Game" },
      {
        property: "og:description",
        content:
          "See how you're doing today and what to do next — missions, XP and your daily quest.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function useGreeting() {
  const [greeting, setGreeting] = useState("Hello");
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
  }, []);
  return greeting;
}

function Dashboard() {
  const greeting = useGreeting();
  const {
    profile,
    missions,
    consistency,
    completeMission,
    aiMission,
    completeAiMission,
    addAiMission,
  } = useGame();
  const [openStat, setOpenStat] = useState<string | null>(null);

  const w = useWellness();
  const [sample, setSample] = useState(false);
  const showSample = sample && !w.input;
  const score = showSample
    ? calculateViewScore({ ...demoComponents, consistency: 100 })
    : w.scores.view;
  const dimensions = showSample ? demoDimensions : dimensionsFor(w.input, w.scores);
  const insight = dailyInsight(w.scores, w.coverage.level);
  const suggestion = suggestMission(w.input, w.scores);
  const done = missions.filter((m) => m.completed).length;

  return (
    <AppLayout
      kicker={`${greeting}, ${profile?.displayName || "Explorer"}`}
      title="How's your view today?"
    >
      <PlayerCharacter />
      <DailyCheckIn />
      <NextMove />
      {!w.input && (
        <button className={checkButton} onClick={() => setSample((v) => !v)}>
          {showSample ? "Return to my view" : "Preview sample wellness data"}
        </button>
      )}
      {showSample && (
        <p className="vp-label">
          Sample wellness data — not your check-in. Missions below are your actual progress.
        </p>
      )}

      <ViewScoreCard
        score={score}
        status={showSample ? getViewScoreStatus(score) : viewLabel(score, w.coverage.level)}
        coverage={showSample ? { percent: 100, label: "Sample coverage" } : w.coverage}
        consistency={showSample ? 100 : consistency}
        dimensions={dimensions}
        sample={showSample}
        details={
          <details className="mt-4 rounded-xl border-2 border-ink bg-surface p-3">
            <summary className="vp-label cursor-pointer">How your VIEW was built</summary>
            <p className="mt-2 text-sm">
              Prototype wellness scoring heuristic. Available inputs are combined within each
              dimension; missing dimensions are excluded and weights renormalized.
            </p>
            <p className="mt-2 text-sm">
              Move: steps 50, active minutes 35, intentional movement 15. Sleep: duration 55,
              quality 25, schedule 20. Fuel: balance 45, water 30, regularity 25. Recover: feeling
              45, breaks 25, activity context 20, energy/stress 10. Contributions are capped; these
              are not medical targets.
            </p>
            <p className="vp-label mt-3">
              Data used · {showSample ? "Sample data" : "Self-reported + VIEW POINT FIT missions"}
            </p>
            {!showSample && (
              <ul className="mt-2 grid grid-cols-2 gap-1 text-xs">
                {dataUsed(w.input, missions.length > 0).map((i) => (
                  <li key={i.key}>
                    {i.used ? "✓" : "—"} {i.label}
                  </li>
                ))}
              </ul>
            )}
          </details>
        }
      />

      <Link to="/fuel" className="vp-card vp-pop block bg-lime p-4">
        <span className="vp-label">Fuel log</span>
        <p className="mt-1 font-bold">Log a meal. Learn what makes your plate work.</p>
      </Link>
      <DailyQuest quest={demoDailyQuest} />

      <section>
        <SectionHeader
          kicker={`Quest log · ${done}/${missions.length} done`}
          title="Today's Missions"
          icon={<Swords className="h-4 w-4" />}
          action={<XPTag xp={missions.reduce((a, m) => a + m.xp, 0)} />}
        />
        <div className="grid gap-3 md:grid-cols-2">
          {missions.map((m) => (
            <MissionCard key={m.id} mission={m} onComplete={completeMission} />
          ))}
          {aiMission ? (
            <div className="relative">
              <StatusChip tone="purple" className="absolute -top-2 left-3 z-10">
                AI mission
              </StatusChip>
              <MissionCard mission={aiMission} onComplete={completeAiMission} />
            </div>
          ) : null}
        </div>
      </section>

      <ProgressStrip />

      <section>
        <SectionHeader
          kicker="Tap a card for details"
          title="Wellness Stats"
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {dimensions.map((d) => (
            <WellnessStatCard
              key={d.key}
              d={d}
              sample={showSample}
              open={openStat === d.key}
              onToggle={() => setOpenStat((o) => (o === d.key ? null : d.key))}
            />
          ))}
        </div>
      </section>

      {!showSample && (
        <section className="vp-card vp-pop bg-cyan p-4">
          <h2 className="text-xl font-bold">{insight.headline}</h2>
          <p>{insight.body}</p>
          <Link to="/coach" className="vp-label mt-3 inline-block underline">
            Ask Maya about my view
          </Link>
          {suggestion && !aiMission && (
            <div className="mt-4">
              <p>{suggestion.title}</p>
              <button className={checkButton} onClick={() => addAiMission(suggestion)}>
                Add bonus mission
              </button>
            </div>
          )}
          {suggestion && aiMission && (
            <p className="mt-3 text-sm">Your bonus mission slot is already in use today.</p>
          )}
        </section>
      )}
      {showSample ? (
        <>
          <WeeklyProgress week={demoWeekly} />
          <WeeklyInsight week={demoWeekly} />
        </>
      ) : (
        <WellnessHistory />
      )}
      <QuickActions />
      <SafetyNotice />
    </AppLayout>
  );
}
