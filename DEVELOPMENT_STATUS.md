> Historical audit: the report below describes the initial check-in pass. It is superseded by FEATURE_UPDATE.md and DEPLOYMENT.md for the latest additions, tests and remaining configuration.

# VIEW POINT FIT — implementation audit and handoff

Audited 27 September 2026 against the supplied Forge 1 conversation and the actual Desktop export. The earlier conversation's claims of completion were not treated as verification.

Project: `Desktop/medhack 0.1/2127f768-4d94-466e-894d-dc7b47dee364`.
This directory is a source export, not a Git checkout. The original sibling ZIP remains untouched. Changes were made in place using the existing TanStack Start, React, Supabase, MediaPipe and shared case engine architecture.

## Prompt-by-prompt status

| Prompt | Actual state on arrival | Evidence and result |
| --- | --- | --- |
| 1 — Foundation | Implemented | Home, Pose, Coach, Lab, case detail, Progress, Profile and Auth routes; shared HUD, navigation, types and safety notice. |
| 1.5 — Yellow/cream theme | Implemented | Existing styles and shared `vp` components provide cream backgrounds, yellow cards, dark-purple outlines, hard shadows and accent colors. Preserved; auth preview visually inspected. |
| 2 — Functional MY FIT | Implemented with sample wellness data | Mission actions, XP/levels, streaks, celebrations, weighted VIEW scoring and charts existed. Mission consistency still incorporated seeded past rates, and two missions displayed invented partial progress. These now use actual completion state / start at zero. |
| 3 — Lab engine + Case 001 | Implemented | Shared CaseEngine, staged investigation, clues, hypothesis, four-action plan, deterministic simulation, reveal, scoring, rewards and replay. Logic regression passed. |
| 4 — Case 002 | Implemented | Registered case data, 17 evidence items, progressive timeline, eight-evidence gate and 0.25 distractor penalty. Uses the same engine. Logic regression passed. |
| 5 — Case 003 | Implemented | Snapshot, progressive evidence, timelines, connections, required theory, system map, reveal and final progression. 0.20 penalty and up to 500 XP. Logic regression passed. |
| 6 — Squat Pose Coach | Implemented; physical tracking unverified | Browser camera, lazy MediaPipe, overlay, shared frame loop, knee-angle state machine, summary, daily quest and persistence. Detector tests passed. Fixed delayed camera permission cleanup when navigating away. No raw video/frame persistence. |
| 7 — Curl + Lunge | Implemented; physical tracking unverified | Exercise definitions and configurations, curl arm selection, lunge side counters and shared camera engine. Missing-landmark regression passed for all three exercises. Real camera accuracy has not been tested in this session. |
| 8 — VIEW POINT AI | Implemented architecture; live service unconfigured locally | Maya UI, six specialist routes, safety and spoiler guards, structured responses, server gateway, chat history, one bonus mission and explicit Quick Guidance fallback. No local `LOVABLE_API_KEY`. Added endpoint authentication, server-side safety routing, timeout and rejection of malformed model output. Live answers are not claimed as tested. |
| 9 — Auth + persistence | Implemented, with gaps found | Supabase Auth, profile/progress tables, RLS policies, reward RPCs/ledger, mission/case/Pose/Coach persistence and account screens exist. Removed automatic demo writes to daily wellness on sign-in; fixed signed-out initialization. Live multi-account RLS and reward persistence are not yet acceptance-tested. |
| 10 — Daily check-in + real VIEW | Partially implemented on arrival | Database columns, generated types and pure scoring helpers existed, but no form or real-data consumer existed. Implemented five-step check-in, partial saves, validation, same-day edits, history, source labels, score details, dynamic Home/Coach context and mission suggestions. See below. |

Prompts 1–9 were not merely planned: they have substantial implementation. Prompt 10 was the first missing major user flow. Earlier security/privacy defects found during inspection were repaired before finishing that flow. None of the above means every original acceptance test has been executed against the live service.

## Implemented in this pass

- Five-step Move / Sleep / Fuel / Recover / Feel dialog, keyboard-accessible fields, optional answers, review screen and same-day edits.
- Validated raw inputs; no fabricated defaults for unanswered workout duration. Zero is distinct from missing data.
- Upsert by existing `(user_id, date)` uniqueness; no check-in XP, duplicate daily entries or sample writes on login.
- Shared wellness provider, guarded account changes, daily rollover, retry states and retained answers on failed saves.
- Existing 30/25/20/15/10 VIEW weights retained; missing dimensions renormalize. FEEL remains recovery context, not a separate mental-health score.
- Current dimensions, coverage, transparent contributions/source labels, saved-score change feedback and score animation.
- Today summary, deterministic daily insight, contextual Coach links and one bonus mission using the existing daily AI mission slot.
- Last-seven-day charts and 90-entry history from real records, with missing values displayed as dashes. Historical scores remain saved snapshots.
- Today's mission score is synchronized without rewriting raw answers, using an updated-at comparison to avoid overwriting another tab's edit.
- Explicit sample preview separated from actual check-ins. Coach never receives the sample preview as personal data.
- Progress no longer shows seeded wellness stats or pre-earned sample achievements.
- Server-only AI key retained; authenticated endpoint, server safety preflight, bounded request duration and structured-response validation.
- Camera cleanup handles late permission responses; MediaPipe frames remain local, with only existing numeric summaries sent to persistence.
- `.env` and test outputs added to ignore rules. No secret values included in this report.

## Verification

- Production client and server build: passed.
- TypeScript check: passed.
- 11 logic tests: passed. Coverage includes weighted/missing-data scores, zero/invalid inputs, all three case logic paths, plan limits, hint penalties, replay reset, Pose speed/partial/tracking-loss behavior, absent landmarks and Coach context/safety.
- 8 component integration tests: passed. Coverage includes full and partial check-ins, reload, edit, failure/retry, validation, account isolation, clearing unsaved drafts on account changes, history errors and mission-score persistence. Persistence is simulated in these tests, not a claim of live database verification.
- Changed/new code lint: no errors; existing Fast Refresh warnings remain.
- The original untouched export independently produced 1,439 lint errors and 15 warnings, primarily formatting plus a `prefer-const` issue. Repository-wide lint is therefore not a clean baseline; unrelated files were not mass-reformatted.
- Read-only hosted schema probe: returned HTTP 200 for check-in columns. This confirms field availability, not user isolation or successful writes.
- In-app browser: development app renders and redirects signed-out visitors to the existing branded Auth page.
- Playwright mobile/desktop route and check-in tests are included, but could not execute because the environment aborted the Chrome launch. Do not count them as passed.

## Remaining live acceptance checks

1. Sign in with a test account in the preview; save/edit a check-in, refresh, sign out/in and verify the same row and unchanged XP.
2. Use a second test account to verify database RLS isolation for wellness, progress, Pose and chat records.
3. Complete missions and all cases against the database, including repeat/replay attempts, to confirm once-only XP in the deployed functions.
4. Configure the existing server-side AI service key and Supabase server environment; test live Coach replies and fallback behavior. Never put the AI key in a `VITE_` variable.
5. Test real camera permission, denial, navigation cleanup and physical squat/curl/lunge tracking on the presentation device.
6. Run the included browser tests in an environment where Chrome can launch, then inspect mobile layouts on authenticated pages.

Known existing hardening work for the later security phase: case RPCs cap awards and enforce once-only claims, but still accept client-provided score/achievement inputs. These should be derived/validated on the server before treating the game as tamper-resistant. No database migration was applied during this pass.

Prompts 11–15 (expanded nutrition, wider integration polish, complete security audit, full-device QA and deployment/demo preparation) remain future work. No production deployment, new account, public publication or remote data reset was performed.

## Run locally

Use the existing `.env` locally and the newly created npm lockfile:

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 4173
npm run typecheck
npm test
npm run test:components
npm run build
npm run test:e2e
```

Preview: http://127.0.0.1:4173/ . Sign-in uses the existing Supabase project. `npm run test:e2e` uses isolated mocked transport and a locally installed Chrome; it does not create real accounts or capture camera video.

The database schema/migrations for this feature already existed in `drizzle/migrations/0000_persistent_progress.sql` and `0001_daily_checkin_inputs.sql`. Do not reapply them to an already-migrated hosted project.
