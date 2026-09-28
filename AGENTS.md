<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Player progress persists in Lovable Cloud; GameProvider (src/lib/game-state.tsx) loads it per signed-in user via src/lib/services/* and updates optimistically with rollback — the database is the single source of truth.
- LAB cases are data (src/data/cases/*, registered in index.ts) rendered by one CaseEngine (src/components/lab); stage/scoring/simulation rules are pure functions in src/lib/cases — new cases need data only, no new UI.
- All XP goes through SECURITY DEFINER RPCs (complete_mission, record_case_completion, record_pose_session, add/complete_ai_mission) backed by the unique xp_transactions ledger; clients only SELECT progress tables — so XP can never be farmed or edited from the browser.
- Pose Coach: one camera + one MediaPipe Pose Landmarker (lazy-imported, single rAF loop in src/components/pose/PoseCoach) feeding the selected ExerciseDefinition (src/lib/pose/exercises.ts: own landmarks, reading, detector, messages, notes); detectors share DetState/stepRange (src/lib/pose/detector.ts), thresholds live only in src/config/*Config.ts; sessions/badges/quest XP go through GameProvider.completePoseSession (each claimed once) — new exercises need a definition only.
- VIEW POINT AI: deterministic safety + router + spoiler guard run client-side in src/lib/coach before any model call; one server fn (coach.functions.ts) calls the gateway with a strict JSON reply schema; chats persist per user in coach_conversations/coach_messages (user-visible content only) via CoachProvider — keeps the model a narrow, replaceable renderer.

- Personal pages live under src/routes/_authenticated/ (client-only gate → /auth); /auth is the only public page.