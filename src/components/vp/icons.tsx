import {
  Apple,
  BookOpen,
  Brain,
  Footprints,
  Moon,
  Search,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { AgentIcon, StatKey } from "@/types";

/** One icon language (lucide) for every wellness category. */
export const statIcons: Record<StatKey, LucideIcon> = {
  move: Footprints,
  sleep: Moon,
  fuel: Apple,
  recover: Zap,
  learn: Search,
};

export const statTones = {
  move: "pink",
  sleep: "purple",
  fuel: "lime",
  recover: "cyan",
  learn: "yellow",
} as const;

export const agentIcons: Record<AgentIcon, LucideIcon> = {
  move: Footprints,
  fuel: Apple,
  recover: Moon,
  wellness: Sparkles,
  learn: Brain,
};

export { BookOpen };
