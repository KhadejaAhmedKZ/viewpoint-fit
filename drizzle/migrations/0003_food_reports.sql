-- Optional confirmed nutrition estimates only. Images and camera frames are never persisted.
ALTER TABLE public.meal_logs ADD COLUMN nutrition_report jsonb;
ALTER TABLE public.meal_logs ADD CONSTRAINT meal_report_bounds CHECK (
 nutrition_report IS NULL OR COALESCE((
 jsonb_typeof(nutrition_report) = 'object'
 AND octet_length(nutrition_report::text) <= 16000
 AND nutrition_report->>'source' IN ('manual','photo-estimate')
 AND nutrition_report->>'confirmed' = 'true'
 AND jsonb_typeof(nutrition_report->'items') = 'array'
 AND jsonb_array_length(nutrition_report->'items') BETWEEN 1 AND 8
 AND NOT (nutrition_report ?| ARRAY['image','photo','video'])
 ), false));
-- Existing per-user INSERT/SELECT RLS policies apply to the new column.
