-- Event/non-event pathway foundation.
-- Reward eligibility is resolved from trusted screening configuration and database time.

alter table private.screenings
  add column pathway_type text not null default 'non_event',
  add column check_in_opens_at timestamptz,
  add column check_in_closes_at timestamptz,
  add column film_access_ends_at timestamptz,
  add constraint screenings_pathway_type_check
    check (pathway_type in ('event', 'non_event')),
  add constraint screenings_pathway_window_check check (
    (
      pathway_type = 'non_event'
      and check_in_opens_at is null
      and check_in_closes_at is null
      and film_access_ends_at is null
    )
    or
    (
      pathway_type = 'event'
      and check_in_closes_at is not null
      and film_access_ends_at is not null
      and (check_in_opens_at is null or check_in_opens_at < check_in_closes_at)
      and film_access_ends_at >= check_in_closes_at
    )
  );

comment on column private.screenings.pathway_type is
  'Configured entry pathway. Event eligibility is additionally bounded by database-time check-in windows.';
comment on column private.screenings.check_in_closes_at is
  'Exclusive end of event film-access eligibility. The same URL falls back to the non-event trailer pathway at this instant.';

alter table private.participations
  add column entry_pathway text,
  add column event_window_status text,
  add column reward_type text;

-- Historical submissions were made while the product promised film access.
update private.participations
set entry_pathway = 'event',
    event_window_status = 'active_event',
    reward_type = 'film_access'
where entry_pathway is null;

alter table private.participations
  alter column entry_pathway set not null,
  alter column event_window_status set not null,
  alter column reward_type set not null,
  add constraint participations_entry_pathway_check
    check (entry_pathway in ('event', 'non_event')),
  add constraint participations_event_window_status_check
    check (event_window_status in ('active_event', 'event_not_started', 'event_expired', 'non_event')),
  add constraint participations_reward_type_check
    check (reward_type in ('film_access', 'trailer_access')),
  add constraint participations_pathway_reward_consistency_check check (
    (entry_pathway = 'event' and reward_type = 'film_access' and event_window_status = 'active_event')
    or
    (entry_pathway = 'non_event' and reward_type = 'trailer_access' and event_window_status in ('event_not_started', 'event_expired', 'non_event'))
  );

comment on column private.participations.entry_pathway is
  'Committed effective pathway snapshot. It cannot be selected by the browser.';
comment on column private.participations.event_window_status is
  'Why this submission received its effective pathway, frozen at commit time.';

alter table private.reward_deliveries
  add column reward_type text,
  add column access_expires_at timestamptz;

update private.reward_deliveries
set reward_type = 'film_access'
where reward_type is null;

alter table private.reward_deliveries
  alter column reward_type set not null,
  drop constraint reward_deliveries_channel_check,
  drop constraint reward_deliveries_status_check,
  add constraint reward_deliveries_channel_check
    check (channel in ('email', 'sms', 'web')),
  add constraint reward_deliveries_status_check
    check (status in ('available', 'deferred', 'pending', 'processing', 'sent', 'failed', 'cancelled')),
  add constraint reward_deliveries_reward_type_check
    check (reward_type in ('film_access', 'trailer_access')),
  add constraint reward_deliveries_reward_channel_check check (
    (reward_type = 'film_access' and channel in ('email', 'sms'))
    or (reward_type = 'trailer_access' and channel = 'web')
  );

comment on table private.reward_deliveries is
  'Transactional reward intent, separate from optional marketing consent. Film delivery remains deferred until a provider adapter is approved; trailer access is a web reward.';

create or replace function private.resolve_screening_pathway_v1(
  screening_id uuid,
  resolved_at timestamptz default now()
)
returns table (
  entry_pathway text,
  reward_type text,
  event_window_status text,
  access_ends_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $function$
  select
    case
      when s.pathway_type = 'event'
        and (s.check_in_opens_at is null or resolved_at >= s.check_in_opens_at)
        and resolved_at < s.check_in_closes_at
      then 'event'
      else 'non_event'
    end,
    case
      when s.pathway_type = 'event'
        and (s.check_in_opens_at is null or resolved_at >= s.check_in_opens_at)
        and resolved_at < s.check_in_closes_at
      then 'film_access'
      else 'trailer_access'
    end,
    case
      when s.pathway_type = 'non_event' then 'non_event'
      when s.check_in_opens_at is not null and resolved_at < s.check_in_opens_at then 'event_not_started'
      when resolved_at >= s.check_in_closes_at then 'event_expired'
      else 'active_event'
    end,
    case
      when s.pathway_type = 'event'
        and (s.check_in_opens_at is null or resolved_at >= s.check_in_opens_at)
        and resolved_at < s.check_in_closes_at
      then s.film_access_ends_at
      else null
    end
  from private.screenings s
  where s.id = screening_id;
$function$;

revoke execute on function private.resolve_screening_pathway_v1(uuid, timestamptz) from public, anon, authenticated;
grant execute on function private.resolve_screening_pathway_v1(uuid, timestamptz) to service_role;

create or replace function api.get_screening_v1(screening_slug text)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $function$
  select jsonb_build_object(
    'slug', s.slug,
    'name', s.name,
    'institution', s.institution,
    'eventDate', s.event_date,
    'entryPathway', pathway.entry_pathway,
    'rewardType', pathway.reward_type,
    'eventWindowStatus', pathway.event_window_status,
    'accessEndsAt', pathway.access_ends_at,
    'checkInOpensAt', s.check_in_opens_at,
    'checkInClosesAt', s.check_in_closes_at,
    'questionnaireKey', qv.key,
    'questionnaireVersion', qv.version,
    'policyVersion', pv.version,
    'policyText', pv.acknowledgement_text,
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'key', q.key,
        'prompt', q.prompt,
        'answerType', q.answer_type,
        'position', q.position,
        'required', q.required,
        'options', coalesce((
          select jsonb_agg(jsonb_build_object(
            'key', qo.key,
            'label', qo.label,
            'position', qo.position,
            'parentOptionKey', parent.key
          ) order by qo.position)
          from private.question_options qo
          left join private.question_options parent on parent.id = qo.parent_option_id
          where qo.question_id = q.id
        ), '[]'::jsonb)
      ) order by q.position)
      from private.questions q
      where q.questionnaire_version_id = qv.id
    ), '[]'::jsonb)
  )
  from private.screenings s
  join private.questionnaire_versions qv on qv.id = s.questionnaire_version_id
  cross join lateral private.resolve_screening_pathway_v1(s.id, now()) pathway
  cross join lateral (
    select version, acknowledgement_text
    from private.policy_versions
    where status = 'published'
    order by published_at desc nulls last, created_at desc
    limit 1
  ) pv
  where s.slug = screening_slug
    and s.status = 'active'
    and qv.status = 'published';
$function$;

revoke execute on function api.get_screening_v1(text) from public, anon, authenticated;
grant execute on function api.get_screening_v1(text) to service_role;

create or replace function api.submit_participation_v1(payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  screening private.screenings%rowtype;
  questionnaire private.questionnaire_versions%rowtype;
  policy private.policy_versions%rowtype;
  pathway record;
  participant_id uuid;
  participation_id uuid;
  created_response_id uuid;
  existing_response_id uuid;
  reward_delivery_id uuid;
  answer jsonb;
  question private.questions%rowtype;
  option_key text;
  option_id uuid;
  first_name text := btrim(payload #>> '{participant,firstName}');
  email text := btrim(payload #>> '{participant,email}');
  participant_normalized_email text := lower(btrim(payload #>> '{participant,email}'));
  request_idempotency_key uuid := (payload ->> 'idempotencyKey')::uuid;
begin
  select s.* into screening
  from private.screenings s
  where s.slug = payload ->> 'screeningSlug'
    and s.status = 'active'
  for share;
  if not found then
    raise exception using errcode = 'P0001', message = 'screening_not_found_or_inactive';
  end if;

  select * into strict pathway
  from private.resolve_screening_pathway_v1(screening.id, now());

  select qv.* into strict questionnaire
  from private.questionnaire_versions qv
  where qv.id = screening.questionnaire_version_id
    and qv.status = 'published';

  select pv.* into policy
  from private.policy_versions pv
  where pv.version = payload #>> '{consent,policyVersion}'
    and pv.status = 'published';
  if not found or coalesce((payload #>> '{consent,dataUseAccepted}')::boolean, false) is not true then
    raise exception using errcode = 'P0001', message = 'policy_version_invalid';
  end if;

  if first_name is null or first_name = '' or email is null or email = '' then
    raise exception using errcode = 'P0001', message = 'participant_invalid';
  end if;

  insert into private.participants (first_name, email, normalized_email)
  values (first_name, email, participant_normalized_email)
  on conflict (normalized_email) do update
    set first_name = excluded.first_name,
        email = excluded.email,
        updated_at = now()
  returning id into participant_id;

  insert into private.participations (
    participant_id, screening_id, questionnaire_version_id, idempotency_key,
    city, age_band, occupation, entry_pathway, event_window_status, reward_type
  ) values (
    participant_id, screening.id, questionnaire.id, request_idempotency_key,
    nullif(btrim(payload #>> '{demographics,city}'), ''),
    nullif(payload #>> '{demographics,ageBand}', ''),
    nullif(btrim(payload #>> '{demographics,occupation}'), ''),
    pathway.entry_pathway, pathway.event_window_status, pathway.reward_type
  )
  on conflict (screening_id, idempotency_key) do nothing
  returning id into participation_id;

  if participation_id is null then
    select p.id, r.id, p.entry_pathway, p.reward_type, p.event_window_status,
           rd.id, rd.access_expires_at
    into strict participation_id, existing_response_id, pathway.entry_pathway,
      pathway.reward_type, pathway.event_window_status, reward_delivery_id, pathway.access_ends_at
    from private.participations p
    join private.responses r on r.participation_id = p.id
    left join lateral (
      select delivery.id, delivery.access_expires_at
      from private.reward_deliveries delivery
      where delivery.participation_id = p.id
      order by delivery.created_at, delivery.id
      limit 1
    ) rd on true
    where p.screening_id = screening.id and p.idempotency_key = request_idempotency_key;
    return jsonb_build_object(
      'submissionId', existing_response_id,
      'participationId', participation_id,
      'rewardDeliveryId', reward_delivery_id,
      'entryPathway', pathway.entry_pathway,
      'rewardType', pathway.reward_type,
      'eventWindowStatus', pathway.event_window_status,
      'accessEndsAt', pathway.access_ends_at,
      'status', 'completed',
      'replayed', true
    );
  end if;

  insert into private.consents (participation_id, policy_version_id, data_use_accepted)
  values (participation_id, policy.id, true);

  insert into private.communication_preferences (
    participation_id, future_communications_allowed
  ) values (
    participation_id,
    coalesce((payload #>> '{communication,futureCommunicationsAllowed}')::boolean, false)
  );

  insert into private.reward_deliveries (
    participation_id, channel, status, reward_type, access_expires_at
  ) values (
    participation_id,
    case when pathway.reward_type = 'film_access' then 'email' else 'web' end,
    case when pathway.reward_type = 'film_access' then 'deferred' else 'available' end,
    pathway.reward_type,
    pathway.access_ends_at
  )
  returning id into reward_delivery_id;

  insert into private.responses (participation_id, questionnaire_version_id)
  values (participation_id, questionnaire.id)
  returning id into created_response_id;

  for answer in select value from jsonb_array_elements(coalesce(payload -> 'answers', '[]'::jsonb)) loop
    select q.* into question
    from private.questions q
    where q.questionnaire_version_id = questionnaire.id
      and q.key = answer ->> 'questionKey';
    if not found then
      raise exception using errcode = 'P0001', message = 'question_invalid';
    end if;

    if answer ? 'optionKeys' then
      if question.answer_type not in ('single_choice', 'multi_choice') then
        raise exception using errcode = 'P0001', message = 'answer_type_invalid';
      end if;
      if question.answer_type = 'single_choice' and jsonb_array_length(answer -> 'optionKeys') > 1 then
        raise exception using errcode = 'P0001', message = 'answer_type_invalid';
      end if;
      for option_key in select jsonb_array_elements_text(answer -> 'optionKeys') loop
        select qo.id into option_id
        from private.question_options qo
        where qo.question_id = question.id and qo.key = option_key;
        if not found then
          raise exception using errcode = 'P0001', message = 'option_invalid';
        end if;
        insert into private.response_selections (response_id, question_id, option_id)
        values (created_response_id, question.id, option_id);
      end loop;
    elsif answer ? 'text' then
      if question.answer_type <> 'text' then
        raise exception using errcode = 'P0001', message = 'answer_type_invalid';
      end if;
      if nullif(btrim(answer ->> 'text'), '') is not null then
        insert into private.response_answers (response_id, question_id, text_value)
        values (created_response_id, question.id, btrim(answer ->> 'text'));
      end if;
    else
      raise exception using errcode = 'P0001', message = 'answer_type_invalid';
    end if;
  end loop;

  if exists (
    select 1
    from private.response_selections selected
    join private.question_options practice on practice.id = selected.option_id
    where selected.response_id = created_response_id
      and practice.parent_option_id is not null
      and not exists (
        select 1 from private.response_selections selected_pathway
        where selected_pathway.response_id = created_response_id
          and selected_pathway.option_id = practice.parent_option_id
      )
  ) then
    raise exception using errcode = 'P0001', message = 'practice_pathway_mismatch';
  end if;

  perform aggregate.apply_observed_submission_v1(created_response_id, screening.id);

  return jsonb_build_object(
    'submissionId', created_response_id,
    'participationId', participation_id,
    'rewardDeliveryId', reward_delivery_id,
    'entryPathway', pathway.entry_pathway,
    'rewardType', pathway.reward_type,
    'eventWindowStatus', pathway.event_window_status,
    'accessEndsAt', pathway.access_ends_at,
    'status', 'completed',
    'replayed', false
  );
end;
$function$;

revoke execute on function api.submit_participation_v1(jsonb) from public, anon, authenticated;
grant execute on function api.submit_participation_v1(jsonb) to service_role;
