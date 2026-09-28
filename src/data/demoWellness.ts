import type { Tone } from "@/types";

/** DEMO wellness values. Not sensor, wearable or live data. */
export const demoComponents = {
  movement: 82,
  sleep: 70,
  recovery: 72,
  fuel: 76,
};

export type DimensionKey = "move" | "sleep" | "fuel" | "recover";

export interface DimensionDetail {
  key: DimensionKey;
  label: string;
  score: number | null;
  tone: Tone;
  insight: string;
  rows: { label: string; value: string; pct?: number }[];
  tip: string;
}

export const demoDimensions: DimensionDetail[] = [
  {
    key: "move",
    label: "Move",
    score: demoComponents.movement,
    tone: "pink",
    insight: "Your daily movement has been consistent.",
    rows: [
      { label: "Steps", value: "7,850 / 8,000", pct: 98 },
      { label: "Active minutes", value: "34 min", pct: 76 },
      { label: "Movement breaks", value: "4 / 5", pct: 80 },
      { label: "Exercise", value: "1 session" },
    ],
    tip: "Only 150 steps left to reach today's movement target.",
  },
  {
    key: "sleep",
    label: "Sleep",
    score: demoComponents.sleep,
    tone: "purple",
    insight: "Bedtime has been drifting later this week.",
    rows: [
      { label: "Last night", value: "6h 40m / 8h", pct: 83 },
      { label: "Bedtime consistency", value: "3 / 7 nights", pct: 43 },
      { label: "Wind-down routine", value: "2 / 7 nights", pct: 29 },
    ],
    tip: "Try starting your wind-down 20 minutes earlier tonight.",
  },
  {
    key: "fuel",
    label: "Fuel",
    score: demoComponents.fuel,
    tone: "lime",
    insight: "Hydration habits are building nicely.",
    rows: [
      { label: "Water", value: "5 / 8 glasses", pct: 62 },
      { label: "Veg & fruit servings", value: "3 / 5", pct: 60 },
      { label: "Regular meal times", value: "Yes" },
    ],
    tip: "Three more glasses of water completes today's hydration habit.",
  },
  {
    key: "recover",
    label: "Recover",
    score: demoComponents.recovery,
    tone: "cyan",
    insight: "Rest days are there — energy check-ins are low.",
    rows: [
      { label: "Rest days this week", value: "2 / 2", pct: 100 },
      { label: "Self-reported energy", value: "6 / 10", pct: 60 },
      { label: "Calm breaks", value: "1 / 3", pct: 33 },
    ],
    tip: "A 5-minute breathing break is an easy recovery win today.",
  },
];

export interface WeeklyDay {
  day: string;
  move: number;
  sleep: number;
  fuel: number;
  recovery: number;
  consistency: number;
}

/** Fixed demo week — never randomly generated. */
export const demoWeekly: WeeklyDay[] = [
  { day: "MON", move: 72, sleep: 61, fuel: 70, recovery: 65, consistency: 75 },
  { day: "TUE", move: 78, sleep: 66, fuel: 72, recovery: 68, consistency: 100 },
  { day: "WED", move: 80, sleep: 58, fuel: 74, recovery: 70, consistency: 75 },
  { day: "THU", move: 74, sleep: 72, fuel: 69, recovery: 74, consistency: 100 },
  { day: "FRI", move: 85, sleep: 64, fuel: 78, recovery: 71, consistency: 100 },
  { day: "SAT", move: 88, sleep: 74, fuel: 73, recovery: 76, consistency: 75 },
  { day: "SUN", move: 82, sleep: 70, fuel: 76, recovery: 72, consistency: 100 },
];
