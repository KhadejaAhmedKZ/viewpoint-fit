import type { Tone } from "@/types";
import type { CoachSnapshot } from "./context";
import { caseLesson } from "./context";

const DIMS = [
  { key: "movement", label: "Movement", tone: "cyan" },
  { key: "sleep", label: "Sleep", tone: "purple" },
  { key: "recovery", label: "Recovery", tone: "purple" },
  { key: "fuel", label: "Fuel", tone: "lime" },
] as const;

export interface TodaysView {
  headline: string;
  body: string;
  ask: string;
  tone: Tone;
}

/** Deterministic insight from current dashboard values — never a fixed conclusion. */
export function todaysView(s: CoachSnapshot): TodaysView | null {
  const vals = DIMS.map((d) => ({ ...d, v: s.components[d.key] })).filter(
    (d): d is typeof d & { v: number } => d.v !== null,
  );
  if (vals.length < 2) return null;
  const sorted = [...vals].sort((a, b) => a.v - b.v);
  const low = sorted[0]!;
  const high = sorted[sorted.length - 1]!;
  if (high.v - low.v < 5)
    return {
      headline: "Nicely balanced",
      body: `Your available areas are within a few points of each other (${low.v}–${high.v}).`,
      ask: "What should I focus on today?",
      tone: "lime",
    };
  return {
    headline: `${low.label} needs attention`,
    body: `Your ${low.label.toLowerCase()} score (${low.v}) is currently lower than your ${high.label.toLowerCase()} score (${high.v}).`,
    ask: `Why is my ${low.label.toLowerCase()} score lower than my ${high.label.toLowerCase()} score?`,
    tone: low.tone,
  };
}

export interface GuidanceCard {
  id: string;
  title: string;
  tone: Tone;
  lines: string[];
}

/** QUICK GUIDANCE — deterministic, clearly not an AI response. */
export function quickGuidance(s: CoachSnapshot): GuidanceCard[] {
  const c = s.components;
  const remaining = s.missions.filter((m) => !m.completed);
  const moveMission = remaining.find((m) => m.category === "move");
  const cards: GuidanceCard[] = [
    {
      id: "movement",
      title: "Movement",
      tone: "cyan",
      lines: [
        `Movement score: ${c.movement ?? "no data"}.`,
        moveMission
          ? `Next step: "${moveMission.title}" is still open.`
          : "Your movement mission is done — nice.",
        s.poseHistory.length
          ? `Recent saved Pose sessions: ${s.poseHistory.length}.`
          : "Try one Pose Coach session (Squat, Bicep Curl or Lunge).",
      ],
    },
    {
      id: "sleep",
      title: "Sleep",
      tone: "purple",
      lines: [
        `Sleep score: ${c.sleep ?? "no data"}.`,
        "A consistent bedtime and wake time supports daily energy.",
        "Try a short wind-down without screens before bed.",
      ],
    },
    {
      id: "recovery",
      title: "Recovery",
      tone: "purple",
      lines: [
        `Recovery score: ${c.recovery ?? "no data"}.`,
        "Rest days and lighter days help training feel sustainable.",
        "Plan one easy recovery activity today.",
      ],
    },
    {
      id: "fuel",
      title: "Fuel",
      tone: "lime",
      lines: [
        `Fuel score: ${c.fuel ?? "no data"}.`,
        "Regular, balanced meals and water through the day support steady energy.",
        "Keep a water bottle within reach.",
      ],
    },
  ];
  cards.push({
    id: "lab",
    title: "Lab lessons",
    tone: "pink",
    lines: s.solvedCases.length
      ? s.solvedCases.map((sc) => {
          const l = caseLesson(sc);
          return `#${l.id} ${l.title}: ${l.lessonTitle}.`;
        })
      : ["No cases solved yet — open VIEW POINT LAB to start Case #001."],
  });
  return cards;
}
