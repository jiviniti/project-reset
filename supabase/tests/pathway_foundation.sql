-- Run after 202608290001_event_non_event_pathways.sql and seeds.
-- All test writes are rolled back.
begin;

do $pathway_test$
declare
  questionnaire_id uuid;
  event_screening_id uuid;
  active_result jsonb;
  expired_result jsonb;
  public_snapshot jsonb;
  active_key uuid := gen_random_uuid();
  expired_key uuid := gen_random_uuid();
  base_payload jsonb;
  stored_pathway text;
  stored_window_status text;
  stored_reward text;
  delivery_channel text;
  delivery_status text;
  delivery_expiry timestamptz;
begin
  if (api.get_screening_v1('preview-screening') ->> 'entryPathway') <> 'non_event'
     or (api.get_screening_v1('preview-screening') ->> 'rewardType') <> 'trailer_access' then
    raise exception 'preview screening did not resolve to the non-event trailer pathway';
  end if;

  select id into strict questionnaire_id
  from private.questionnaire_versions
  where key = 'reset-v1' and version = 1;

  insert into private.screenings (
    slug, name, status, questionnaire_version_id, pathway_type,
    check_in_opens_at, check_in_closes_at, film_access_ends_at
  ) values (
    'pathway-foundation-test', 'Pathway Foundation Test', 'active', questionnaire_id, 'event',
    now() - interval '1 hour', now() + interval '1 hour', now() + interval '49 hours'
  ) returning id into event_screening_id;

  base_payload := jsonb_build_object(
    'apiVersion', '1',
    'idempotencyKey', active_key,
    'screeningSlug', 'pathway-foundation-test',
    'participant', jsonb_build_object(
      'firstName', 'Pathway Test',
      'email', 'pathway-' || active_key || '@example.invalid'
    ),
    'demographics', '{}'::jsonb,
    'consent', jsonb_build_object(
      'dataUseAccepted', true,
      'policyVersion', 'reset_data_use_v1_us'
    ),
    'communication', jsonb_build_object('futureCommunicationsAllowed', false),
    'answers', jsonb_build_array(
      jsonb_build_object('questionKey', 'burnout_signs', 'optionKeys', jsonb_build_array('exhausted'))
    )
  );

  select api.submit_participation_v1(base_payload) into active_result;
  if active_result ->> 'entryPathway' <> 'event'
     or active_result ->> 'rewardType' <> 'film_access'
     or active_result ->> 'eventWindowStatus' <> 'active_event'
     or active_result ->> 'accessEndsAt' is null then
    raise exception 'active event result is incorrect: %', active_result;
  end if;

  select p.entry_pathway, p.event_window_status, p.reward_type,
         rd.channel, rd.status, rd.access_expires_at
  into strict stored_pathway, stored_window_status, stored_reward,
    delivery_channel, delivery_status, delivery_expiry
  from private.participations p
  join private.reward_deliveries rd on rd.participation_id = p.id
  where p.id = (active_result ->> 'participationId')::uuid;

  if stored_pathway <> 'event' or stored_window_status <> 'active_event'
     or stored_reward <> 'film_access' or delivery_channel <> 'email'
     or delivery_status <> 'deferred' or delivery_expiry is null then
    raise exception 'active event persistence is incorrect';
  end if;

  update private.screenings
  set check_in_opens_at = now() - interval '2 hours',
      check_in_closes_at = now() - interval '1 hour',
      film_access_ends_at = now() + interval '47 hours'
  where id = event_screening_id;

  base_payload := jsonb_set(base_payload, '{idempotencyKey}', to_jsonb(expired_key::text));
  base_payload := jsonb_set(
    base_payload,
    '{participant,email}',
    to_jsonb(('pathway-' || expired_key || '@example.invalid')::text)
  );
  select api.submit_participation_v1(base_payload) into expired_result;

  if expired_result ->> 'entryPathway' <> 'non_event'
     or expired_result ->> 'rewardType' <> 'trailer_access'
     or expired_result ->> 'eventWindowStatus' <> 'event_expired'
     or expired_result ->> 'accessEndsAt' is not null then
    raise exception 'expired event did not fall back safely: %', expired_result;
  end if;

  select p.entry_pathway, p.event_window_status, p.reward_type, rd.channel, rd.status
  into strict stored_pathway, stored_window_status, stored_reward, delivery_channel, delivery_status
  from private.participations p
  join private.reward_deliveries rd on rd.participation_id = p.id
  where p.id = (expired_result ->> 'participationId')::uuid;

  if stored_pathway <> 'non_event' or stored_window_status <> 'event_expired'
     or stored_reward <> 'trailer_access' or delivery_channel <> 'web'
     or delivery_status <> 'available' then
    raise exception 'expired event persistence is incorrect';
  end if;

  select api.submit_participation_v1(base_payload) into expired_result;
  if expired_result ->> 'replayed' <> 'true'
     or expired_result ->> 'eventWindowStatus' <> 'event_expired' then
    raise exception 'idempotent replay did not preserve the committed pathway decision';
  end if;

  select api.get_public_aggregates_v1() into public_snapshot;
  if public_snapshot::text ~* '(entryPathway|rewardType|accessEndsAt|participantId|email|firstName)' then
    raise exception 'pathway or participant internals leaked into public aggregates';
  end if;

  if has_function_privilege('anon', 'private.resolve_screening_pathway_v1(uuid,timestamptz)', 'execute')
     or has_function_privilege('authenticated', 'private.resolve_screening_pathway_v1(uuid,timestamptz)', 'execute')
     or has_function_privilege('anon', 'api.submit_participation_v1(jsonb)', 'execute') then
    raise exception 'browser role can execute a server-only pathway/submission function';
  end if;

  if has_table_privilege('anon', 'private.participations', 'select')
     or has_table_privilege('authenticated', 'private.reward_deliveries', 'select') then
    raise exception 'new private pathway/reward fields are exposed to a browser role';
  end if;
end
$pathway_test$;

rollback;
