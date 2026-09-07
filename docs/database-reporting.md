# Project RESET database reporting guide

Last verified: 7 September 2026

This guide covers routine, read-only reporting in the Supabase SQL Editor. It intentionally avoids participant names, email addresses, private written reflections, custom responses, and individual-level demographic records.

## Privacy and interpretation

- Treat all database access as confidential, even when a query returns only totals.
- Run only one query block at a time until you are comfortable with the SQL Editor.
- The queries below are read-only. They begin with `select` or `with` and do not alter data.
- Do not expose the `private` or `aggregate` schemas through the Supabase Data API.
- Do not publish demographic groups containing fewer than five responses.
- A Project RESET `film_access` record means the participant was offered KINEMA access after an eligible check-in. It does not prove that the code was redeemed or the film was watched. KINEMA Reports are the source of truth for redemption and viewing activity.
- The saved questions in Continue the Conversation remain on the participant's device and are not present in this database.

## How to run a query

1. Sign in to Supabase and open the Project RESET project.
2. Select **SQL Editor** in the left navigation.
3. Select **New query**.
4. Paste one query block from this guide.
5. Select **Run**, or press `Command + Enter` on macOS or `Control + Enter` on Windows.
6. Review the Results panel. Use its CSV export only when the result is genuinely needed and can be stored securely.

Running a query does not require a separate Save action. **Save query** stores the SQL itself in Supabase for reuse; it does not save or commit database results.

## 1. Confirm launch screening configuration

This shows the production event windows in both New York time and UTC.

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

Expected configuration:

- Climate Week NYC opens September 22 and closes October 7 at midnight New York time.
- Columbia Climate School opens October 7 and closes October 22 at midnight New York time.
- Both use questionnaire version 3.

## 2. Completed check-ins by screening

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

## 3. Event check-ins by access outcome

This distinguishes check-ins that received the film pathway from those that received the trailer pathway because the event window had not opened or had already closed.

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

`film_access` means access was offered. Use KINEMA Reports to determine whether the promo code was redeemed.

## 4. Check-in volume by day

Days are grouped in New York time rather than UTC.

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

## 5. Live event volume in five-minute intervals

Use this during or immediately after an event to check whether submissions are arriving. It covers the preceding 24 hours.

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

## 6. Most selected burnout experiences

```sql
select
  option.label,
  count(*) as selections
from private.response_selections selection
join private.questions question on question.id = selection.question_id
join private.question_options option on option.id = selection.option_id
where question.key = 'burnout_signs'
group by option.id
order by selections desc, option.label;
```

## 7. Most selected RESET pathways

```sql
select
  option.label,
  count(*) as selections
from private.response_selections selection
join private.questions question on question.id = selection.question_id
join private.question_options option on option.id = selection.option_id
where question.key = 'reset_pathways'
group by option.id
order by selections desc, option.label;
```

## 8. Most selected RESET practices

```sql
select
  option.label,
  count(*) as selections
from private.response_selections selection
join private.questions question on question.id = selection.question_id
join private.question_options option on option.id = selection.option_id
where question.key = 'reset_practices'
group by option.id
order by selections desc, option.label;
```

## 9. Communications opt-in totals by screening

This reports totals only. A separate, access-controlled export is required if the Foundation has an approved reason to contact particular people.

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

## 10. Consent audit by policy version

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

## 11. Data-integrity health check

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

## 12. Confirm private-data security boundaries

Expected result: all four values are `false`.

```sql
select
  has_schema_privilege('anon', 'private', 'usage') as anon_private_schema_usage,
  has_table_privilege('anon', 'private.participants', 'select') as anon_participant_select,
  has_table_privilege('authenticated', 'private.responses', 'select') as authenticated_response_select,
  has_schema_privilege('anon', 'aggregate', 'usage') as anon_aggregate_schema_usage;
```

## Dashboard concept

A future internal dashboard could present:

1. Date and screening filters.
2. Completed check-ins, check-ins today, film-access offers, trailer outcomes, and communications opt-in rate.
3. A check-in volume chart for event operations.
4. Ranked burnout experiences, RESET pathways, and RESET practices.
5. Broad demographic summaries with groups smaller than five suppressed.
6. Event-window status, database-integrity checks, and the current consent version.
7. A clearly separate KINEMA panel populated from KINEMA Reports, labelled as redemptions or views rather than Project RESET check-ins.

The recommended implementation is a private admin route protected by authentication and an explicit administrator allowlist. The browser should call server-only reporting functions that return approved aggregates; it should never receive direct access to the `private` schema. Private written responses and participant identities should not appear on the default dashboard. If the Foundation later approves individual-level research access, that should be a separate, audited workflow.

For launch, this SQL guide is lower-risk and easier to validate than adding a new authenticated product surface. A dashboard should be treated as a separate scoped phase after the team knows which reports it actually uses.
