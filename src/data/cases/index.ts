import type { HealthCase } from "@/types/cases";
import { case001 } from "./case001";
import { case002 } from "./case002";
import { case003 } from "./case003";

/** Playable case registry. Add future cases here — the engine renders from this data. */
export const playableCases: Record<string, HealthCase> = {
  [case001.id]: case001,
  [case002.id]: case002,
  [case003.id]: case003,
};

export function getPlayableCase(id: string): HealthCase | undefined {
  return playableCases[id];
}
