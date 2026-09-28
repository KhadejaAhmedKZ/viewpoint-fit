import type { Tone } from "@/types";

export interface SkillDef {
  id: string;
  name: string;
  description: string;
  tone: Tone;
  source: string;
}

/** Skill tree (early). Skills unlock through LAB cases. */
export const skills: SkillDef[] = [
  {
    id: "movement_breaks",
    name: "Movement Breaks",
    description: "Understand why everyday movement matters beyond structured exercise.",
    tone: "lime",
    source: "Case #001",
  },
  {
    id: "consistency_chain",
    name: "Consistency Chain",
    description:
      "Understand why small, repeated actions across the week can matter more than isolated bursts.",
    tone: "cyan",
    source: "Case #002",
  },
  {
    id: "systems_thinking",
    name: "Systems Thinking",
    description: "Understand how multiple wellness behaviors can interact across a routine.",
    tone: "purple",
    source: "Case #003",
  },
];
