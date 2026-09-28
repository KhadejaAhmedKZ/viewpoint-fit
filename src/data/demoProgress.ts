/** DEMO progression config. Add levels here to expand. */
export interface LevelDef {
  level: number;
  title: string;
  requiredXP: number;
}

export const levels: LevelDef[] = [
  { level: 1, title: "Rookie Explorer", requiredXP: 0 },
  { level: 2, title: "Wellness Explorer", requiredXP: 500 },
  { level: 3, title: "View Seeker", requiredXP: 1250 },
  { level: 4, title: "Wellness Navigator", requiredXP: 2250 },
];

export const demoStartingXp = 0;

/** Days ago (0 = today) with at least one completed mission. Demo only. */
export const demoActivityDaysAgo = [1, 2, 3, 5, 6];

/** Mission completion % for the previous 6 days (oldest first). Demo only. */
export const demoPastMissionRates = [100, 75, 100, 75, 100, 100];
