# VIEW POINT FIT — feature update

Implemented in the existing Desktop project on 27 September 2026. The React/TanStack/Supabase architecture and yellow/cream design remain in place.

## Added

- **Your Next Move:** a daily action, explanation, related Lab lesson and next-meal suggestion using reported steps, recovery, energy, activity and recent meal components. The action reuses the existing once-per-day bonus mission slot; no new XP pool.
- **Weekly Reflection:** observed seven-day step averages, sleep range, explicit missing-day counts, and a reflection note saved in authenticated profile metadata. No disease forecasts or causal claims.
- **Maya’s Perspectives:** the contributing Movement, Nutrition, Recovery or Education perspective is explained. Daily suggestions are explicitly rule-based; live Coach remains a separate configured service.
- **Character milestones:** persistent achievement-based titles with an avatar accent and profile selection. No titles are revoked for a broken streak. Existing XP celebrations remain.
- **Food Lens:** camera/file picker, local photo preview, per-photo opt-in upload, resized JPEG with original metadata removed, authenticated server analysis using Google Gemini or the existing Lovable AI gateway, bounded response validation, and editable identified foods/grams/nutrition values.
- **Food report:** calorie range plus protein/carbohydrate/fat when known, uncertain fields left unknown, ingredient/portion corrections, confirmation before save, and expandable reports in meal history. Only structured report data is stored; images are not saved by the app.
- **Manual fallback:** package/database entry calculates the same report without an AI key. Public Demo → Fuel works without an account; saving and remote analysis require authentication.
- Confirmed nutrition estimates are available to the Nutrition/Wellness Coach context. Recommendations do not subtract steps from calories, prescribe restrictive calorie budgets, or claim allergen detection.

## Verified

- 35 logic/database tests and 19 component tests passed: **54 total**.
- TypeScript passed; production build passed; repository lint has no errors (17 existing Fast Refresh warnings).
- Tests cover calorie/portion arithmetic, unknown nutrients, malformed AI output, unavailable gateway, explicit image-upload consent, confirmation before saving, image exclusion from saved reports, account-change races, report RLS/confirmation, missing-day handling and permanent milestones. AI tests use mocked responses and synthetic placeholder data.
- In the actual browser, 200 g at 120–150 kcal per 100 g rendered 240–300 kcal. Unknown macros remained unknown. The calculator had no horizontal overflow at 390px width.
- Existing check-in, case scoring, once-only XP, camera lifecycle and 3D fallback tests remain passing.

## Still requires configuration or a device

- **Live photo recognition has not been verified.** A server-only `LOVABLE_API_KEY`, a confirmed account and the hosted request-limit migration are required. An optional server-only `FOOD_VISION_MODEL` selects a supported vision model. No real food photo was uploaded during this work.
- Hosted migrations **0002** (Fuel/security) and **0003** (confirmed nutrition reports) are prepared but not applied. The local PostgreSQL-compatible database tests apply all migrations and test user isolation; they do not substitute for a hosted acceptance test.
- Saved profile titles/reflections and full nutrition persistence require a signed-in hosted acceptance test.
- Physical food-camera capture and real Pose movement accuracy need the presentation device. File selection/calculation and mocked camera-lifecycle tests do not verify physical camera accuracy.
- No public deployment was performed.

## Run

From the existing project folder:

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 4173
```

Open `/demo` → **Fuel** to try the calculator without an account. Signed-in Home contains the daily plan and reflection; Profile contains earned title choices.

For a local production preview:

```sh
npm run build:local
npm run preview -- --host 127.0.0.1 --port 4174
```

`npm run build` preserves the existing Cloudflare deployment target. The preview command now uses Nitro instead of looking for a nonexistent TanStack `dist/server/server.js` file.

See DEPLOYMENT.md for database, AI and hosting setup. Do not put AI or database secrets in `VITE_` variables.

## Nutrition methodology

Portion totals are calculated from grams × nutrient-per-100g / 100. Manual values come from the user's entries; AI values are model estimates, not verified database matches. The UI links to [USDA FoodData Central](https://fdc.nal.usda.gov/) for manual lookup. Food-image research identifies portion/ingredient estimation as a limitation; the interface therefore requires review rather than claiming exact measurement ([JMIR scoping review](https://www.jmir.org/2024/1/e51432)).

## Gemini connection
The supplied credential is saved only in the ignored server environment file. Gemini is the active provider for Coach and opt-in Food Lens; the Lovable adapter remains supported. A live synthetic coaching response passed validation. Photo transport, structured output failures, consent and account changes are tested; no personal photo was used in testing. Hosted migrations and signed-in end-to-end verification remain pending. Current checks: 37 logic/database tests, 19 component tests, type check and Node production build passed.
