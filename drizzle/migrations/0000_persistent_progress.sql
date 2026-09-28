
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  display_name text NOT NULL DEFAULT 'Player' CHECK (char_length(display_name) BETWEEN 1 AND 40),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_progress (
  user_id uuid PRIMARY KEY,
  xp integer NOT NULL DEFAULT 0 CHECK (xp >= 0),
  level integer NOT NULL DEFAULT 1 CHECK (level >= 1),
  streak integer NOT NULL DEFAULT 0 CHECK (streak >= 0),
  last_active_date date,
  cases_solved integer NOT NULL DEFAULT 0 CHECK (cases_solved >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_progress TO authenticated;
GRANT ALL ON public.user_progress TO service_role;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own progress read" ON public.user_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.missions (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  xp_reward integer NOT NULL CHECK (xp_reward >= 0),
  mission_type text NOT NULL CHECK (mission_type IN ('daily','pose','ai'))
);
GRANT SELECT ON public.missions TO authenticated;
GRANT ALL ON public.missions TO service_role;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "missions readable" ON public.missions FOR SELECT TO authenticated USING (true);
INSERT INTO public.missions VALUES
 ('move-break','10-Minute Movement Break','Take a short walk or movement break.',50,'daily'),
 ('hydration','Hydration Check','Complete today''s hydration habit.',30,'daily'),
 ('recovery-reset','Recovery Reset','Complete a short recovery activity.',40,'daily'),
 ('detective','Health Detective','Investigate one VIEW POINT LAB case.',100,'daily'),
 ('pose-daily-quest','Move your body','Complete one Pose Coach session.',100,'pose'),
 ('ai-mission','AI Mission','A mission suggested by Coach Maya.',40,'ai');

CREATE TABLE public.mission_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mission_id text NOT NULL REFERENCES public.missions(id),
  completion_date date NOT NULL,
  xp_awarded integer NOT NULL DEFAULT 0 CHECK (xp_awarded >= 0),
  title text,
  description text,
  category text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, mission_id, completion_date)
);
CREATE INDEX mission_completions_user_date ON public.mission_completions (user_id, completion_date);
GRANT SELECT ON public.mission_completions TO authenticated;
GRANT ALL ON public.mission_completions TO service_role;
ALTER TABLE public.mission_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own completions read" ON public.mission_completions FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.daily_wellness (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  movement_score integer CHECK (movement_score BETWEEN 0 AND 100),
  sleep_score integer CHECK (sleep_score BETWEEN 0 AND 100),
  fuel_score integer CHECK (fuel_score BETWEEN 0 AND 100),
  recovery_score integer CHECK (recovery_score BETWEEN 0 AND 100),
  view_score integer CHECK (view_score BETWEEN 0 AND 100),
  data_coverage numeric CHECK (data_coverage BETWEEN 0 AND 1),
  is_demo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
GRANT SELECT, INSERT, UPDATE ON public.daily_wellness TO authenticated;
GRANT ALL ON public.daily_wellness TO service_role;
ALTER TABLE public.daily_wellness ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wellness read" ON public.daily_wellness FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own wellness insert" ON public.daily_wellness FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own wellness update" ON public.daily_wellness FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.case_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  case_id text NOT NULL,
  score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  xp_awarded integer NOT NULL DEFAULT 0 CHECK (xp_awarded >= 0),
  reward_claimed boolean NOT NULL DEFAULT false,
  completed boolean NOT NULL DEFAULT true,
  is_replay boolean NOT NULL DEFAULT false,
  hint_used boolean NOT NULL DEFAULT false,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX case_attempts_one_reward ON public.case_attempts (user_id, case_id) WHERE reward_claimed;
CREATE INDEX case_attempts_user_case ON public.case_attempts (user_id, case_id);
GRANT SELECT ON public.case_attempts TO authenticated;
GRANT ALL ON public.case_attempts TO service_role;
ALTER TABLE public.case_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own attempts read" ON public.case_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_id text NOT NULL,
  kind text NOT NULL DEFAULT 'badge' CHECK (kind IN ('badge','skill')),
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);
GRANT SELECT ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own achievements read" ON public.user_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.pose_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  exercise text NOT NULL CHECK (exercise IN ('squat','curl','lunge')),
  reps integer NOT NULL CHECK (reps BETWEEN 0 AND 1000),
  target_reps integer NOT NULL CHECK (target_reps BETWEEN 1 AND 1000),
  duration_seconds integer NOT NULL CHECK (duration_seconds BETWEEN 0 AND 86400),
  form_consistency integer NOT NULL CHECK (form_consistency BETWEEN 0 AND 100),
  tracking_quality numeric NOT NULL CHECK (tracking_quality BETWEEN 0 AND 100),
  selected_side text CHECK (selected_side IN ('left','right')),
  left_reps integer,
  right_reps integer,
  completed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pose_sessions_user_created ON public.pose_sessions (user_id, created_at DESC);
GRANT SELECT ON public.pose_sessions TO authenticated;
GRANT ALL ON public.pose_sessions TO service_role;
ALTER TABLE public.pose_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own pose read" ON public.pose_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.xp_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_type text NOT NULL,
  source_id text NOT NULL,
  amount integer NOT NULL CHECK (amount > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, source_type, source_id)
);
CREATE INDEX xp_transactions_user ON public.xp_transactions (user_id, created_at DESC);
GRANT SELECT ON public.xp_transactions TO authenticated;
GRANT ALL ON public.xp_transactions TO service_role;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own xp read" ON public.xp_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.coach_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL DEFAULT 'New chat' CHECK (char_length(title) <= 120),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX coach_conversations_user ON public.coach_conversations (user_id, updated_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_conversations TO authenticated;
GRANT ALL ON public.coach_conversations TO service_role;
ALTER TABLE public.coach_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own convo select" ON public.coach_conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own convo insert" ON public.coach_conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own convo update" ON public.coach_conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own convo delete" ON public.coach_conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.coach_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.coach_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  role text NOT NULL CHECK (role IN ('user','maya')),
  agent text,
  content jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX coach_messages_convo ON public.coach_messages (conversation_id, created_at);
GRANT SELECT, INSERT, DELETE ON public.coach_messages TO authenticated;
GRANT ALL ON public.coach_messages TO service_role;
ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own msg select" ON public.coach_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own msg insert" ON public.coach_messages FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.coach_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "own msg delete" ON public.coach_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER t_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_progress BEFORE UPDATE ON public.user_progress FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_wellness BEFORE UPDATE ON public.daily_wellness FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_convo BEFORE UPDATE ON public.coach_conversations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NULLIF(left(trim(NEW.raw_user_meta_data->>'display_name'), 40), ''), 'Player'));
  INSERT INTO public.user_progress (user_id) VALUES (NEW.id);
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.level_for_xp(p_xp integer) RETURNS integer LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE WHEN p_xp >= 2250 THEN 4 WHEN p_xp >= 1250 THEN 3 WHEN p_xp >= 500 THEN 2 ELSE 1 END
$$;

CREATE OR REPLACE FUNCTION public._check_day(p_day date) RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF p_day IS NULL OR p_day < current_date - 1 OR p_day > current_date + 1 THEN
    RAISE EXCEPTION 'invalid day';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public._touch_streak(p_uid uuid, p_day date) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.user_progress SET
    streak = CASE
      WHEN last_active_date = p_day THEN streak
      WHEN last_active_date = p_day - 1 THEN streak + 1
      WHEN last_active_date > p_day THEN streak
      ELSE 1 END,
    last_active_date = GREATEST(COALESCE(last_active_date, p_day), p_day)
  WHERE user_id = p_uid;
END $$;

CREATE OR REPLACE FUNCTION public._award_xp(p_uid uuid, p_type text, p_source text, p_amount integer) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF p_amount <= 0 THEN RETURN 0; END IF;
  INSERT INTO public.xp_transactions (user_id, source_type, source_id, amount)
  VALUES (p_uid, p_type, p_source, p_amount) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 0 THEN RETURN 0; END IF;
  UPDATE public.user_progress SET xp = xp + p_amount, level = public.level_for_xp(xp + p_amount) WHERE user_id = p_uid;
  RETURN p_amount;
END $$;

CREATE OR REPLACE FUNCTION public.complete_mission(p_mission_id text, p_day date) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); reward integer; n integer;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  PERFORM public._check_day(p_day);
  SELECT xp_reward INTO reward FROM public.missions WHERE id = p_mission_id AND mission_type = 'daily';
  IF reward IS NULL THEN RAISE EXCEPTION 'unknown mission'; END IF;
  INSERT INTO public.mission_completions (user_id, mission_id, completion_date, xp_awarded, completed_at)
  VALUES (uid, p_mission_id, p_day, reward, now()) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 0 THEN RETURN 0; END IF;
  PERFORM public._touch_streak(uid, p_day);
  RETURN public._award_xp(uid, 'mission', p_mission_id || '_' || p_day, reward);
END $$;

CREATE OR REPLACE FUNCTION public.add_ai_mission(p_title text, p_description text, p_category text, p_day date) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); n integer;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  PERFORM public._check_day(p_day);
  IF p_category NOT IN ('move','fuel','recover','learn') THEN RAISE EXCEPTION 'bad category'; END IF;
  INSERT INTO public.mission_completions (user_id, mission_id, completion_date, xp_awarded, title, description, category)
  VALUES (uid, 'ai-mission', p_day, 0, left(p_title, 80), left(p_description, 200), p_category) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n > 0;
END $$;

CREATE OR REPLACE FUNCTION public.complete_ai_mission(p_day date) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); n integer;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  PERFORM public._check_day(p_day);
  UPDATE public.mission_completions SET completed_at = now(), xp_awarded = 40
  WHERE user_id = uid AND mission_id = 'ai-mission' AND completion_date = p_day AND completed_at IS NULL;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 0 THEN RETURN 0; END IF;
  PERFORM public._touch_streak(uid, p_day);
  RETURN public._award_xp(uid, 'ai_mission', p_day::text, 40);
END $$;

CREATE OR REPLACE FUNCTION public.record_case_completion(p_case_id text, p_score integer, p_xp integer, p_badge text, p_skill text, p_hint_used boolean, p_day date) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); cap integer; claimed boolean; amount integer := 0;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  PERFORM public._check_day(p_day);
  cap := CASE p_case_id WHEN '001' THEN 350 WHEN '002' THEN 400 WHEN '003' THEN 500 ELSE NULL END;
  IF cap IS NULL THEN RAISE EXCEPTION 'unknown case'; END IF;
  IF p_score < 0 OR p_score > 100 THEN RAISE EXCEPTION 'bad score'; END IF;
  PERFORM 1 FROM public.user_progress WHERE user_id = uid FOR UPDATE;
  claimed := EXISTS (SELECT 1 FROM public.case_attempts WHERE user_id = uid AND case_id = p_case_id AND reward_claimed);
  IF NOT claimed THEN
    amount := public._award_xp(uid, 'case', p_case_id || '_first_completion', LEAST(GREATEST(p_xp, 0), cap));
    INSERT INTO public.case_attempts (user_id, case_id, score, xp_awarded, reward_claimed, is_replay, hint_used)
    VALUES (uid, p_case_id, p_score, amount, true, false, COALESCE(p_hint_used, false));
    UPDATE public.user_progress SET cases_solved = cases_solved + 1 WHERE user_id = uid;
    IF p_badge ~ '^[a-z0-9-]{1,40}$' THEN
      INSERT INTO public.user_achievements (user_id, achievement_id, kind) VALUES (uid, p_badge, 'badge') ON CONFLICT DO NOTHING; END IF;
    IF p_skill ~ '^[a-z0-9-]{1,40}$' THEN
      INSERT INTO public.user_achievements (user_id, achievement_id, kind) VALUES (uid, p_skill, 'skill') ON CONFLICT DO NOTHING; END IF;
  ELSE
    INSERT INTO public.case_attempts (user_id, case_id, score, xp_awarded, reward_claimed, is_replay, hint_used)
    VALUES (uid, p_case_id, p_score, 0, false, true, COALESCE(p_hint_used, false));
  END IF;
  PERFORM public._touch_streak(uid, p_day);
  RETURN amount;
END $$;

CREATE OR REPLACE FUNCTION public.record_pose_session(p_exercise text, p_reps integer, p_target integer, p_duration integer, p_form integer, p_tracking numeric, p_side text, p_left integer, p_right integer, p_day date)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); badge text; fresh text[] := '{}'; amount integer := 0; n integer; sid uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  PERFORM public._check_day(p_day);
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

REVOKE ALL ON FUNCTION public._award_xp(uuid, text, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._touch_streak(uuid, date) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_mission(text, date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.add_ai_mission(text, text, text, date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.complete_ai_mission(date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_case_completion(text, integer, integer, text, text, boolean, date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_pose_session(text, integer, integer, integer, integer, numeric, text, integer, integer, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_mission(text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_ai_mission(text, text, text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_ai_mission(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_case_completion(text, integer, integer, text, text, boolean, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_pose_session(text, integer, integer, integer, integer, numeric, text, integer, integer, date) TO authenticated;
