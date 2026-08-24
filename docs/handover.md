# Handover and verification

## Verify a test submission in Supabase SQL Editor

Use a test email created only for preview. After completing `/s/preview-screening`, run:

```sql
select p.id, p.first_name, p.normalized_email, p.created_at
from private.participants p
where p.normalized_email = lower(trim('YOUR_TEST_EMAIL'));

select pa.id, s.slug, qv.key, qv.version, pa.city, pa.age_band, pa.occupation, pa.submitted_at
from private.participations pa
join private.participants p on p.id = pa.participant_id
join private.screenings s on s.id = pa.screening_id
join private.questionnaire_versions qv on qv.id = pa.questionnaire_version_id
where p.normalized_email = lower(trim('YOUR_TEST_EMAIL'));

select c.data_use_accepted, pv.version, c.accepted_at,
       cp.future_communications_allowed,
       rd.channel, rd.status
from private.participations pa
join private.participants p on p.id = pa.participant_id
join private.consents c on c.participation_id = pa.id
join private.policy_versions pv on pv.id = c.policy_version_id
join private.communication_preferences cp on cp.participation_id = pa.id
join private.reward_deliveries rd on rd.participation_id = pa.id
where p.normalized_email = lower(trim('YOUR_TEST_EMAIL'));

select q.key as question, qo.key as selected_option, ra.text_value
from private.participations pa
join private.participants p on p.id = pa.participant_id
join private.responses r on r.participation_id = pa.id
join private.questions q on q.questionnaire_version_id = pa.questionnaire_version_id
left join private.response_selections rs on rs.response_id = r.id and rs.question_id = q.id
left join private.question_options qo on qo.id = rs.option_id
left join private.response_answers ra on ra.response_id = r.id and ra.question_id = q.id
where p.normalized_email = lower(trim('YOUR_TEST_EMAIL'))
  and (qo.id is not null or ra.id is not null)
order by q.position, qo.position;
```

Confirm the screening slug, policy version, preference, deferred email reward and selected answers are correct. Do not copy PII or free text into tickets or chat.

## Verify database security

Run this separately in the SQL Editor:

```sql
select
  p.proname,
  p.prosecdef as security_definer,
  has_function_privilege('service_role', p.oid, 'execute') as server_execute,
  has_function_privilege('anon', p.oid, 'execute') as anon_execute,
  has_function_privilege('authenticated', p.oid, 'execute') as authenticated_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'api'
order by p.proname;
```

Both functions must show `security_definer = false`, `server_execute = true`, and both browser execution columns as `false`. In **Data API → Settings**, confirm `api` is included, `private` is excluded, and exposed tables/functions both remain at zero.
