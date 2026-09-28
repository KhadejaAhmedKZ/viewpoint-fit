export type Difficulty = "easy" | "medium" | "hard";

export type Tone = "yellow" | "pink" | "cyan" | "lime" | "purple";

export type StatKey = "move" | "sleep" | "fuel" | "recover" | "learn";

export interface WellnessStat {
  id: StatKey;
  label: string;
  score: number;
  status: string;
  trend: number;
  tone: Tone;
  detail: string;
}

export interface Mission {
  id: string;
  category: "move" | "fuel" | "recover" | "learn";
  title: string;
  description: string;
  xp: number;
  completed: boolean;
  progress?: number;
  target?: number;
  route?: "/lab" | "/pose" | "/coach";
}

export interface DailyQuest {
  category: StatKey;
  title: string;
  description: string;
  xp: number;
  cta: string;
  to: "/pose" | "/lab" | "/coach";
}

export interface CaseSummary {
  id: string;
  caseNumber: number;
  title: string;
  characterName: string;
  characterAge: number;
  difficulty: Difficulty;
  themes: string[];
  story: string;
  mission: string;
  maxXp: number;
  locked: boolean;
  unlockRequirement?: string;
  /** Case that must be solved to unlock this one. */
  requiresCaseId?: string;
}

export interface UserProgress {
  level: number;
  levelTitle: string;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  casesSolved: number;
}

export interface DemoUser extends UserProgress {
  displayName: string;
  wellnessGoal: string;
  preferredActivities: string[];
  language: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  tone: Tone;
  earned: boolean;
}

export type AgentIcon = "move" | "fuel" | "recover" | "wellness" | "learn";

export interface CoachAgent {
  id: string;
  category: string;
  name: string;
  specialty: string;
  description: string;
  icon: AgentIcon;
  tone: Tone;
}

export interface PoseExercise {
  id: string;
  name: string;
  target: string;
  difficulty: string;
  duration: string;
  description: string;
  tone: Tone;
}

export interface DetectiveRank {
  title: string;
  casesSolved: number;
  totalCases: number;
  xp: number;
  nextRank: string;
}
