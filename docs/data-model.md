# Data model

Last verified: 29 August 2026

## Raw research model

All raw records live in the non-exposed `private` schema. A participant is a durable identity; a participation is one completed questionnaire associated with a screening and questionnaire version.

One trim-and-lowercase normalized email is assumed to identify one participant across screenings. This is enforced by a unique constraint. Email is not a primary key and receives no provider-specific transformation.

- `participants`: direct identity.
- `participations`: screening relationship and approved optional demographics.
- `consents`: accepted policy version and timestamp.
- `communication_preferences`: optional future communications, false by default.
- `responses`, `response_selections`, `response_answers`: substantive questionnaire data.
- `reward_deliveries`: transactional reward intent, independent of marketing preference.

### Entry pathway and reward snapshots

`private.screenings` now carries the authoritative pathway configuration:

- `pathway_type`: `event` or `non_event`;
- `check_in_opens_at`: optional inclusive event eligibility start;
- `check_in_closes_at`: required exclusive event eligibility end for event pathways;
- `film_access_ends_at`: required expiry attached to a qualifying film reward.

`private.participations` stores the committed `entry_pathway`, `event_window_status` and `reward_type`. This is a historical decision snapshot, not a browser preference. Expired and not-yet-open event URLs store `non_event`/`trailer_access` while retaining their original `screening_id`.

`private.reward_deliveries` stores `reward_type` and `access_expires_at`. Film rewards use an email channel with deferred status until KINEMA delivery is implemented. Trailer rewards use a web channel with available status. Marketing consent does not control either transactional reward.

The model permits the same participant to complete multiple screenings and does not yet impose one entitlement per participant/event. That business rule is deferred pending KINEMA and Foundation confirmation.

Rituals, explanatory answers and participant-created tags are private text answers. They are never read by the aggregate updater.

### Participant-created tag representation

- `burnout_custom_tags` and `reset_custom_tags` remain questionnaire text questions in `private.questions`.
- The frontend trims only leading/trailing whitespace, preserves internal spacing, spelling, punctuation and non-ASCII wording, deduplicates within the answer and allows at most six tags of 60 characters per question.
- Tags are serialized as newline-delimited `text_value` in `private.response_answers`, so they retain their question association without creating public metric definitions.
- They are not canonicalized, alias-matched, clustered, moderated, copied to `metric_definitions`, returned by the aggregate API, displayed in the Learning Lab or included in the share card.

`private.policy_versions.reset_data_use_v1_us` contains the U.S.-English acknowledgement. The earlier `reset_data_use_v1` row remains intact so prior consent provenance is not rewritten.

## Aggregate model

Aggregate state is physically separated into the non-exposed `aggregate` schema.

- `scopes`: screening, canonical seeded-baseline or future cohort boundaries.
- `metric_definitions`: the explicit public allowlist for emotions, pathways and practices.
- `metric_counts`: counts by scope, origin and approved metric.
- `submission_totals`: completed-response totals by scope and origin.
- `processed_responses`: private idempotency/recovery bridge preventing a response from being aggregated twice.
- `state`: global snapshot version and monotonically increasing revision.

`public.aggregate_revision` is a PII-free singleton invalidation resource. A unique constant-expression index enforces one row, and the revision function uses an explicit row-targeting `WHERE` clause so Supabase API safe-update protections do not reject the transaction.

`data_origin` is always `seeded` or `observed`. Database triggers enforce that seeded rows can exist only in the canonical seeded-baseline scope and observed rows cannot use that scope.

## Cumulative invariants

These are correctness and privacy rules, not presentation conventions:

1. There is exactly one seeded-baseline scope, enforced by a partial unique index.
2. Seeded values are inserted directly into aggregate tables. They never create fake participants, participations or responses.
3. Seed data is never copied into screening scopes.
4. Observed cumulative totals sum only non-overlapping `screening` scopes with `include_in_cumulative = true`.
5. Future `cohort` scopes must have `include_in_cumulative = false`, enforced by the scope constraint, because cohorts may overlap screenings.
6. Screening scopes always reference one internal screening and contribute to the cumulative observed total exactly once.
7. `aggregate.apply_observed_submission_v1` updates only allowlisted selected options.
8. Failed transactions and replayed idempotency keys do not update aggregates or revision.
9. `aggregate.rebuild_observed_v1` replaces observed counts from committed raw data while preserving the canonical seeded baseline.

Public small-scope/cohort views, if approved later, have a minimum observed cell size of five. Public v1 exposes only the cumulative scope, so a small new screening contribution updates the community total without revealing the individual screening delta.

## Public contract

The cumulative snapshot contains only:

- snapshot and revision metadata;
- minimum-cell-size metadata;
- seeded, observed and combined participation totals;
- allowlisted metric keys, labels and seeded/observed/combined counts;
- a suppression flag reserved for future small-scope views.

It contains no screening UUID, participant UUID, identity, free text, raw response, demographic, consent or communication-preference data.
