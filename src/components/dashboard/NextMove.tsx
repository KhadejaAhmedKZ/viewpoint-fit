import { ReflectionNote } from "./ReflectionNote";
import { Link } from "@tanstack/react-router";
import { useGame } from "@/lib/game-state";
import { useWellness } from "@/lib/wellness/wellness-state";
import { useFuel } from "@/lib/fuel/fuel-state";
import { nextMove, weeklyReflection, characterMilestones } from "@/lib/planning/nextMove";
import { GameButton } from "@/components/vp/ui";
export function NextMove() {
  const game = useGame(),
    w = useWellness(),
    fuel = useFuel();
  const plan = nextMove(
    w.input,
    fuel.meals.filter((m) => m.date === w.day),
  );
  const week = weeklyReflection(w.rows, w.day);
  const milestones = characterMilestones(
    game.solvedCases.length,
    game.poseHistory.length,
    game.earnedBadges.length,
  );
  return (
    <div className="space-y-5">
      <section className="vp-card vp-pop bg-cyan p-5">
        <p className="vp-label">Maya’s perspectives · {plan.agent}</p>
        <h2 className="mt-2 text-3xl font-bold uppercase">Your next move</h2>
        <p className="mt-2 font-bold">{plan.action.title}</p>
        <p>{plan.action.description}</p>
        <details className="mt-3">
          <summary className="cursor-pointer font-bold">Why this suggestion?</summary>
          <p className="mt-2 text-sm">
            {plan.reason} This is rule-based guidance from your logged habits, not a live AI
            assessment.
          </p>
        </details>
        <h3 className="mt-4 font-bold">Your next meal</h3>
        <p className="text-sm">{plan.meal}</p>
        {plan.active && (
          <p className="mt-2 text-sm">
            You logged an active day. Keep regular meals and notice hunger, thirst and recovery;
            step counts do not determine your calorie needs.
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <GameButton
            disabled={!!game.aiMission || !w.input}
            onClick={() => game.addAiMission(plan.action)}
          >
            {game.aiMission
              ? "Today’s bonus mission is already chosen"
              : w.input
                ? "Add as today’s mission"
                : "Check in to personalize"}
          </GameButton>
          <Link to="/lab/$caseId" params={{ caseId: plan.learn }} className="vp-label underline">
            Learn why in the Lab
          </Link>
          <Link to="/fuel" className="vp-label underline">
            Open Fuel + food camera
          </Link>
        </div>
      </section>
      <section className="vp-card bg-surface p-5">
        <p className="vp-label">Maya’s perspectives · Education</p>
        <h2 className="text-2xl font-bold uppercase">Your week, reflected</h2>
        <p className="mt-2">
          {week.days} of 7 days logged · {week.missing} days unknown.
        </p>
        {week.averageSteps !== null && (
          <p>
            Average reported steps: {week.averageSteps.toLocaleString()} across {week.stepsDays}{" "}
            days.
          </p>
        )}
        {week.sleepRange && (
          <p>
            Reported sleep range: {week.sleepRange} across {week.sleepDays} days.
          </p>
        )}
        <p className="mt-3 text-sm">
          {week.days < 3
            ? "Log a few more days before looking for patterns."
            : "These are observations from available entries, not causes or health predictions."}
        </p>
        <details className="mt-3">
          <summary className="cursor-pointer font-bold">Reflect for a moment</summary>
          <p className="mt-2">
            Which habit felt sustainable this week? What would make it easier next week? A missed
            day is information, not a failure.
          </p>
          <ReflectionNote />
        </details>
      </section>
      <section className="vp-card bg-yellow p-5">
        <h2 className="text-2xl font-bold uppercase">Character milestones</h2>
        <p className="text-sm">Permanent learning milestones. No lost rewards for missing a day.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {milestones.map((m) => (
            <div key={m.name} className="rounded-xl border-2 border-ink bg-surface p-3">
              <span
                className="mr-2 inline-block h-3 w-3 rounded-full"
                style={{ background: m.color }}
              />
              <strong>
                {m.name} {m.unlocked ? "✓" : "· Locked"}
              </strong>
              <p className="text-sm">{m.requirement}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
