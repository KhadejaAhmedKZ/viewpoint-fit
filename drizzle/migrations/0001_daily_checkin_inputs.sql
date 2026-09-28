ALTER TABLE public.daily_wellness
  ADD COLUMN steps integer CHECK (steps BETWEEN 0 AND 100000),
  ADD COLUMN active_minutes integer CHECK (active_minutes BETWEEN 0 AND 600),
  ADD COLUMN exercised boolean,
  ADD COLUMN exercise_minutes integer CHECK (exercise_minutes BETWEEN 0 AND 600),
  ADD COLUMN exercise_type text CHECK (exercise_type IN ('walking','running','strength','cycling','sport','pose','other')),
  ADD COLUMN sleep_minutes integer CHECK (sleep_minutes BETWEEN 0 AND 1440),
  ADD COLUMN sleep_quality smallint CHECK (sleep_quality BETWEEN 1 AND 4),
  ADD COLUMN sleep_schedule_consistency smallint CHECK (sleep_schedule_consistency BETWEEN 1 AND 3),
  ADD COLUMN meal_balance smallint CHECK (meal_balance BETWEEN 1 AND 4),
  ADD COLUMN water_liters numeric(4,2) CHECK (water_liters BETWEEN 0 AND 10),
  ADD COLUMN meal_consistency smallint CHECK (meal_consistency BETWEEN 1 AND 3),
  ADD COLUMN recovery_feeling smallint CHECK (recovery_feeling BETWEEN 1 AND 5),
  ADD COLUMN break_frequency smallint CHECK (break_frequency BETWEEN 1 AND 3),
  ADD COLUMN activity_load smallint CHECK (activity_load BETWEEN 1 AND 4),
  ADD COLUMN energy_level smallint CHECK (energy_level BETWEEN 1 AND 5),
  ADD COLUMN stress_level smallint CHECK (stress_level BETWEEN 1 AND 5),
  ADD COLUMN mood_tags text[] NOT NULL DEFAULT '{}' CHECK (cardinality(mood_tags) <= 2),
  ADD COLUMN mission_score integer CHECK (mission_score BETWEEN 0 AND 100);
ALTER TABLE public.daily_wellness ADD CONSTRAINT dw_scores_range CHECK (
  (movement_score IS NULL OR movement_score BETWEEN 0 AND 100) AND (sleep_score IS NULL OR sleep_score BETWEEN 0 AND 100) AND
  (fuel_score IS NULL OR fuel_score BETWEEN 0 AND 100) AND (recovery_score IS NULL OR recovery_score BETWEEN 0 AND 100) AND
  (view_score IS NULL OR view_score BETWEEN 0 AND 100)) NOT VALID;
ALTER TABLE public.daily_wellness ALTER COLUMN is_demo SET DEFAULT false;