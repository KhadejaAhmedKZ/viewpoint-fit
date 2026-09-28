-- Apply once after 0000 and 0001. No deletion of existing user data.
CREATE TABLE public.meal_logs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(),
 date date NOT NULL DEFAULT current_date,
 meal_type text NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
 description text NOT NULL CHECK (char_length(trim(description)) BETWEEN 2 AND 300),
 components text[] NOT NULL DEFAULT '{}' CHECK (cardinality(components)<=5 AND components <@ ARRAY['protein','color','grains','fats','water']::text[]),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX meal_logs_user_date ON public.meal_logs(user_id,date DESC);
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.meal_logs TO authenticated;
GRANT ALL ON public.meal_logs TO service_role;
CREATE POLICY own_meals_read ON public.meal_logs FOR SELECT TO authenticated USING (auth.uid()=user_id);
CREATE POLICY own_meals_insert ON public.meal_logs FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id AND date BETWEEN current_date-1 AND current_date+1);

CREATE TABLE public.case_rules (case_id text PRIMARY KEY, rule jsonb NOT NULL);
REVOKE ALL ON public.case_rules FROM PUBLIC, anon, authenticated;
INSERT INTO public.case_rules VALUES ('001', '{"evidence":["daily_steps","average_sleep","gym_frequency","recovery_days","water_intake","sugary_drinks","fast_food","desk_time","bedtime","work_stress","phone_before_bed","age"],"groups":[["average_sleep"],["daily_steps"],["recovery_days"],["desk_time"]],"distractors":["age","gym_frequency"],"penalty":0.5,"interventions":[{"id":"sleep_window","weight":3},{"id":"movement_breaks","weight":3},{"id":"recovery_day","weight":3},{"id":"swap_drinks","weight":2},{"id":"balanced_meals","weight":2},{"id":"train_7","weight":-3},{"id":"supplements","weight":-2},{"id":"skip_meals","weight":-3}],"maxPlan":4,"minEvidence":6,"hypotheses":[{"id":"a","best":false},{"id":"b","best":false},{"id":"c","best":true},{"id":"d","best":false}],"connections":null,"theoryFirst":false,"badge":"b2","skill":"movement_breaks","tiers":[{"minScore":90,"xp":350},{"minScore":75,"xp":250},{"minScore":60,"xp":150},{"minScore":0,"xp":75}]}'::jsonb);
INSERT INTO public.case_rules VALUES ('002', '{"evidence":["mon_steps","tue_steps","wed_steps","thu_steps","fri_activity","sat_activity","workout_pattern","workday_sitting","movement_breaks","sleep","water","nutrition","commute","breakfast","sunday","age","timeline"],"groups":[["mon_steps","tue_steps","wed_steps","thu_steps","timeline"],["workday_sitting"],["movement_breaks"],["workout_pattern","fri_activity","sat_activity","timeline"],["sunday"]],"distractors":["sleep","water","nutrition","breakfast","age"],"penalty":0.25,"interventions":[{"id":"movement_breaks","weight":3},{"id":"spread_activity","weight":3},{"id":"weekday_session","weight":3},{"id":"recovery_day","weight":2},{"id":"gradual","weight":2},{"id":"double_saturday","weight":-3},{"id":"no_carbs","weight":-3},{"id":"ignore_weekdays","weight":-3}],"maxPlan":4,"minEvidence":8,"hypotheses":[{"id":"a","best":false},{"id":"b","best":false},{"id":"c","best":true},{"id":"d","best":false}],"connections":null,"theoryFirst":false,"badge":"b3","skill":"consistency_chain","tiers":[{"minScore":90,"xp":400},{"minScore":75,"xp":300},{"minScore":60,"xp":200},{"minScore":0,"xp":100}]}'::jsonb);
INSERT INTO public.case_rules VALUES ('003', '{"evidence":["steps","training_freq","avg_sleep","water","nutrition","age","rhr","sleep_log","bedtime","weekend_sleep","work_stress","late_work","disconnecting","training_week","training_density","recovery_ops","wired_tired","late_work_training","meal_timing","eating_working","sleep_schedule"],"groups":[["sleep_log","bedtime","weekend_sleep"],["work_stress","disconnecting"],["late_work","late_work_training"],["training_density","training_week"],["recovery_ops","wired_tired"],["sleep_schedule","meal_timing","eating_working"]],"distractors":["steps","water","nutrition","age","rhr"],"penalty":0.2,"interventions":[{"id":"sleep_window","weight":3},{"id":"recovery_day","weight":3},{"id":"reduce_stacking","weight":3},{"id":"decompression","weight":2},{"id":"keep_movement","weight":2},{"id":"track_sleep","weight":2},{"id":"more_hiit","weight":-3},{"id":"calorie_restriction","weight":-3},{"id":"supplement","weight":-2},{"id":"ignore_sleep","weight":-3}],"maxPlan":4,"minEvidence":15,"hypotheses":[{"id":"a","best":false},{"id":"b","best":false},{"id":"c","best":false},{"id":"d","best":true}],"connections":{"required":3,"target":5,"nodes":[{"id":"work_stress","label":"High work stress","system":"work"},{"id":"late_work","label":"Late work","system":"work"},{"id":"work_schedule","label":"Work schedule","system":"work"},{"id":"sleep_timing","label":"Sleep timing","system":"sleep"},{"id":"sleep_consistency","label":"Sleep consistency","system":"sleep"},{"id":"dense_training","label":"Dense training","system":"training"},{"id":"late_training","label":"Late training","system":"training"},{"id":"training_schedule","label":"Training schedule","system":"training"},{"id":"recovery_ops","label":"Recovery opportunities","system":"recovery"},{"id":"recovery_balance","label":"Recovery balance","system":"recovery"},{"id":"wind_down","label":"Wind-down routine","system":"routine"},{"id":"meal_timing","label":"Meal timing","system":"routine"},{"id":"water","label":"Water intake","system":"routine"},{"id":"steps","label":"Daily steps","system":"routine"}],"valid":[["work_stress","late_work"],["late_work","sleep_timing"],["sleep_timing","sleep_consistency"],["dense_training","recovery_ops"],["late_training","wind_down"],["work_schedule","meal_timing"],["training_schedule","recovery_balance"],["late_work","late_training"],["late_training","sleep_timing"],["work_stress","wind_down"],["late_work","meal_timing"],["dense_training","recovery_balance"],["work_schedule","late_work"],["training_schedule","recovery_ops"],["work_schedule","sleep_timing"],["wind_down","sleep_timing"],["wind_down","sleep_consistency"],["work_stress","sleep_consistency"]]},"theoryFirst":true,"badge":"b4","skill":"systems_thinking","tiers":[{"minScore":90,"xp":500},{"minScore":75,"xp":375},{"minScore":60,"xp":250},{"minScore":0,"xp":125}]}'::jsonb);
-- Legacy RPC becomes internal-only. Rewards/achievements no longer come from arbitrary client fields.
CREATE OR REPLACE FUNCTION public.record_case_completion(p_case_id text, p_score integer, p_xp integer, p_badge text, p_skill text, p_hint_used boolean, p_day date) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); r jsonb; reward integer; claimed boolean; amount integer:=0;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
 PERFORM public._check_day(p_day);
 SELECT rule INTO r FROM public.case_rules WHERE case_id=p_case_id;
 IF r IS NULL OR p_score IS NULL OR p_score<0 OR p_score>100 THEN RAISE EXCEPTION 'invalid case result'; END IF;
 SELECT (value->>'xp')::integer INTO reward FROM jsonb_array_elements(r->'tiers') WHERE p_score >= (value->>'minScore')::integer ORDER BY (value->>'minScore')::integer DESC LIMIT 1;
 PERFORM 1 FROM public.user_progress WHERE user_id=uid FOR UPDATE;
 claimed:=EXISTS(SELECT 1 FROM public.case_attempts WHERE user_id=uid AND case_id=p_case_id AND reward_claimed);
 IF NOT claimed THEN
  amount:=public._award_xp(uid,'case',p_case_id||'_first_completion',reward);
  UPDATE public.user_progress SET cases_solved=cases_solved+1 WHERE user_id=uid;
  INSERT INTO public.user_achievements(user_id,achievement_id,kind) VALUES(uid,r->>'badge','badge'),(uid,r->>'skill','skill') ON CONFLICT DO NOTHING;
 END IF;
 INSERT INTO public.case_attempts(user_id,case_id,score,xp_awarded,reward_claimed,is_replay,hint_used) VALUES(uid,p_case_id,p_score,amount,NOT claimed,claimed,coalesce(p_hint_used,false));
 PERFORM public._touch_streak(uid,p_day); RETURN amount;
END $$;
REVOKE ALL ON FUNCTION public.record_case_completion(text,integer,integer,text,text,boolean,date) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.record_case_completion_v2(p_case_id text,p_session jsonb,p_day date) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r jsonb; ids jsonb; k text; n integer; correct numeric; wrong numeric; ca numeric; iq numeric; ec numeric; rb numeric; best numeric; got numeric; valid numeric; invalid numeric; conn numeric; score integer; hinted boolean;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
 SELECT rule INTO r FROM public.case_rules WHERE case_id=p_case_id;
 IF r IS NULL OR jsonb_typeof(p_session)<>'object' THEN RAISE EXCEPTION 'invalid case'; END IF;
 FOREACH k IN ARRAY ARRAY['discovered','clues','plan','connections'] LOOP
  ids:=p_session->k;
  IF jsonb_typeof(ids) IS DISTINCT FROM 'array' OR jsonb_array_length(ids)>60 THEN RAISE EXCEPTION 'invalid selection'; END IF;
  SELECT count(DISTINCT value) INTO n FROM jsonb_array_elements_text(ids);
  IF n<>jsonb_array_length(ids) THEN RAISE EXCEPTION 'duplicate selection'; END IF;
 END LOOP;
 IF jsonb_array_length(p_session->'discovered')<(r->>'minEvidence')::int OR jsonb_array_length(p_session->'clues')=0 OR jsonb_array_length(p_session->'plan') NOT BETWEEN 1 AND (r->>'maxPlan')::int THEN RAISE EXCEPTION 'incomplete case'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements_text((p_session->'discovered')||(p_session->'clues')) x WHERE NOT (r->'evidence') ? x.value) THEN RAISE EXCEPTION 'unknown evidence'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements_text(p_session->'clues') x WHERE NOT (p_session->'discovered') ? x.value) THEN RAISE EXCEPTION 'unseen clue'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements_text(p_session->'plan') x WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(r->'interventions') i WHERE i->>'id'=x.value)) THEN RAISE EXCEPTION 'unknown intervention'; END IF;
 hinted:=coalesce((p_session->>'hintUsed')::boolean,false);
 SELECT count(*) INTO correct FROM jsonb_array_elements(r->'groups') g WHERE EXISTS(SELECT 1 FROM jsonb_array_elements_text(g) x WHERE (p_session->'clues') ? x.value);
 SELECT count(*) INTO wrong FROM jsonb_array_elements_text(p_session->'clues') x WHERE (r->'distractors') ? x.value;
 ca:=greatest(0,least(100,100*(correct-(r->>'penalty')::numeric*wrong)/jsonb_array_length(r->'groups')));
 IF r->'connections' <> 'null'::jsonb THEN
  SELECT count(*) INTO valid FROM jsonb_array_elements_text(p_session->'connections') x WHERE EXISTS(SELECT 1 FROM jsonb_array_elements(r->'connections'->'valid') pair WHERE x.value=least(pair->>0,pair->>1)||'|'||greatest(pair->>0,pair->>1));
  IF valid<(r->'connections'->>'required')::int THEN RAISE EXCEPTION 'connect more systems'; END IF;
  invalid:=jsonb_array_length(p_session->'connections')-valid;
  conn:=greatest(0,least(100,100*(least(valid,(r->'connections'->>'target')::int)-.5*invalid)/(r->'connections'->>'target')::int));
  ca:=.6*ca+.4*conn;
 END IF;
 IF (r->>'theoryFirst')::boolean AND (coalesce(length(trim(p_session->>'theory')),0)=0 OR p_session->>'hypothesisId' IS NULL) THEN RAISE EXCEPTION 'hypothesis required'; END IF;
 IF p_session->>'hypothesisId' IS NOT NULL AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(r->'hypotheses') h WHERE h->>'id'=p_session->>'hypothesisId') THEN RAISE EXCEPTION 'unknown hypothesis'; END IF;
 SELECT sum(weight) INTO best FROM (SELECT (i->>'weight')::numeric weight FROM jsonb_array_elements(r->'interventions') i WHERE (i->>'weight')::numeric>0 ORDER BY weight DESC LIMIT (r->>'maxPlan')::int) t;
 SELECT sum((i->>'weight')::numeric) INTO got FROM jsonb_array_elements(r->'interventions') i WHERE (p_session->'plan') ? (i->>'id');
 iq:=greatest(0,least(100,100*got/best));
 ec:=least(100,100.0*jsonb_array_length(p_session->'discovered')/jsonb_array_length(r->'evidence'));
 rb:=CASE WHEN hinted OR coalesce((p_session->>'hypothesisSkipped')::boolean,false) OR p_session->>'hypothesisId' IS NULL THEN 60 WHEN EXISTS(SELECT 1 FROM jsonb_array_elements(r->'hypotheses') h WHERE h->>'id'=p_session->>'hypothesisId' AND (h->>'best')::boolean) THEN 100 ELSE 80 END;
 score:=round(.4*ca+.35*iq+.15*ec+.1*rb);
 RETURN public.record_case_completion(p_case_id,score,0,'','',hinted,p_day);
END $$;
REVOKE ALL ON FUNCTION public.record_case_completion_v2(text,jsonb,date) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_case_completion_v2(text,jsonb,date) TO authenticated;

CREATE TABLE public.coach_rate_limits(user_id uuid PRIMARY KEY, window_start timestamptz NOT NULL, hits integer NOT NULL);
ALTER TABLE public.coach_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.coach_rate_limits FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.consume_coach_request() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); n integer;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
 INSERT INTO public.coach_rate_limits VALUES(uid,now(),1) ON CONFLICT(user_id) DO UPDATE SET hits=CASE WHEN coach_rate_limits.window_start<now()-interval '1 minute' THEN 1 ELSE coach_rate_limits.hits+1 END,window_start=CASE WHEN coach_rate_limits.window_start<now()-interval '1 minute' THEN now() ELSE coach_rate_limits.window_start END RETURNING hits INTO n;
 RETURN n<=12;
END $$;
REVOKE ALL ON FUNCTION public.consume_coach_request() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.consume_coach_request() TO authenticated;

-- Only completed, bounded session summaries can earn a quest reward.
CREATE OR REPLACE FUNCTION public.record_pose_session(p_exercise text, p_reps integer, p_target integer, p_duration integer, p_form integer, p_tracking numeric, p_side text, p_left integer, p_right integer, p_day date)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); badge text; fresh text[] := '{}'; amount integer := 0; n integer; sid uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  PERFORM public._check_day(p_day);
  IF p_exercise IS NULL OR p_exercise NOT IN ('squat','curl','lunge')
    OR p_reps IS NULL OR p_reps NOT BETWEEN 10 AND 1000
    OR p_target IS DISTINCT FROM 10 OR p_duration IS NULL OR p_duration NOT BETWEEN 7 AND 14400
    OR p_form IS NULL OR p_form NOT BETWEEN 0 AND 100
    OR p_tracking IS NULL OR p_tracking NOT BETWEEN 0 AND 100 THEN
    RAISE EXCEPTION 'invalid completed pose session';
  END IF;
  IF p_exercise = 'curl' AND (p_side IS NULL OR p_side NOT IN ('left','right')) THEN RAISE EXCEPTION 'invalid arm'; END IF;
  IF p_exercise = 'lunge' AND (p_left IS NULL OR p_right IS NULL OR p_left < 0 OR p_right < 0 OR p_left + p_right <> p_reps) THEN RAISE EXCEPTION 'invalid side counts'; END IF;
  INSERT INTO public.pose_sessions (user_id, exercise, reps, target_reps, duration_seconds, form_consistency, tracking_quality, selected_side, left_reps, right_reps)
  VALUES (uid, p_exercise, p_reps, p_target, p_duration, p_form, p_tracking, p_side, p_left, p_right) RETURNING id INTO sid;
  badge := CASE p_exercise WHEN 'squat' THEN 'b1' WHEN 'curl' THEN 'b7' ELSE 'b8' END;
  INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (uid, badge) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT; IF n > 0 THEN fresh := fresh || badge; END IF;
  IF (SELECT count(*) FROM public.user_achievements WHERE user_id = uid AND achievement_id IN ('b1','b7','b8')) = 3 THEN
    INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (uid, 'b5') ON CONFLICT DO NOTHING;
    GET DIAGNOSTICS n = ROW_COUNT; IF n > 0 THEN fresh := fresh || 'b5'::text; END IF;
  END IF;
  INSERT INTO public.mission_completions (user_id, mission_id, completion_date, xp_awarded, completed_at)
  VALUES (uid, 'pose-daily-quest', p_day, 100, now()) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n > 0 THEN amount := public._award_xp(uid, 'pose_daily', p_day::text, 100); END IF;
  PERFORM public._touch_streak(uid, p_day);
  RETURN jsonb_build_object('id', sid, 'xp', amount, 'badges', to_jsonb(fresh));
END $$;
