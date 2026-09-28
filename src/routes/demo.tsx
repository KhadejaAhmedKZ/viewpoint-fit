import { FoodCamera } from "@/components/fuel/FoodCamera";
import { nextMove } from "@/lib/planning/nextMove";
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Character3D } from "@/components/characters/Character3D";
import { DemoGameProvider } from "@/lib/game-state";
import { CaseEngine } from "@/components/lab/CaseEngine";
import { PoseCoach } from "@/components/pose/PoseCoach";
import { playableCases } from "@/data/cases";
import { demoMissions } from "@/data/demoMissions";
import { calculateDayScores, emptyCheckIn } from "@/lib/wellness/checkin";
import { quickGuidance } from "@/lib/coach/guidance";
import { classifySafety, safetyNotice } from "@/lib/coach/safety";
import { routeIntent } from "@/lib/coach/router";
import { getLevelInfo } from "@/lib/xp";
import { GameButton } from "@/components/vp/ui";

export const Route = createFileRoute("/demo")({
  component: DemoPage,
  head: () => ({ meta: [{ title: "Try VIEW POINT FIT — no account needed" }] }),
});
const tabs = ["My Fit", "Pose", "Coach", "Lab", "Fuel"] as const;
function DemoPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("My Fit");
  const [caseId, setCaseId] = useState("001");
  const [reset, setReset] = useState(0);
  const [steps, setSteps] = useState(6400),
    [sleep, setSleep] = useState(7);
  const [question, setQuestion] = useState(""),
    [asked, setAsked] = useState("");
  const input = {
    ...emptyCheckIn,
    steps,
    sleepMinutes: sleep * 60,
    mealBalance: 3,
    waterLiters: 2,
    recoveryFeeling: 3,
    breakFrequency: 2,
  };
  const plan = nextMove(input);
  const scores = calculateDayScores(input, demoMissions);
  const level = getLevelInfo(0);
  const snapshot = {
    components: scores,
    viewScore: scores.view,
    level: level.level,
    levelTitle: level.title,
    xp: 0,
    streak: 0,
    missions: demoMissions,
    dailyQuestDone: false,
    poseHistory: [],
    solvedCases: [],
    skills: [],
    badges: [],
  };
  const safety = classifySafety(asked);
  const notice = safetyNotice(safety.category, asked);
  const route = routeIntent(asked, null);
  const cards = quickGuidance(snapshot);
  return (
    <main className="vp-dots min-h-screen bg-background px-4 py-6 text-ink">
      <div className="mx-auto max-w-4xl space-y-5">
        <header className="vp-card vp-pop-lg bg-yellow p-5">
          <p className="vp-label">Preventive wellness + health education</p>
          <h1 className="mt-2 text-4xl font-bold uppercase sm:text-5xl">VIEW POINT FIT</h1>
          <p className="mt-2 font-bold">See your health from every angle.</p>
          <p className="mt-3 text-sm">
            Interactive demo · sample wellness data · no account needed. Case scores and camera
            detection are real. Demo activity earns no account XP and resets when you leave.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to="/auth"
              className="vp-label rounded-xl border-[3px] border-ink bg-surface px-4 py-3"
            >
              Sign in to save progress
            </Link>
            <GameButton
              tone="white"
              onClick={() => {
                setReset((v) => v + 1);
                setSteps(6400);
                setSleep(7);
                setAsked("");
                setTab("My Fit");
              }}
            >
              Reset demo
            </GameButton>
          </div>
        </header>
        <nav aria-label="Demo sections" className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              aria-current={tab === t ? "page" : undefined}
              className={`vp-label min-h-12 rounded-xl border-[3px] border-ink ${tab === t ? "bg-pink text-white" : "bg-surface"}`}
            >
              {t}
            </button>
          ))}
        </nav>
        <DemoGameProvider key={reset}>
          {tab === "My Fit" && (
            <section className="vp-card bg-cyan p-5">
              <p className="vp-label">Sample plan · {plan.agent} perspective</p>
              <h2 className="text-2xl font-bold uppercase">Your next move</h2>
              <p className="font-bold">{plan.action.title}</p>
              <p>{plan.action.description}</p>
              <details className="mt-2">
                <summary>Why this suggestion?</summary>
                <p>{plan.reason} Rule-based demo guidance.</p>
              </details>
              <p className="mt-3">{plan.meal}</p>
            </section>
          )}
          {tab === "My Fit" && (
            <>
              <section className="vp-card grid items-center gap-4 bg-surface p-5 sm:grid-cols-2">
                <Character3D motion="greeting" />
                <div>
                  <p className="vp-label">Your View</p>
                  <h2 className="text-3xl font-bold uppercase">How’s your view today?</h2>
                  <p className="mt-3 text-6xl font-bold">
                    {scores.view ?? "—"}
                    <span className="text-xl"> / 100</span>
                  </p>
                  <p className="text-sm">
                    Sample VIEW Score · educational heuristic, not a medical assessment.
                  </p>
                </div>
              </section>
              <section className="vp-card space-y-4 bg-surface p-5">
                <h2 className="text-2xl font-bold uppercase">Change the sample day</h2>
                <p className="text-sm">
                  The same scoring engine powers your saved five-part daily check-in.
                </p>
                <label className="block font-bold">
                  Steps: {steps.toLocaleString()}
                  <input
                    aria-label="Sample steps"
                    type="range"
                    min="0"
                    max="15000"
                    step="100"
                    value={steps}
                    onChange={(e) => setSteps(Number(e.target.value))}
                    className="mt-2 block w-full"
                  />
                </label>
                <label className="block font-bold">
                  Sleep: {sleep} hours
                  <input
                    aria-label="Sample sleep"
                    type="range"
                    min="0"
                    max="12"
                    step="0.25"
                    value={sleep}
                    onChange={(e) => setSleep(Number(e.target.value))}
                    className="mt-2 block w-full"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(
                    [
                      ["Move", scores.movement],
                      ["Sleep", scores.sleep],
                      ["Fuel", scores.fuel],
                      ["Recover", scores.recovery],
                    ] as const
                  ).map(([name, value]) => (
                    <div className="rounded-xl border-2 border-ink bg-yellow p-3" key={name}>
                      <p className="vp-label">{name}</p>
                      <p className="text-2xl font-bold">{value ?? "—"}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm">
                  Incomplete information is left unknown. Movement uses reported steps; sleep uses
                  reported duration. Fuel and recovery use this demo’s sample answers.
                </p>
              </section>
              <section className="vp-card bg-cyan p-5">
                <h2 className="text-2xl font-bold uppercase">
                  See → Understand → Learn → Act → Improve
                </h2>
                <p className="mt-2">
                  Explore real camera coaching, Maya’s educational guidance, and three fictional
                  detective cases. Sign in for check-ins, meal logging, missions, achievements, and
                  persistent progress.
                </p>
              </section>
            </>
          )}
          {tab === "Fuel" && <FoodCamera />}
          {tab === "Pose" && <PoseCoach />}
          {tab === "Lab" && (
            <>
              <div className="grid gap-2 sm:grid-cols-3">
                {Object.values(playableCases).map((c) => (
                  <GameButton
                    key={c.id}
                    tone={caseId === c.id ? "yellow" : "white"}
                    onClick={() => setCaseId(c.id)}
                  >
                    Case #{c.id} · {c.difficulty}
                  </GameButton>
                ))}
              </div>
              <CaseEngine key={caseId} c={playableCases[caseId]!} />
            </>
          )}
          {tab === "Coach" && (
            <section className="vp-card space-y-4 bg-surface p-5">
              <Character3D character="maya" motion="greeting" portrait height={230} />
              <h2 className="text-3xl font-bold uppercase">Coach Maya · Your wellness crew</h2>
              <p className="rounded-xl border-2 border-ink bg-cyan p-3 text-sm">
                Quick guidance · deterministic educational fallback. This demo does not call a live
                AI model.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setAsked(question);
                }}
                className="flex flex-wrap gap-2"
              >
                <label className="min-w-0 flex-1">
                  <span className="sr-only">Your wellness question</span>
                  <input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    maxLength={1000}
                    required
                    placeholder="Ask about sleep, movement, or food"
                    className="min-h-12 w-full rounded-xl border-2 border-ink px-3"
                  />
                </label>
                <GameButton type="submit" tone="pink">
                  Ask Maya
                </GameButton>
              </form>
              {asked &&
                (notice ? (
                  <div role="alert" className="rounded-xl border-[3px] border-ink p-4">
                    <h3 className="text-xl font-bold">{notice.title}</h3>
                    <p>{notice.body}</p>
                    {notice.bullets.map((b) => (
                      <p key={b} className="mt-2">
                        {b}
                      </p>
                    ))}
                  </div>
                ) : safety.level !== "wellness" ? (
                  <p role="alert">
                    For persistent or concerning symptoms, seek guidance from a qualified healthcare
                    professional. This app cannot assess their cause.
                  </p>
                ) : (
                  <>
                    <p className="vp-label">{route.agent} perspective</p>
                    <details>
                      <summary>Why this view?</summary>
                      <p className="text-sm">{route.reason}</p>
                    </details>
                    {route.agent === "case" ? (
                      <p>
                        Investigate the case evidence and look for patterns before choosing a
                        theory. Unsolved case answers stay hidden.
                      </p>
                    ) : (
                      cards
                        .filter(
                          (c) =>
                            route.agent === "wellness" ||
                            route.agent === "education" ||
                            c.id ===
                              (route.contextAgent === "nutrition" ? "fuel" : route.contextAgent) ||
                            (route.contextAgent === "recovery" && c.id === "sleep"),
                        )
                        .map((c) => (
                          <article key={c.id} className="rounded-xl border-2 border-ink p-4">
                            <h3 className="font-bold">{c.title}</h3>
                            {c.lines.map((l) => (
                              <p className="mt-2 text-sm" key={l}>
                                {l}
                              </p>
                            ))}
                          </article>
                        ))
                    )}
                  </>
                ))}
            </section>
          )}
        </DemoGameProvider>
        <footer className="pb-8 text-center text-xs">
          Fictional Lab scenarios. Local camera processing. No raw camera video stored. Wellness
          education, not diagnosis or treatment.
        </footer>
      </div>
    </main>
  );
}
