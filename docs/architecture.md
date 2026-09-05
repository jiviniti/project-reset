# Architecture

Last verified: 5 September 2026

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

Before the participation is inserted, `private.resolve_screening_pathway_v1` resolves eligibility from the locked screening row and database time:

```text
configured non-event                         -> non-event + trailer
configured event, before check-in opening    -> non-event + trailer
configured event, within [opening, closing)  -> event + film
configured event, at/after closing           -> non-event + trailer
```

The resolved pathway, window status and reward type are frozen on the participation. A copied event QR therefore continues to collect screening-attributed responses after expiry without continuing to grant film access. The browser cannot request or override the reward. After an eligible commit, the submission route may append server-held KINEMA manual-redemption details for the two allowlisted launch slugs. Replays use the frozen database decision, not the current event window.

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
  -> stable-key words/statistics/pathway blooms animate to the authoritative snapshot
```

Only `public.aggregate_revision(revision, updated_at)` is browser-readable and added to `supabase_realtime`. Browser roles have SELECT only. No raw record, aggregate count or screening metadata is streamed.

The visualization recovers from missed events by fetching on initial load and again when the subscription reaches `SUBSCRIBED`. Realtime is never treated as the source of count data.

## Frontend journey

The active React implementation follows the latest prototype supplied on 25 August 2026. Questionnaire answers remain in local React state until the final atomic request:

1. burnout signs plus optional private custom tags/free text;
2. RESET pathways/practices plus optional private custom tags/ritual;
3. final-step PII, optional demographics, an optional private commitment, data-use consent and false-by-default future-communications preference;
4. persisted thank-you state, Learning Lab, film/trailer reward and conversation-tool entry.

The header action reads “Support the project.” Product copy uses U.S. English. Branded campaign references use the constructed lowercase `reset.` lockup when layout permits and `RESET` otherwise. SMS selection remains deferred because reward delivery is outside this pass.

Persisted success is presented as Step 04 of 04; it is not a fourth write stage. Back navigation between questionnaire stages retains local answers, and each forward transition returns the viewport to the stage heading.

The self-contained source prototype and checksum are preserved under `reference/prototype/`. The active production-oriented UI is the typed React implementation under `src/`. Poppins supplies interface text, headings, labels and buttons; Petit Formal Script supplies intentional script accents; EB Garamond and italic variation are confined to the word clouds. Local font assets are loaded through `next/font/local`; no prototype runtime or opaque generated code ships in the app.

Questionnaire version 3 copies version 2 and adds the optional private `today_commitment` text response. Screening configuration determines the version served, while every participation retains its submitted version. The commitment is not an aggregate metric.

The share-card renderer remains available only in the internal concept route. The active participant journey does not create or request a personalized card.

## Active, supporting and deferred boundaries

- **Active core:** check-in, private submission, cumulative safe aggregates, revision invalidation, public visualization, manual KINEMA reward handoff and conversation-tool entry.
- **Supporting:** canonical seeded baseline, rebuild/backfill function, preview seed, security tests and production-cleanup guard.
- **Deferred:** automated KINEMA API/email/SMS delivery, personalized Learning Lab persistence, conversation analytics, public screening/cohort views, custom domain and production cutover.
