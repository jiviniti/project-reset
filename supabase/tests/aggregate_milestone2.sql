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
  after_failure jsonb;
  failed_payload jsonb;
  seeded_before bigint;
  first_scope_count bigint;
  second_scope_count bigint;
  published_unsafe integer;
  stored_custom_tag text;
  screening_snapshot jsonb;
  less_social_before bigint;
  less_social_after bigint;
begin
  select * into strict source_screening
  from private.screenings
  where slug = 'preview-screening';

  select api.get_public_aggregates_v1() into before_snapshot;
  seeded_before := (before_snapshot #>> '{totals,seeded}')::bigint;

  select api.get_screening_v1(source_screening.slug) into screening_snapshot;
  if (screening_snapshot ->> 'questionnaireVersion')::integer <> 2
     or screening_snapshot::text not like '%Less social media%'
     or screening_snapshot::text not like '%In-person meetings%'
     or screening_snapshot::text like '%Fruit & veg%' then
    raise exception 'questionnaire v2 public configuration is incorrect';
  end if;

  select coalesce((metric ->> 'observed')::bigint, 0) into strict less_social_before
  from jsonb_array_elements(before_snapshot #> '{metrics,practices}') metric
  where metric ->> 'key' = 'less_social_media';

  first_payload := jsonb_build_object(
    'apiVersion', '1',
    'idempotencyKey', first_idempotency,
    'screeningSlug', source_screening.slug,
    'participant', jsonb_build_object(
      'firstName', 'Aggregate Test',
      'email', 'aggregate-' || first_idempotency || '@example.invalid'
    ),
    'demographics', '{}'::jsonb,
    'consent', jsonb_build_object('dataUseAccepted', true, 'policyVersion', 'reset_data_use_v1_us'),
    'communication', jsonb_build_object('futureCommunicationsAllowed', false),
    'answers', jsonb_build_array(
      jsonb_build_object('questionKey', 'burnout_signs', 'optionKeys', jsonb_build_array('exhausted')),
      jsonb_build_object('questionKey', 'burnout_custom_tags', 'text', 'private-test-tag-never-public'),
      jsonb_build_object('questionKey', 'reset_pathways', 'optionKeys', jsonb_build_array('restore')),
      jsonb_build_object('questionKey', 'reset_practices', 'optionKeys', jsonb_build_array('sleep', 'less_social_media'))
    )
  );

  perform api.submit_participation_v1(first_payload);
  select api.get_public_aggregates_v1() into after_first;

  select coalesce((metric ->> 'observed')::bigint, 0) into strict less_social_after
  from jsonb_array_elements(after_first #> '{metrics,practices}') metric
  where metric ->> 'key' = 'less_social_media';

  if less_social_after <> less_social_before + 1 then
    raise exception 'new v2 practice did not increment its observed aggregate';
  end if;

  if after_first::text like '%fruit_veg%' or after_first::text like '%Fruit & veg%' then
    raise exception 'inactive practice leaked into the public aggregate';
  end if;

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

  select answer.text_value into strict stored_custom_tag
  from private.response_answers answer
  join private.responses response on response.id = answer.response_id
  join private.participations participation on participation.id = response.participation_id
  join private.participants participant on participant.id = participation.participant_id
  join private.questions question on question.id = answer.question_id
  where participant.normalized_email = lower('aggregate-' || first_idempotency || '@example.invalid')
    and question.key = 'burnout_custom_tags';

  if stored_custom_tag <> 'private-test-tag-never-public' then
    raise exception 'private custom tag did not retain participant wording';
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

  failed_payload := jsonb_set(second_payload, '{idempotencyKey}', to_jsonb(gen_random_uuid()::text));
  failed_payload := jsonb_set(failed_payload, '{answers,0,optionKeys}', '["not_an_approved_option"]'::jsonb);
  begin
    perform api.submit_participation_v1(failed_payload);
    raise exception 'invalid submission unexpectedly succeeded';
  exception when others then
    if sqlerrm = 'invalid submission unexpectedly succeeded' then
      raise;
    end if;
  end;

  select api.get_public_aggregates_v1() into after_failure;
  if after_failure -> 'totals' <> after_second -> 'totals'
     or after_failure -> 'metrics' <> after_second -> 'metrics'
     or (after_failure ->> 'revision')::bigint <> (after_second ->> 'revision')::bigint then
    raise exception 'failed submission changed aggregate state';
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
