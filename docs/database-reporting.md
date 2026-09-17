# Project RESET database reporting and query guide

Last verified against source and migrations: 17 September 2026

This is the canonical guide for routine Project RESET reporting in the Supabase SQL Editor. It serves three audiences:

1. a non-technical operator running approved queries;
2. a developer or analyst writing a new read-only report;
3. an AI assistant asked to draft a query without receiving participant data or credentials.

For a conceptual explanation of the model, read `docs/data-model.md`. For operational ownership and incident procedures, read `docs/handover.md`.

## Non-negotiable safety rules

- Routine reporting queries must begin with `select` or `with` and must not alter the database.
- Never paste Supabase credentials, KINEMA codes, participant records, query results containing personal data, or screenshots of private records into an AI tool.
- Do not use `select *`; request only the columns needed for the stated question.
- Do not expose the `private` or `aggregate` schemas through the Supabase Data API.
- Do not publish a demographic or cohort group containing fewer than five responses.
- Default to aggregate counts. Participant names, emails, written reflections, custom tags, commitments, and individual demographics require an approved purpose and a separate controlled workflow.
- Use KINEMA Reports—not Project RESET—to report code redemption, rentals, or viewing.
- The saved questions in Continue the Conversation remain on the participant’s device and are not stored in this database.
- Review every AI-generated query before running it. An AI assistant is a drafting aid, not an authorization mechanism.

## How to run an approved query

1. Sign in to Supabase and open the Project RESET project.
2. Select **SQL Editor**.
3. Select **New query**.
4. Paste one query block from this guide.
5. Confirm it contains only `select` or `with` statements.
6. Select **Run**, or press `Command + Enter` on macOS or `Control + Enter` on Windows.
7. Review the Results panel before exporting anything.
8. Export CSV only when the result is genuinely required and has an approved storage location.

**Save query** stores the SQL for reuse. It does not commit, publish, or save the returned data.

## Reporting vocabulary

Use these definitions consistently:

| Term | Database meaning |
|---|---|
| Participant | One durable identity in `private.participants`, deduplicated by trim-and-lowercase email |
| Check-in | One completed `private.participations` row with its associated response |
| Screening | Entry context represented by `private.screenings`, usually a general or event-specific route |
| Film access offered | A participation committed with `reward_type = 'film_access'` |
| Trailer outcome | A participation committed with `reward_type = 'trailer_access'` |
| Redemption/view | A KINEMA event; not available in the Project RESET database |
| Communications opt-in | `future_communications_allowed = true`; separate from required data-use consent |
| Observed count | Count derived from genuine committed responses |
| Seeded count | Historical illustrative aggregate value; retained in schema for compatibility |
| Public metric | A selected option explicitly allowlisted by `aggregate.metric_definitions` |

A film-access record proves only that the application offered access after an eligible check-in. It does not prove that the code was copied, redeemed, or watched.

## Schema and join map for query authors

### Screening and completion

```text
private.screenings.id
  -> private.participations.screening_id

private.participants.id
  -> private.participations.participant_id

private.participations.id
  -> private.responses.participation_id
  -> private.consents.participation_id
  -> private.communication_preferences.participation_id
  -> private.reward_deliveries.participation_id
```

### Questionnaire answers

```text
private.responses.id
  -> private.response_selections.response_id
      -> private.questions.id via question_id
      -> private.question_options.id via option_id

private.responses.id
  -> private.response_answers.response_id
      -> private.questions.id via question_id
```

`questions.key` and `question_options.key` are the stable semantic identifiers. UUIDs are version-specific.

### Public aggregate definitions

```text
private.screenings.id
  -> aggregate.scopes.screening_id
      -> aggregate.submission_totals.scope_id
      -> aggregate.metric_counts.scope_id

aggregate.metric_counts.metric_definition_id
  -> aggregate.metric_definitions.id
```

For cross-version reporting of burnout experiences, pathways, or practices, prefer `aggregate.metric_definitions`. It maps stable question/option keys to the approved public metric and current label.

## Table and field dictionary

### Frequently used private tables

| Table | Useful fields | Reporting use |
|---|---|---|
| `private.screenings` | `id`, `slug`, `name`, `status`, `pathway_type`, opening/closing timestamps | Filter and group check-ins by route or event |
| `private.participations` | `id`, `participant_id`, `screening_id`, `submitted_at`, `entry_pathway`, `event_window_status`, `reward_type`, optional demographics | Canonical completed check-in and eligibility outcome |
| `private.participants` | `id`, identity fields | Restricted identity lookup; not routine aggregate reporting |
| `private.responses` | `id`, `participation_id`, `questionnaire_version_id` | Connect participation to selections and private answers |
| `private.response_selections` | `response_id`, `question_id`, `option_id` | Count selected choices |
| `private.response_answers` | `response_id`, `question_id`, text/scalar value | Restricted private written responses; exclude from ordinary reporting |
| `private.communication_preferences` | `participation_id`, `future_communications_allowed` | Aggregate opt-in totals |
| `private.consents` | `participation_id`, `policy_version_id`, `accepted_at` | Consent audit |
| `private.policy_versions` | `id`, `version`, `acknowledgement_text`, `status` | Identify accepted policy wording |
| `private.reward_deliveries` | `participation_id`, `reward_type`, `status`, `channel` | Internal application reward intent, not KINEMA redemption |

### Frequently used aggregate tables

| Table | Useful fields | Reporting use |
|---|---|---|
| `aggregate.scopes` | `scope_type`, `scope_key`, `screening_id`, `include_in_cumulative` | Connect aggregate rows to screening or origin |
| `aggregate.metric_definitions` | `category`, `metric_key`, `label`, source keys, `is_active` | Stable public metric dictionary |
| `aggregate.metric_counts` | `scope_id`, `data_origin`, `metric_definition_id`, `count` | Precomputed allowlisted choice counts |
| `aggregate.submission_totals` | `scope_id`, `data_origin`, `count` | Precomputed check-in totals |
| `aggregate.processed_responses` | `response_id`, `scope_id` | Integrity check for aggregate processing |
| `aggregate.state` | `revision`, `snapshot_version`, `updated_at` | Aggregate snapshot status |

## Time and grouping rules

- Database timestamps are stored as `timestamptz` and should be treated as UTC internally.
- Event-day reports should normally group in `America/New_York`, because both launch events are in New York.
- State the timezone in the result column name, such as `day_new_york`.
- Event closing timestamps are exclusive: a submission at the exact closing instant receives the trailer pathway.
- For rolling reports, state the interval explicitly, such as the preceding 24 hours.

## How to design a new report

Before writing SQL, answer these questions:

1. **Question:** What decision will this report support?
2. **Grain:** Should each row represent a screening, day, five-minute interval, metric, or policy version?
3. **Population:** Which screenings and time range are included?
4. **Measure:** Are you counting check-ins, unique participants, selections, film offers, or opt-ins?
5. **Timezone:** UTC or New York time?
6. **Privacy:** Could the grouping reveal a person or a group smaller than five?
7. **Source of truth:** Is the question answered by Project RESET or by KINEMA?

Then follow this pattern:

```sql
with filtered_participations as (
  select
    participation.id,
    participation.screening_id,
    participation.submitted_at
  from private.participations participation
  join private.screenings screening
    on screening.id = participation.screening_id
  where screening.slug = 'approved-screening-slug'
    and participation.submitted_at >= timestamptz 'YYYY-MM-DD HH:MI:SS+00'
    and participation.submitted_at <  timestamptz 'YYYY-MM-DD HH:MI:SS+00'
)
select count(*) as completed_check_ins
from filtered_participations;
```

Use `count(distinct participant_id)` only when the question is genuinely about unique people. Normal check-in reporting uses `count(participation.id)` because the same participant may complete more than one screening.

## Prompt template for Claude or another AI assistant

Give the assistant this document and `docs/data-model.md`, then use a prompt like:

```text
You are helping draft a read-only PostgreSQL query for the Project RESET Supabase database.

Treat the attached Project RESET data-model and database-reporting documents as authoritative. First restate the reporting question, result grain, filters, measure, timezone, privacy risk, and whether Project RESET or KINEMA is the correct source of truth.

Requirements:
- Produce only a SELECT or WITH...SELECT query.
- Never produce INSERT, UPDATE, DELETE, MERGE, TRUNCATE, DROP, ALTER, CREATE, GRANT, REVOKE, CALL, DO, or a mutating function invocation.
- Do not use SELECT *.
- Do not query participant names, emails, mobile numbers, free-text responses, custom tags, commitments, or individual demographics unless I explicitly confirm an approved private-data purpose.
- Do not expose groups smaller than five.
- Use stable question/option keys or aggregate.metric_definitions across questionnaire versions; do not join historical answers by assuming UUIDs are stable.
- Use America/New_York for event-day grouping unless I request UTC.
- Distinguish check-ins, unique participants, film access offered, communications opt-in, and KINEMA redemption.
- Add a short explanation of every join and filter.
- Include a validation query or sanity check when useful.
- If the request is ambiguous or cannot be answered safely from this database, stop and explain what clarification or external source is required.

Reporting question: [INSERT THE QUESTION HERE]
```

Do not paste query results back into the AI assistant if they contain private or small-group data.

## AI-generated query review checklist

Before running a generated query, confirm:

- [ ] It contains only `select` or `with` statements.
- [ ] It does not invoke `aggregate.rebuild_observed_v1()` or another state-changing function.
- [ ] It does not request names, email, mobile, free text, custom tags, commitments, or raw individual demographics.
- [ ] Every table has a clear reason to be present.
- [ ] Historical choices are joined by stable keys or metric definitions.
- [ ] The screening and date filters match the question.
- [ ] The timezone is explicit.
- [ ] The result grain is understandable and will not double-count joins.
- [ ] Small groups are suppressed or withheld.
- [ ] KINEMA-only conclusions are not inferred from Project RESET reward records.

## Approved query library

Run one query block at a time.

### 1. Confirm launch screening configuration

```sql
select
  screening.slug,
  screening.name,
  screening.status,
  screening.pathway_type,
  questionnaire.version as questionnaire_version,
  timezone('America/New_York', screening.check_in_opens_at) as opens_new_york,
  timezone('America/New_York', screening.check_in_closes_at) as closes_new_york,
  screening.check_in_opens_at as opens_utc,
  screening.check_in_closes_at as closes_utc
from private.screenings screening
join private.questionnaire_versions questionnaire
  on questionnaire.id = screening.questionnaire_version_id
where screening.slug in (
  'climate-week-nyc-2026',
  'columbia-climate-school-2026'
)
order by screening.check_in_opens_at;
```

Expected migration configuration:

- Climate Week is active from September 17 and closes October 7 at midnight New York time.
- Columbia opens October 7 and closes October 22 at midnight New York time.
- Both use questionnaire version 3.

### 2. Completed check-ins by screening

```sql
select
  screening.slug,
  screening.name,
  count(participation.id) as completed_check_ins,
  min(participation.submitted_at) as first_check_in_utc,
  max(participation.submitted_at) as latest_check_in_utc
from private.screenings screening
left join private.participations participation
  on participation.screening_id = screening.id
group by screening.id
order by completed_check_ins desc, screening.name;
```

### 3. Event check-ins by access outcome

```sql
select
  screening.slug,
  participation.event_window_status,
  participation.reward_type,
  count(*) as completed_check_ins
from private.participations participation
join private.screenings screening
  on screening.id = participation.screening_id
where screening.slug in (
  'climate-week-nyc-2026',
  'columbia-climate-school-2026'
)
group by
  screening.slug,
  participation.event_window_status,
  participation.reward_type
order by screening.slug, participation.event_window_status;
```

`film_access` means access was offered. Use KINEMA Reports to determine whether a code was redeemed or watched.

### 4. Check-in volume by day

```sql
select
  timezone('America/New_York', participation.submitted_at)::date as day_new_york,
  screening.slug,
  count(*) as completed_check_ins
from private.participations participation
join private.screenings screening
  on screening.id = participation.screening_id
group by day_new_york, screening.slug
order by day_new_york desc, screening.slug;
```

### 5. Live event volume in five-minute intervals

```sql
select
  screening.slug,
  date_bin(
    interval '5 minutes',
    participation.submitted_at,
    timestamptz '2000-01-01 00:00:00+00'
  ) as five_minute_window_utc,
  count(*) as completed_check_ins
from private.participations participation
join private.screenings screening
  on screening.id = participation.screening_id
where participation.submitted_at >= now() - interval '24 hours'
group by screening.slug, five_minute_window_utc
order by five_minute_window_utc desc, screening.slug;
```

### 6. Most selected burnout experiences

Use the aggregate definition to combine stable choices across questionnaire versions:

```sql
select
  definition.metric_key,
  definition.label,
  count(*) as selections
from private.response_selections selection
join private.questions question on question.id = selection.question_id
join private.question_options option on option.id = selection.option_id
join aggregate.metric_definitions definition
  on definition.source_question_key = question.key
 and definition.source_option_key = option.key
 and definition.category = 'emotions'
 and definition.is_active
where question.key = 'burnout_signs'
group by definition.id
order by selections desc, definition.label;
```

To inspect the historical version split without combining versions:

```sql
select
  questionnaire.version,
  option.key as stable_option_key,
  option.label,
  count(*) as selections
from private.response_selections selection
join private.questions question on question.id = selection.question_id
join private.questionnaire_versions questionnaire
  on questionnaire.id = question.questionnaire_version_id
join private.question_options option on option.id = selection.option_id
where question.key = 'burnout_signs'
group by questionnaire.version, option.key, option.label
order by option.key, questionnaire.version;
```

Repeated keys across different version numbers are expected historical definitions, not duplicate selections.

### 7. Most selected RESET pathways

```sql
select
  definition.metric_key,
  definition.label,
  count(*) as selections
from private.response_selections selection
join private.questions question on question.id = selection.question_id
join private.question_options option on option.id = selection.option_id
join aggregate.metric_definitions definition
  on definition.source_question_key = question.key
 and definition.source_option_key = option.key
 and definition.category = 'pathways'
 and definition.is_active
where question.key = 'reset_pathways'
group by definition.id
order by selections desc, definition.label;
```

### 8. Most selected RESET practices

```sql
select
  definition.metric_key,
  definition.label,
  count(*) as selections
from private.response_selections selection
join private.questions question on question.id = selection.question_id
join private.question_options option on option.id = selection.option_id
join aggregate.metric_definitions definition
  on definition.source_question_key = question.key
 and definition.source_option_key = option.key
 and definition.category = 'practices'
 and definition.is_active
where question.key = 'reset_practices'
group by definition.id
order by selections desc, definition.label;
```

### 9. Communications opt-in totals by screening

```sql
select
  screening.slug,
  preference.future_communications_allowed,
  count(*) as participants
from private.communication_preferences preference
join private.participations participation
  on participation.id = preference.participation_id
join private.screenings screening
  on screening.id = participation.screening_id
group by screening.slug, preference.future_communications_allowed
order by screening.slug, preference.future_communications_allowed desc;
```

This reports totals only. Contacting individual people requires an approved purpose and a separately controlled export.

### 10. Consent audit by policy version

```sql
select
  policy.version,
  policy.status,
  policy.acknowledgement_text,
  count(consent.id) as accepted_count,
  min(consent.accepted_at) as first_acceptance,
  max(consent.accepted_at) as latest_acceptance
from private.policy_versions policy
left join private.consents consent
  on consent.policy_version_id = policy.id
group by policy.id
order by policy.created_at desc;
```

### 11. Data-integrity health check

Every result should normally be zero.

```sql
select
  (select count(*)
   from private.participations participation
   left join private.responses response
     on response.participation_id = participation.id
   where response.id is null) as missing_responses,
  (select count(*)
   from private.participations participation
   left join private.consents consent
     on consent.participation_id = participation.id
   where consent.id is null) as missing_consents,
  (select count(*)
   from private.participations participation
   left join private.communication_preferences preference
     on preference.participation_id = participation.id
   where preference.id is null) as missing_preferences,
  (select count(*)
   from private.participations participation
   left join private.reward_deliveries reward
     on reward.participation_id = participation.id
   where reward.id is null) as missing_rewards,
  (select count(*)
   from private.responses response
   left join aggregate.processed_responses processed
     on processed.response_id = response.id
   where processed.response_id is null) as missing_aggregate_processing;
```

### 12. Confirm private-data security boundaries

Expected result: all four values are `false`.

```sql
select
  has_schema_privilege('anon', 'private', 'usage') as anon_private_schema_usage,
  has_table_privilege('anon', 'private.participants', 'select') as anon_participant_select,
  has_table_privilege('authenticated', 'private.responses', 'select') as authenticated_response_select,
  has_schema_privilege('anon', 'aggregate', 'usage') as anon_aggregate_schema_usage;
```

### 13. Verify observed versus seeded aggregate state

Run this before describing the production Learning Lab as containing no illustrative seeded data.

```sql
select
  scope.scope_type,
  scope.scope_key,
  total.data_origin,
  total.count
from aggregate.submission_totals total
join aggregate.scopes scope on scope.id = total.scope_id
order by scope.scope_type, scope.scope_key, total.data_origin;
```

The production interface renders observed counts. After the approved cleanup, no non-zero seeded total should remain.

### 14. Compare raw completed responses with processed aggregates

This provides a simple count-level reconciliation.

```sql
select
  (select count(*) from private.responses) as stored_responses,
  (select count(*) from aggregate.processed_responses) as processed_responses,
  (select coalesce(sum(count), 0)
   from aggregate.submission_totals
   where data_origin = 'observed') as observed_aggregate_total;
```

All three values should normally agree. If they do not, stop and investigate before publishing totals. Do not run the rebuild function as a routine response.

## Questions this database cannot answer alone

Do not invent a query for questions owned by another system or not collected by the product:

| Question | Correct source or status |
|---|---|
| Was the promo code redeemed? | KINEMA Reports |
| Did the participant watch or finish the film? | KINEMA Reports |
| Which Continue the Conversation questions were saved? | Not collected; stays on participant device |
| Did someone click the external conversation link? | Not currently tracked |
| Did Project RESET email the participant? | It does not send a custom participant email in Phase 1 |
| When should a participant record be automatically deleted? | Retention policy and automation are not yet implemented |

## Future dashboard boundary

A future dashboard may present approved aggregates, date and screening filters, operational integrity checks, and a clearly separate KINEMA panel. It should be a private authenticated product with an administrator allowlist and server-side reporting functions. It must not give the browser direct access to `private` tables.

Until reporting needs stabilize, this reviewed SQL library is the lower-risk operational interface.
