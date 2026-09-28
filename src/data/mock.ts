/**
 * CENTRALIZED DEMO DATA — VIEW POINT FIT
 *
 * Every placeholder value in the UI comes from this file. Nothing here is live,
 * sensor, or wearable data. When real data sources arrive, replace this module.
 */
import type {
  Badge,
  CaseSummary,
  CoachAgent,
  DailyQuest,
  DemoUser,
  DetectiveRank,
  PoseExercise,
  WellnessStat,
} from "@/types";

export const IS_DEMO_DATA = true;

export const appMeta = {
  name: "VIEW POINT FIT",
  tagline: "See your health from every angle.",
  hudTagline: "See health from every angle",
  philosophy: ["SEE", "UNDERSTAND", "LEARN", "ACT", "IMPROVE"],
};

export const safetyNotice = {
  title: "Wellness, not diagnosis",
  body: "VIEW POINT FIT provides preventive wellness education and movement guidance. It does not diagnose or treat medical conditions.",
};

export const demoUser: DemoUser = {
  displayName: "Player One",
  wellnessGoal: "Build consistent daily energy",
  preferredActivities: ["Walking", "Strength", "Mobility"],
  language: "English",
  level: 1,
  levelTitle: "Rookie Explorer",
  xp: 0,
  xpToNextLevel: 500,
  streak: 0,
  casesSolved: 0,
};

/** Non-clinical wellness engagement score. */
export const viewScore = {
  value: 78,
  max: 100,
  label: "View Score",
  caption: "Your wellness habits are moving in the right direction.",
  note: "Non-clinical wellness engagement score.",
};

export const wellnessStats: WellnessStat[] = [
  {
    id: "move",
    label: "Move",
    score: 82,
    status: "On track",
    trend: 6,
    tone: "pink",
    detail: "6.4k steps · 32 active min",
  },
  {
    id: "sleep",
    label: "Sleep",
    score: 64,
    status: "Needs focus",
    trend: -4,
    tone: "purple",
    detail: "6.4h avg · bedtime drifting",
  },
  {
    id: "fuel",
    label: "Fuel",
    score: 71,
    status: "Steady",
    trend: 2,
    tone: "lime",
    detail: "5 / 8 glasses · 3 veg servings",
  },
  {
    id: "recover",
    label: "Recover",
    score: 76,
    status: "Good",
    trend: 3,
    tone: "cyan",
    detail: "Readiness 71% · stress moderate",
  },
];

export const dailyQuest: DailyQuest = {
  category: "move",
  title: "Move your body",
  description: "Complete one Pose Coach session.",
  xp: 100,
  cta: "Start quest",
  to: "/pose",
};

export const cases: CaseSummary[] = [
  {
    id: "001",
    caseNumber: 1,
    title: "The Energy Crash",
    characterName: "Khalid",
    characterAge: 32,
    difficulty: "easy",
    themes: ["Sleep", "Movement", "Recovery", "Nutrition"],
    story: "Why am I always tired even though I go to the gym?",
    mission: "Investigate his lifestyle",
    maxXp: 350,
    locked: false,
  },
  {
    id: "002",
    caseNumber: 2,
    title: "The Weekend Warrior",
    characterName: "Sara",
    characterAge: 27,
    difficulty: "medium",
    themes: ["Movement", "Sedentary Behavior", "Consistency", "Recovery"],
    story: "Why isn't my weekend exercise making me feel fitter?",
    mission: "Map her weekly rhythm",
    maxXp: 400,
    locked: true,
    unlockRequirement: "Solve Case #001",
    requiresCaseId: "001",
  },
  {
    id: "003",
    caseNumber: 3,
    title: "Everything Looks Healthy",
    characterName: "Omar",
    characterAge: 40,
    difficulty: "hard",
    themes: ["Sleep Patterns", "Stress", "Training", "Recovery"],
    story: "Everything looks healthy… so what are we missing?",
    mission: "Look beyond the averages",
    maxXp: 500,
    locked: true,
    unlockRequirement: "Solve Case #002",
    requiresCaseId: "002",
  },
];

export const detectiveRank: DetectiveRank = {
  title: "Rookie Investigator",
  casesSolved: 0,
  totalCases: 3,
  xp: 0,
  nextRank: "Lifestyle Detective",
};

export const coachGuide = {
  name: "Coach Maya",
  role: "VIEW POINT AI Guide",
  welcome: "Hey! 👋 I'm Maya. I'm here to help you understand your wellness from every angle.",
  suggestions: ["Why do I feel tired?", "Plan a 10-min walk", "Explain recovery"],
};

export const coachAgents: CoachAgent[] = [
  {
    id: "movement",
    category: "Movement",
    name: "Movement Coach",
    specialty: "Form & progression",
    description: "Guides exercise choice, progression and movement quality.",
    icon: "move",
    tone: "pink",
  },
  {
    id: "nutrition",
    category: "Nutrition",
    name: "Fuel Guide",
    specialty: "Everyday eating",
    description: "Supports food habits, hydration and meal rhythm.",
    icon: "fuel",
    tone: "lime",
  },
  {
    id: "recovery",
    category: "Recovery",
    name: "Recovery Coach",
    specialty: "Rest & load",
    description: "Looks at sleep, stress signals and recovery balance.",
    icon: "recover",
    tone: "purple",
  },
  {
    id: "wellness",
    category: "Wellness",
    name: "Wellness Guide",
    specialty: "Daily routine",
    description: "Connects habits across your week into one picture.",
    icon: "wellness",
    tone: "yellow",
  },
  {
    id: "education",
    category: "Education",
    name: "Learn Coach",
    specialty: "The why",
    description: "Explains the science behind preventive wellness.",
    icon: "learn",
    tone: "cyan",
  },
];

export const poseExercises: PoseExercise[] = [
  {
    id: "squat",
    name: "Squat",
    target: "Legs + Core",
    difficulty: "Beginner",
    duration: "3–5 min",
    description: "Depth, knee tracking and torso angle.",
    tone: "pink",
  },
  {
    id: "bicep-curl",
    name: "Bicep Curl",
    target: "Arms",
    difficulty: "Beginner",
    duration: "3–4 min",
    description: "Elbow position and range of motion.",
    tone: "cyan",
  },
  {
    id: "lunge",
    name: "Lunge",
    target: "Legs + Balance",
    difficulty: "Intermediate",
    duration: "4–6 min",
    description: "Stride length, alignment and control.",
    tone: "lime",
  },
];

export const badges: Badge[] = [
  {
    id: "b1",
    name: "First Step",
    description: "Completed your first Squat Pose Coach session.",
    tone: "yellow",
    earned: false,
  },
  {
    id: "b2",
    name: "Lifestyle Detective",
    description: "Completed your first VIEW POINT LAB investigation.",
    tone: "pink",
    earned: false,
  },
  {
    id: "b3",
    name: "Movement Investigator",
    description: "Recognized patterns in activity consistency across the week.",
    tone: "cyan",
    earned: false,
  },
  {
    id: "b4",
    name: "Pattern Master",
    description: "Recognized interacting patterns hidden behind healthy-looking averages.",
    tone: "purple",
    earned: false,
  },
  {
    id: "b5",
    name: "Form Master",
    description: "Completed all three VIEW POINT FIT Pose Coach exercises.",
    tone: "lime",
    earned: false,
  },
  {
    id: "b7",
    name: "Curl Starter",
    description: "Completed your first Bicep Curl Pose Coach session.",
    tone: "cyan",
    earned: false,
  },
  {
    id: "b8",
    name: "Balance Builder",
    description: "Completed your first Lunge Pose Coach session.",
    tone: "pink",
    earned: false,
  },
  {
    id: "b6",
    name: "7 Day Streak",
    description: "Show up 7 days in a row.",
    tone: "yellow",
    earned: false,
  },
];

export const progressStats = {
  poseSessions: 0,
  missionsCompleted: 0,
  casesSolved: 0,
};

export const emptyStates = {
  pose: {
    title: "No sessions yet",
    body: "Your first movement mission is waiting.",
    cta: "Go to Pose Coach",
  },
  cases: {
    title: "Your detective journey starts here",
    body: "Case #001 is waiting.",
    cta: "View case",
  },
  badges: { title: "Badges locked", body: "Complete missions and cases to unlock achievements." },
};

export const profileSettings = {
  notifications: "Daily mission reminder",
  privacy: "Data stays on this device for now",
  about:
    "VIEW POINT FIT helps you understand wellness through movement, habits, AI guidance and interactive health education.",
};
