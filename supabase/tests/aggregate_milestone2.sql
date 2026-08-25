-- Run with psql/Supabase SQL Editor after migrations and seeds. The transaction rolls back.
begin;

do $aggregate_test$
declare
  source_screening private.screenings%rowtype;
  second_screening_id uuid;
  first_idempotency uuid := gen_random_uuid();
  second_idempotency uuid := gen_random_uuid();
  first_payload jsonb;
  second_payload jsonb;
  before_snapshot jsonb;
  after_first jsonb;
  after_replay jsonb;
  after_second jsonb;
  seeded_before bigint;
  first_scope_count bigint;
  second_scope_count bigint;
  published_unsafe integer;
begin
  select * into strict source_screening
  from private.screenings
  where slug = 'preview-screening';

  select api.get_public_aggregates_v1() into before_snapshot;
  seeded_before := (before_snapshot #>> '{totals,seeded}')::bigint;

  first_payload := jsonb_build_object(
    'apiVersion', '1',
    'idempotencyKey', first_idempotency,
    'screeningSlug', source_screening.slug,
    'participant', jsonb_build_object(
      'firstName', 'Aggregate Test',
      'email', 'aggregate-' || first_idempotency || '@example.invalid'
    ),
    'demographics', '{}'::jsonb,
    'consent', jsonb_build_object('dataUseAccepted', true, 'policyVersion', 'reset_data_use_v1'),
    'communication', jsonb_build_object('futureCommunicationsAllowed', false),
    'answers', jsonb_build_array(
      jsonb_build_object('questionKey', 'burnout_signs', 'optionKeys', jsonb_build_array('exhausted')),
      jsonb_build_object('questionKey', 'burnout_custom_tags', 'text', 'private-test-tag-never-public'),
      jsonb_build_object('questionKey', 'reset_pathways', 'optionKeys', jsonb_build_array('restore')),
      jsonb_build_object('questionKey', 'reset_practices', 'optionKeys', jsonb_build_array('sleep'))
    )
  );

  perform api.submit_participation_v1(first_payload);
  select api.get_public_aggregates_v1() into after_first;

  if (after_first #>> '{totals,observed}')::bigint
      <> (before_snapshot #>> '{totals,observed}')::bigint + 1 then
    raise exception 'aggregate submission total did not increment';
  end if;

  if (after_first ->> 'revision')::bigint <> (before_snapshot ->> 'revision')::bigint + 1 then
    raise exception 'aggregate revision did not increment exactly once';
  end if;

  if after_first::text like '%private-test-tag-never-public%' then
    raise exception 'free text leaked into public snapshot';
  end if;

  if (after_first #>> '{totals,seeded}')::bigint <> seeded_before then
    raise exception 'seeded baseline changed after observed submission';
  end if;

  perform api.submit_participation_v1(first_payload);
  select api.get_public_aggregates_v1() into after_replay;
  if after_replay <> after_first then
    -- generatedAt changes on each call, so compare authoritative state fields only.
    if (after_replay ->> 'revision')::bigint <> (after_first ->> 'revision')::bigint
       or after_replay -> 'totals' <> after_first -> 'totals'
       or after_replay -> 'metrics' <> after_first -> 'metrics' then
      raise exception 'idempotent replay changed aggregate state';
    end if;
  end if;

  insert into private.screenings (
    slug, name, institution, status, questionnaire_version_id, cohort_metadata
  ) values (
    'aggregate-test-screening', 'Aggregate Test Screening', 'Test only', 'active',
    source_screening.questionnaire_version_id, '{"test":true}'::jsonb
  ) returning id into second_screening_id;

  second_payload := jsonb_set(first_payload, '{idempotencyKey}', to_jsonb(second_idempotency::text));
  second_payload := jsonb_set(second_payload, '{screeningSlug}', '"aggregate-test-screening"'::jsonb);
  second_payload := jsonb_set(
    second_payload,
    '{participant,email}',
    to_jsonb(('aggregate-' || second_idempotency || '@example.invalid')::text)
  );

  perform api.submit_participation_v1(second_payload);
  select api.get_public_aggregates_v1() into after_second;

  select total.count into strict first_scope_count
  from aggregate.submission_totals total
  join aggregate.scopes scope on scope.id = total.scope_id
  where scope.screening_id = source_screening.id and total.data_origin = 'observed';

  select total.count into strict second_scope_count
  from aggregate.submission_totals total
  join aggregate.scopes scope on scope.id = total.scope_id
  where scope.screening_id = second_screening_id and total.data_origin = 'observed';

  if second_scope_count <> 1 then
    raise exception 'screening-specific aggregate is incorrect';
  end if;

  if (after_second #>> '{totals,observed}')::bigint
      <> (after_first #>> '{totals,observed}')::bigint + 1 then
    raise exception 'cumulative total did not include the second screening exactly once';
  end if;

  if after_second ? 'screening' or after_second ? 'participantId' or after_second ? 'email' then
    raise exception 'public snapshot contains a forbidden top-level field';
  end if;

  if not has_table_privilege('anon', 'public.aggregate_revision', 'select')
     or has_table_privilege('anon', 'public.aggregate_revision', 'insert')
     or has_table_privilege('anon', 'public.aggregate_revision', 'update')
     or has_table_privilege('anon', 'public.aggregate_revision', 'delete') then
    raise exception 'browser revision grants are incorrect';
  end if;

  if has_table_privilege('anon', 'private.participants', 'select')
     or has_table_privilege('authenticated', 'private.responses', 'select')
     or has_schema_privilege('anon', 'aggregate', 'usage') then
    raise exception 'raw/aggregate tables are exposed to a browser role';
  end if;

  select count(*) into published_unsafe
  from pg_publication_tables
  where pubname = 'supabase_realtime'
    and (schemaname = 'private' or schemaname = 'aggregate');

  if published_unsafe <> 0 then
    raise exception 'raw or aggregate-count tables are present in realtime publication';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'aggregate_revision'
  ) then
    raise exception 'PII-free revision resource is missing from realtime publication';
  end if;

  if first_scope_count < 1 then
    raise exception 'original screening aggregate was not retained';
  end if;
end
$aggregate_test$;

rollback;
