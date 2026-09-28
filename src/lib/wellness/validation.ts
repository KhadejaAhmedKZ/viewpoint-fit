import { z } from "zod";
import { EXERCISE_TYPES, MOOD_TAGS } from "./checkin";
const integer = (max: number, min = 0) => z.number().finite().int().min(min).max(max).nullable();
export const checkInSchema = z
  .object({
    steps: integer(100000),
    activeMinutes: integer(600),
    exercised: z.boolean().nullable(),
    exerciseMinutes: integer(600),
    exerciseType: z.enum(EXERCISE_TYPES).nullable(),
    sleepMinutes: integer(1440),
    sleepQuality: integer(4, 1),
    sleepSchedule: integer(3, 1),
    mealBalance: integer(4, 1),
    waterLiters: z.number().finite().min(0).max(10).nullable(),
    mealConsistency: integer(3, 1),
    recoveryFeeling: integer(5, 1),
    breakFrequency: integer(3, 1),
    activityLoad: integer(4, 1),
    energy: integer(5, 1),
    stress: integer(5, 1),
    moodTags: z.array(z.enum(MOOD_TAGS)).max(2),
  })
  .transform((c) => ({
    ...c,
    exerciseMinutes: c.exercised === true ? c.exerciseMinutes : null,
    exerciseType: c.exercised === true ? c.exerciseType : null,
    moodTags: [...new Set(c.moodTags)],
  }));
