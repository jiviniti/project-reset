# Project RESET Phase 1 Plan

Last updated: 25 August 2026

## Current approved milestone: Milestone 2

Implement the safe cumulative aggregate and realtime public visualization layer. Stop after hosted verification. KINEMA, actual reward delivery, Learning Lab persistence, custom-domain work and production cutover remain outside this milestone.

## Architecture decisions carried forward

- Next.js App Router and TypeScript on the Virsa Vercel project.
- Raw identity, screening participation, consent and responses remain in the non-exposed `private` Supabase schema.
- Vercel uses `SUPABASE_SECRET_KEY`; no privileged credential is exposed to browser code.
- Database API and mutation functions remain `SECURITY INVOKER`. Execution is revoked from `PUBLIC`, `anon` and `authenticated`, then granted only to `service_role`.
- The submission route retains its 32 KiB body cap, validation, screening checks, idempotency, Origin/`Sec-Fetch-Site` defence-in-depth checks and PII-free logs.
- Preview WAF remains 1,000 submission requests per IP per 60 seconds and must be reviewed against expected screening size before production launch.
- Email normalization remains trim and lowercase only. One normalized email corresponds to one participant across screenings.
- Transactional reward delivery remains separate from optional, false-by-default future-communications consent.

## Milestone 2 decisions

- Aggregate state lives in a separate, non-exposed `aggregate` schema.
- The public visualization is cumulative-first. Public v1 does not expose screening-specific response breakdowns.
- Approved metric definitions form an explicit allowlist for emotions, RESET pathways and RESET practices. Free text and custom tags are never aggregated automatically.
- Seeded/demo and observed data remain structurally distinct. Seeded data is never represented as a participant or raw response.
- There is exactly one canonical seeded baseline scope. Seed data must never be copied into screening scopes.
- Observed cumulative totals are derived only from non-overlapping screening scopes. Future cohort scopes may overlap and must never contribute to cumulative totals.
- Minimum observed cell size is `k = 5` for any future public small-scope/cohort breakdown. The cumulative community snapshot is not suppressed when a new screening contributes fewer than five responses.
- Aggregate updates and revision increments occur in the same transaction as a successful new submission. Failed submissions and idempotent replays change neither.
- Realtime is invalidation only: browsers may select a PII-free `public.aggregate_revision` row through Postgres Changes, then refetch the authoritative `GET /api/v1/aggregates` snapshot.
- The revision resource contains only `revision` and `updated_at`. Browser roles receive SELECT only; no browser role can mutate it.
- Only the revision resource is added to `supabase_realtime`. Raw response and aggregate-count tables are never streamed.
- The outgoing aggregate response is parsed through a strict allowlisted schema and contains no participant identity, UUIDs, free text, demographics, consent or raw records.
- The latest supplied prototype (25 August 2026) is the frontend source of truth. The participant flow moves PII to the last question step, restores private custom-tag input for the two relevant questions, uses “Donate” with the approved donation link and standardises product copy to U.S. English.

## Milestone sequence

- [x] Milestone 1: hosted end-to-end private submission.
- [x] Review and approve the Milestone 2 aggregate/API/realtime/privacy design.
- [x] Reconcile the latest supplied prototype with the active React implementation.
- [x] Add aggregate schema, allowlisted definitions, canonical seeded baseline, rebuild/backfill and transactional submission hook.
- [x] Add the cumulative safe aggregate API and outgoing response validation.
- [x] Add the PII-free revision subscription and live cumulative bubble visualization.
- [x] Reconcile the approved final-step PII, custom-tag and Donate changes.
- [x] Add database, API, realtime, security, visual and end-to-end tests.
- [x] Update architecture, data-model, security and handover documentation.
- [ ] Apply and verify the migration and application in the hosted preview.
- [ ] Produce the Milestone 2 report and stop.

## Explicitly deferred

- KINEMA integration
- Email or SMS reward delivery
- Persistent/personalized Learning Lab features beyond the approved public aggregate visualization
- Custom production domain
- Production database cutover
- Public screening/cohort breakdowns and demographic filtering
- Automated moderation or public aggregation of participant-created tags

## Production cutover guardrail

If the preview database is promoted, submissions must first be disabled, backed up and cleared of test participant/research records. Observed aggregates must then be rebuilt from the cleaned dataset while the canonical seeded baseline is preserved. Vercel Preview must lose the production secret and run with `SUBMISSIONS_ENABLED=false` until a separate staging project or branch exists.
