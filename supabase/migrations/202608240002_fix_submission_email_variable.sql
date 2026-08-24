-- Keep the normalized participant email variable distinct from the table column.
-- PostgreSQL otherwise treats ON CONFLICT (normalized_email) as ambiguous.
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
    city, age_band, occupation
  ) values (
    participant_id, screening.id, questionnaire.id, request_idempotency_key,
    nullif(btrim(payload #>> '{demographics,city}'), ''),
    nullif(payload #>> '{demographics,ageBand}', ''),
    nullif(btrim(payload #>> '{demographics,occupation}'), '')
  )
  on conflict (screening_id, idempotency_key) do nothing
  returning id into participation_id;

  if participation_id is null then
    select p.id, r.id into strict participation_id, existing_response_id
    from private.participations p
    join private.responses r on r.participation_id = p.id
    where p.screening_id = screening.id and p.idempotency_key = request_idempotency_key;
    return jsonb_build_object(
      'submissionId', existing_response_id,
      'participationId', participation_id,
      'status', 'completed',
      'replayed', true
    );
  end if;

  insert into private.consents (
    participation_id, policy_version_id, data_use_accepted
  ) values (participation_id, policy.id, true);

  insert into private.communication_preferences (
    participation_id, future_communications_allowed
  ) values (
    participation_id,
    coalesce((payload #>> '{communication,futureCommunicationsAllowed}')::boolean, false)
  );

  insert into private.reward_deliveries (participation_id, channel, status)
  values (participation_id, 'email', 'deferred')
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
        select 1 from private.response_selections pathway
        where pathway.response_id = created_response_id
          and pathway.option_id = practice.parent_option_id
      )
  ) then
    raise exception using errcode = 'P0001', message = 'practice_pathway_mismatch';
  end if;

  return jsonb_build_object(
    'submissionId', created_response_id,
    'participationId', participation_id,
    'rewardDeliveryId', reward_delivery_id,
    'status', 'completed',
    'replayed', false
  );
end;
$function$;

revoke execute on function api.submit_participation_v1(jsonb) from public, anon, authenticated;
grant execute on function api.submit_participation_v1(jsonb) to service_role;
