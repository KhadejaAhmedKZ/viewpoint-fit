import { levels, type LevelDef } from "@/data/demoProgress";

export interface LevelInfo {
  level: number;
  title: string;
  xpIntoLevel: number;
  xpForLevel: number | null; // null = max level
  next: LevelDef | null;
}

export function getLevelInfo(totalXp: number): LevelInfo {
  let idx = 0;
  for (let i = 0; i < levels.length; i++) if (totalXp >= levels[i]!.requiredXP) idx = i;
  const cur = levels[idx]!;
  const next = levels[idx + 1] ?? null;
  return {
    level: cur.level,
    title: cur.title,
    xpIntoLevel: totalXp - cur.requiredXP,
    xpForLevel: next ? next.requiredXP - cur.requiredXP : null,
    next,
  };
}

/** Returns the new level if adding XP crosses a threshold, otherwise null. */
export function detectLevelUp(before: number, after: number): LevelInfo | null {
  const a = getLevelInfo(before);
  const b = getLevelInfo(after);
  return b.level > a.level ? b : null;
}
