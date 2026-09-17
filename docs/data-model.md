# Project RESET data model

Last verified against source and migrations: 17 September 2026

This document describes the current production data model. It is organized around the questions an operator, analyst, developer, or AI assistant needs to answer rather than around the order in which migrations were written.

## Reading this document

- **Verified in source** means the behavior is enforced by committed application code or database migrations.
- **Verify live** means the repository defines the intended state, but the Supabase or Vercel console must be checked before relying on the current operational value.
- Never place credentials, promo codes, participant records, or exported private data in this document.

## Model at a glance

```text
questionnaire_versions
  -> questions
      -> question_options

screenings
  -> participations <- participants
      -> consents -> policy_versions
      -> communication_preferences
      -> responses
          -> response_selections -> questions + question_options
          -> response_answers    -> questions
      -> reward_deliveries

responses + screenings
  -> aggregate.processed_responses
  -> aggregate.submission_totals
  -> aggregate.metric_counts -> aggregate.metric_definitions
  -> aggregate.state -> public.aggregate_revision
```

All direct participant and research records live in the non-exposed `private` schema. Aggregate state lives in the non-exposed `aggregate` schema. The only browser-readable database table is the PII-free `public.aggregate_revision` invalidation record.

## Core business concepts

### Questionnaire definition

| Table | Purpose | Important identifiers |
|---|---|---|
| `private.questionnaire_versions` | Immutable versions of a questionnaire family | `key`, `version`, `status` |
| `private.questions` | Questions belonging to one questionnaire version | `questionnaire_version_id`, stable `key`, `answer_type`, `position` |
| `private.question_options` | Choices belonging to one question | `question_id`, stable `key`, optional `parent_option_id` |

The current production questionnaire is `reset-v1`, version `3`. Each participation stores the exact questionnaire version used, so old responses remain interpretable after a new version is published.

Question and option UUIDs change between questionnaire versions. Reporting across versions must join through stable question and option keys or through `aggregate.metric_definitions`; it must not assume that UUIDs are reusable between versions.

Version 3 includes the version-2 check-in plus the optional private question `today_commitment`. The commitment, custom tags, rituals, and explanatory answers are private text. They are not public aggregate metrics.

### Screening and pathway configuration

`private.screenings` defines where a participant entered the experience and which questionnaire is presented.

Important fields:

| Field | Meaning |
|---|---|
| `slug` | Stable URL identifier, such as `project-reset` or `climate-week-nyc-2026` |
| `status` | `draft`, `active`, or `closed` |
| `questionnaire_version_id` | Questionnaire served by the screening |
| `pathway_type` | Configured `event` or `non_event` pathway |
| `check_in_opens_at` | Inclusive start of event film-access eligibility |
| `check_in_closes_at` | Exclusive end of event film-access eligibility |
| `film_access_ends_at` | Stored event reward-notice value; not proof of KINEMA enforcement |
| `cohort_metadata` | Internal screening metadata, not a public reporting contract |

The database resolves eligibility using its own clock:

```text
non-event screening                         -> trailer_access
event before check_in_opens_at              -> trailer_access
event in [check_in_opens_at, closes_at)     -> film_access
event at or after check_in_closes_at         -> trailer_access
```

The event URL can continue accepting check-ins after its film window closes. Those later submissions remain attributed to the event screening but receive the trailer pathway.

### Participant and participation

`private.participants` is the durable identity record. A trim-and-lowercase normalized email is assumed to identify one participant across screenings. The email is not a primary key and receives no provider-specific alias normalization.

`private.participations` is one completed check-in associated with a participant, screening, and questionnaire version.

Important distinctions:

- One participant can complete more than one screening.
- The model does not currently enforce one film entitlement per participant per event.
- `idempotency_key` prevents a retried browser request from creating a second participation for the same screening.
- `city`, `age_band`, and `occupation` are optional private demographics.
- `entry_pathway`, `event_window_status`, and `reward_type` are frozen at submission time. They record what the participant was eligible to receive at that moment.

Valid committed outcome combinations are:

| `entry_pathway` | `event_window_status` | `reward_type` |
|---|---|---|
| `event` | `active_event` | `film_access` |
| `non_event` | `event_not_started` | `trailer_access` |
| `non_event` | `event_expired` | `trailer_access` |
| `non_event` | `non_event` | `trailer_access` |

### Consent and communications

| Table | Meaning |
|---|---|
| `private.policy_versions` | Versioned participant acknowledgement text |
| `private.consents` | Policy version accepted for one participation and acceptance time |
| `private.communication_preferences` | Optional future-communications choice for one participation |

Data-use consent is required for a successful submission. Future communications are separate and false by default.

Once real participants have accepted a published policy version, materially changing its wording should create a new `policy_versions` row. Existing consent records must continue to identify the wording accepted at the time.

Communications opt-in is not permission to infer consent for unrelated uses, and it does not determine film or trailer access.

### Questionnaire responses

| Table | Purpose |
|---|---|
| `private.responses` | One response container per participation |
| `private.response_selections` | Selected options for single- and multi-choice questions |
| `private.response_answers` | Private text or scalar answers |

Selected choices use `response_selections`. Written reflections and custom participant-created content use `response_answers`.

The following must be treated as private unless a later approved workflow says otherwise:

- participant identity;
- optional demographics;
- `today_commitment`;
- rituals and explanatory answers;
- participant-created burnout and RESET tags;
- any other free-text response.

These values are not returned by the public aggregate API and must not be copied into tickets, ordinary email, public documents, or AI prompts.

### Reward record versus KINEMA access

`private.reward_deliveries` records the application’s transactional reward decision. It does not prove that KINEMA accepted a code or that the participant watched the film.

For the current launch implementation:

- an eligible event submission stores `reward_type = 'film_access'` and a deferred reward-delivery record;
- a non-event, not-yet-open, or expired-event submission stores `reward_type = 'trailer_access'` and an available web reward;
- the application server appends the appropriate server-held KINEMA code only after an eligible submission succeeds;
- the promo code itself is not stored in participant database rows;
- Project RESET does not send the participant a custom email or SMS;
- KINEMA Reports are the source of truth for redemption and viewing activity.

The legacy `channel = 'email'` value on a deferred film record describes the original transactional-delivery model. It must not be interpreted as evidence that Project RESET sent an email.

## Aggregate and public-learning model

### Internal aggregate tables

| Table | Purpose |
|---|---|
| `aggregate.scopes` | Screening, historical seeded-baseline, or future cohort boundary |
| `aggregate.metric_definitions` | Explicit allowlist of public emotions, pathways, and practices |
| `aggregate.metric_counts` | Counts by scope, origin, and approved metric |
| `aggregate.submission_totals` | Completed-response totals by scope and origin |
| `aggregate.processed_responses` | Idempotency and recovery link showing which responses were aggregated |
| `aggregate.state` | Snapshot version and monotonically increasing revision |

Every completed response is aggregated once into its non-overlapping screening scope. Only selected options that match an active `aggregate.metric_definitions` row are counted publicly. Text answers and participant-created tags have no aggregate definition and are therefore excluded.

### Seeded compatibility fields

The API schema retains `seeded`, `observed`, and `combined` fields for backward compatibility. The production Learning Lab renders `observed` values only.

The production operating state is intended to contain genuine observed responses rather than an illustrative seeded baseline. **Verify live:** run the origin-count query in `docs/database-reporting.md` before stating that all seeded counts are zero.

### Public snapshot

`api.get_public_aggregates_v1()` returns a cumulative allowlisted snapshot containing only:

- API, snapshot, revision, and generation metadata;
- total seeded, observed, and combined counts;
- approved emotion, pathway, and practice keys, labels, and counts;
- suppression metadata reserved for future small-scope views.

It contains no participant or screening UUID, identity, free text, demographic record, consent, or communications preference.

The application server validates this database result through a strict schema before returning `GET /api/v1/aggregates` with `Cache-Control: no-store`.

### Realtime behavior

After aggregate state changes, the database updates `public.aggregate_revision(revision, updated_at)`. Browsers subscribe only to this PII-free invalidation row. On a change, the browser fetches the authoritative aggregate snapshot from the application API.

Realtime is a refresh signal, not the source of count data.

## Transaction and integrity guarantees

The database submission function performs the following in one transaction:

1. locks and validates the active screening;
2. resolves the pathway from screening configuration and database time;
3. validates the published questionnaire and consent policy;
4. creates or updates the participant identity;
5. creates the participation and freezes its pathway outcome;
6. stores consent, communications preference, reward intent, and responses;
7. applies the allowlisted aggregate update;
8. increments the public aggregate revision.

If validation or persistence fails, the submission and aggregate mutation roll back together. Replaying the same screening/idempotency key returns the prior committed outcome and does not increase aggregate counts.

`aggregate.rebuild_observed_v1()` can rebuild observed counts from committed responses. It is an administrative recovery operation, not a routine reporting query; submissions should be disabled before it is run.

## Access boundaries

| Actor | Permitted access |
|---|---|
| Browser visitor | Application routes, safe APIs, and `public.aggregate_revision` SELECT |
| Application server | Approved `api` functions through the server-only Supabase secret |
| Supabase administrator | Private and aggregate records through controlled console access |
| Public aggregate API | Cumulative allowlisted totals only |
| KINEMA | Its own account, rental, redemption, and viewing records |

`private` and `aggregate` must remain excluded from browser-facing Supabase Data API exposure. Browser roles must not receive table access to either schema.

## Current production screening specification

The committed migrations define:

| Slug | Pathway | Eligibility window in New York time |
|---|---|---|
| `project-reset` | Non-event | Always trailer access while active |
| `climate-week-nyc-2026` | Event | Active from September 17 through October 6, 2026; closes October 7 at 12:00 a.m. |
| `columbia-climate-school-2026` | Event | October 7 through October 21, 2026; closes October 22 at 12:00 a.m. |
| `preview-event` | Temporary rehearsal | Closes September 22, 2026 at 12:00 a.m.; also requires server-only rehearsal configuration |

Opening and closing timestamps are stored in UTC. Closing timestamps are exclusive.

## Deferred or external capabilities

The current model does not provide:

- a private administrative dashboard;
- automatic Project RESET email or SMS delivery;
- proof of KINEMA redemption or viewing;
- participant self-service access, correction, or deletion;
- an automated retention/deletion schedule;
- public screening-level or demographic filtering;
- conversation-tool analytics;
- a one-entitlement-per-participant/event rule.

These are not implied by the existing tables and require separately approved product, legal, and implementation work.

## Source of truth

- Schema and constraints: `supabase/migrations/`
- Submission behavior: `src/app/api/v1/submissions/route.ts` and `src/services/submissions/`
- Reward-code allowlist: `src/services/rewards/kinema-access.ts`
- Public aggregate validation: `src/lib/validation/aggregate.ts`
- Reporting patterns: `docs/database-reporting.md`
- Operations and ownership: `docs/handover.md`
