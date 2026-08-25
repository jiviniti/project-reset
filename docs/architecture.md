# Architecture

Last verified: 25 August 2026

Project RESET is a screening-aware Next.js application deployed on Vercel. Participants complete the RESET Check-In without a Supabase Auth account. Browser submissions go only to `POST /api/v1/submissions`; raw identity and research records remain in the non-exposed Supabase `private` schema.

## Active request and event flows

### Submission

```text
Browser
  -> POST /api/v1/submissions
  -> request/WAF/Zod/screening validation
  -> api.submit_participation_v1(jsonb) through the server-only secret
  -> raw private records
  -> allowlisted aggregate.apply_observed_submission_v1(...)
  -> observed screening aggregate + global revision
  -> one database commit
```

The submission and aggregate mutations share one PostgreSQL transaction. An invalid submission rolls back both. An idempotent replay returns before the aggregate helper and therefore changes neither counts nor revision.

### Public cumulative snapshot

`GET /api/v1/aggregates` calls `api.get_public_aggregates_v1()` with the Vercel-held Supabase secret. The database function reads only the non-exposed `aggregate` schema. The server parses the result through a strict Zod allowlist before returning it with `Cache-Control: no-store`.

Public v1 is cumulative-first. It does not return screening-specific breakdowns or accept public demographic/cohort filters.

### Realtime invalidation

```text
Committed aggregate revision UPDATE
  -> Supabase Postgres Changes
  -> browser receives PII-free invalidation
  -> events are debounced/coalesced
  -> GET /api/v1/aggregates
  -> stable-key bubbles animate to the authoritative snapshot
```

Only `public.aggregate_revision(revision, updated_at)` is browser-readable and added to `supabase_realtime`. Browser roles have SELECT only. No raw record, aggregate count or screening metadata is streamed.

The visualization recovers from missed events by fetching on initial load and again when the subscription reaches `SUBSCRIBED`. Realtime is never treated as the source of count data.

## Frontend journey

The active React implementation follows the latest prototype supplied on 25 August 2026:

1. burnout signs plus optional private custom tags/free text;
2. RESET pathways/practices plus optional private custom tags/ritual;
3. final-step PII, optional demographics, data-use consent and false-by-default future-communications preference;
4. thank-you/share card and entry into the cumulative community visualization.

The header action is Donate. Product copy uses U.S. English. SMS selection remains deferred because reward delivery is outside Milestone 2.

The self-contained source prototype and checksum are preserved under `reference/prototype/`. The active production-oriented UI is the typed React implementation under `src/`.

## Active, supporting and deferred boundaries

- **Active core:** check-in, private submission, cumulative safe aggregates, revision invalidation, public bubble visualization and share card.
- **Supporting:** canonical seeded baseline, rebuild/backfill function, preview seed, security tests and production-cleanup guard.
- **Deferred:** KINEMA, actual email/SMS delivery, personalized Learning Lab persistence, public screening/cohort views, custom domain and production cutover.
