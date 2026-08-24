# Project RESET Phase 1 Plan

Last updated: 24 August 2026

## Approved milestone

Deliver a new Vercel preview that preserves the supplied RESET journey and atomically stores one screening-aware submission in a new isolated Supabase project. Stop after verifying participant identity, participation, consent, optional future-communications preference, substantive responses and a deferred transactional reward record.

## Architecture decisions

- Next.js App Router and TypeScript on a new Virsa Vercel project.
- A new private Virsa GitHub repository; the legacy Burnout Stripes repository and deployment are unrelated and untouched.
- A new RESET Supabase project is development/preview for this milestone.
- Raw tables live in the non-exposed `private` schema.
- Vercel uses `SUPABASE_SECRET_KEY` with a current `sb_secret_...` key. No privileged key is used by browser code.
- `api.submit_participation_v1(jsonb)` is `SECURITY INVOKER`. Execute is revoked from `PUBLIC`, `anon` and `authenticated`, then granted only to the server-side `service_role` database role used by the Supabase secret key.
- The submission route enforces a 32 KiB body cap, JSON content type, Zod validation, active-screening and database validation, idempotency, safe Origin/`Sec-Fetch-Site` checks and PII-free logs.
- Origin and `Sec-Fetch-Site` checks are defence-in-depth, not authentication.
- Preview WAF threshold: 1,000 `POST /api/v1/submissions` requests per IP per 60 seconds. Review this against the expected screening size before production launch.
- Email normalization is trim and lowercase only. No provider-specific rewriting is allowed.
- **Identity assumption:** one normalized email corresponds to one participant across screenings. A participant may have multiple participation records.
- Transactional reward delivery is separate from optional marketing consent. The milestone records a deferred email reward; it does not send it.
- Future communications are always explicit and false by default.

## Milestone sequence

- [x] Audit and preserve the prototype.
- [x] Scaffold the application and documentation.
- [x] Apply schema, grants, RLS and seed migrations to preview.
- [x] Implement and test the server submission route.
- [x] Port the participant flow and share-card experience.
- [x] Deploy a Vercel preview.
- [x] Complete and verify a hosted Supabase submission.
- [x] Audit the journey visually at mobile and desktop widths.
- [x] Produce the milestone report and stop.

## Explicitly deferred

Aggregate/realtime data, Learning Lab persistence, KINEMA, actual email/SMS delivery, custom domain work, production cutover and ongoing writable preview infrastructure.

## Production cutover guardrail

If the preview database is promoted, submissions must first be disabled, backed up and cleared of test participant/research records using the reviewed cleanup script. Approved configuration is then reseeded and verified. Vercel Preview must lose the production secret and run with `SUBMISSIONS_ENABLED=false` until a separate staging project or branch exists.
