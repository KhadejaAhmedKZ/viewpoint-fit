import type { DailyQuest, Mission } from "@/types";

/** DEMO missions. The UI renders cards from this list. */
export const demoMissions: Mission[] = [
  {
    id: "move-break",
    category: "move",
    title: "10-Minute Movement Break",
    description: "Take a short walk or movement break.",
    xp: 50,
    completed: false,
    progress: 0,
    target: 10,
  },
  {
    id: "hydration",
    category: "fuel",
    title: "Hydration Check",
    description: "Complete today's hydration habit.",
    xp: 30,
    completed: false,
    progress: 0,
    target: 8,
  },
  {
    id: "recovery-reset",
    category: "recover",
    title: "Recovery Reset",
    description: "Complete a short recovery activity.",
    xp: 40,
    completed: false,
    progress: 0,
    target: 1,
  },
  {
    id: "detective",
    category: "learn",
    title: "Health Detective",
    description: "Investigate one VIEW POINT LAB case.",
    xp: 100,
    completed: false,
    progress: 0,
    target: 1,
    route: "/lab",
  },
];

/** Stays incomplete until the future Pose system reports completion. */
export const demoDailyQuest: DailyQuest = {
  category: "move",
  title: "Move your body",
  description: "Complete one Pose Coach session.",
  xp: 100,
  cta: "Start quest",
  to: "/pose",
};
