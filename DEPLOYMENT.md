# Run and deploy VIEW POINT FIT

## Local development

Use Node 22+ and the existing `.env`. Public project settings are `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Never put a secret/service-role key in a `VITE_` variable.

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 4173
```

Open http://127.0.0.1:4173/demo for the no-account demo. `/auth` offers the same entry. Personal routes require a real Supabase account. There is no admin-password bypass. Demo is isolated even when an account is signed in, and cannot write account rewards or wellness records.

```sh
npm run lint
npm run typecheck
npm test
npm run test:components
npm run build:local
npm run preview -- --host 127.0.0.1 --port 4173
```

## Hosted database upgrade — REQUIRED before releasing these changes

The hosted project already exposes the base and check-in schema. A read-only probe on 27 September 2026 confirmed that `meal_logs` is absent. Migrations 0002 and 0003 have NOT been applied remotely.

In the authorized Supabase/Lovable SQL editor, run `drizzle/migrations/0002_fuel_and_security.sql` followed by `drizzle/migrations/0003_food_reports.sql` inside a transaction, then commit only if it succeeds. This adds Fuel rows and policies, authoritative case scoring, corrected skill persistence, completed-Pose validation and per-user Coach rate limits. It does not reset users or their progress. Do not reapply migrations 0000 or 0001 to the existing database.

Alternatively set the direct database connection as server-only `DATABASE_URL` in your local environment and run:

```sh
npm run db:upgrade
```

The script uses one transaction, detects the Fuel table and confirmed-report column, and applies missing upgrades. On an empty project, apply 0000, 0001, 0002, 0003 in order through the SQL editor. The local PostgreSQL-compatible regression suite tests that order and the actual RLS policies.

Until the upgrade is applied, Fuel saving and the new Lab completion RPC are unavailable. The UI reports save failures and rolls back optimistic progression. Do not deploy the client ahead of its migration.

## Live Coach

Set these **server-side** values on the hosting provider:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `GEMINI_API_KEY` for Google Gemini (preferred when configured); optional `GEMINI_MODEL`, default `gemini-2.5-flash`
- `LOVABLE_API_KEY` for the existing Lovable gateway when Gemini is not configured

The browser only receives the public Supabase configuration. The Coach validates user authentication, reloads permitted user context, applies safety/spoiler checks, limits requests, and validates structured output. Missing service configuration shows the labeled Quick Guidance fallback. A live Gemini coaching request with synthetic data was verified successfully. Photo requests name the configured provider in the opt-in consent and reject a provider change before forwarding. Both adapters remain available; a photo is sent only to the selected provider, with no automatic cross-provider retry. The public demo remains offline. Hosted migrations and authenticated end-to-end verification remain outstanding. Food search is a bundled educational list, not an external nutrition API.

For a local production preview, `build:local` selects Nitro’s Node server output and `preview` uses Nitro’s output-aware preview command. `npm run build` preserves the original Cloudflare/Lovable deployment target. Cloudflare preview requires Wrangler; it is not needed for the Node preview.

## Hosting

Preserved the existing Lovable/TanStack Start configuration. Production build creates client assets and a Nitro server with the existing Cloudflare target. This is not a static-only site: the Coach endpoint needs the server.

Use the existing Lovable publishing pipeline with the changed source, or an authorized Cloudflare deployment of the generated Nitro build. The build reports `npx nitro deploy --prebuilt` as its deploy command. Provider authentication and environment bindings must be configured first. No hosting credentials were available and no public deployment was performed.

Configure Supabase Auth Site URL and allowed redirect URLs for the final HTTPS origin. Email confirmation is enabled. For a persistent judging account, create a dedicated confirmed test user in the authorized Auth dashboard; do not weaken authentication or embed a shared password in code. The no-account `/demo` remains available without this setup.

## Release verification requiring device/account access

1. Apply migrations 0002 and 0003 and sign in with two test accounts. Save/edit/reload wellness and meals, complete a mission, replay a Lab case, and verify once-only rewards and isolation.
2. Configure Coach server variables; ask all specialist topics plus pain, urgent, diagnosis and medication prompts. Check fallback on a service outage.
3. On the presentation device, allow camera and perform one full squat/curl/lunge, standing still, partial repetitions and tracking loss. Check camera stops on navigation. No physical movement accuracy test was performed by the agent.
4. Test authenticated routes at phone width and with the keyboard open. Demo phone layout was inspected at 390px; automated DOM tests cover check-in and account changes.
5. Rehearse the 7-minute flow in DEMO_GUIDE.md using the final HTTPS URL.

## Food camera and nutrition reports

The user explicitly approved opt-in transfer to `ai.gateway.lovable.dev`. The UI still requires each app user to consent and tap Analyze. Images are resized to JPEG in memory before transfer; original metadata is discarded. No image is included in saved meal reports. The AI provider's own data policies apply, and `store:false` is sent; this is not a guarantee of provider zero retention.

Photo AI uses the same server-only `LOVABLE_API_KEY` as Coach. `FOOD_VISION_MODEL` can override the existing model with a vision-capable model supported by the gateway. The application validates responses and reports an error if the model/gateway does not support the request. A real multimodal request has not been verified because credentials are absent. Tests use mocked gateway responses and synthetic placeholder images, not a real user's photo.

Apply migration 0003 for confirmed report persistence. Users confirm or edit food identity, grams and nutrient values, then save calculated totals with their meal. Unknown macros remain unknown. Calories are approximate and not converted into restrictive daily budgets from steps. Manual label/database entry remains usable without AI; the public demo's Fuel tab exercises that calculator without account writes.

Character title choices and the latest weekly reflection use existing authenticated user metadata. Daily plans reuse the existing one-per-day bonus mission slot. No additional XP source was created.
