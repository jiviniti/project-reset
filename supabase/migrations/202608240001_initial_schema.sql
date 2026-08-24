create schema if not exists private;
create schema if not exists api;

revoke all on schema private from public, anon, authenticated;
revoke all on schema api from public, anon, authenticated;
grant usage on schema private, api to service_role;

alter default privileges in schema private revoke all on tables from public, anon, authenticated;
alter default privileges in schema private grant select, insert, update, delete on tables to service_role;
alter default privileges in schema api revoke execute on functions from public, anon, authenticated;

create table private.questionnaire_versions (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  version integer not null check (version > 0),
  title text not null,
  status text not null check (status in ('draft', 'published', 'retired')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (key, version)
);

create table private.questions (
  id uuid primary key default gen_random_uuid(),
  questionnaire_version_id uuid not null references private.questionnaire_versions(id),
  key text not null check (key ~ '^[a-z0-9_]+$'),
  prompt text not null,
  answer_type text not null check (answer_type in ('single_choice', 'multi_choice', 'text')),
  position integer not null check (position > 0),
  required boolean not null default false,
  settings jsonb not null default '{}'::jsonb,
  unique (questionnaire_version_id, key),
  unique (id, questionnaire_version_id)
);

create table private.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references private.questions(id),
  key text not null check (key ~ '^[a-z0-9_]+$'),
  label text not null,
  position integer not null check (position > 0),
  parent_option_id uuid references private.question_options(id),
  metadata jsonb not null default '{}'::jsonb,
  unique (question_id, key),
  unique (id, question_id)
);

create table private.screenings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  institution text,
  location text,
  event_date timestamptz,
  cohort_metadata jsonb not null default '{}'::jsonb,
  status text not null check (status in ('draft', 'active', 'closed')),
  questionnaire_version_id uuid not null references private.questionnaire_versions(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.policy_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null unique check (version ~ '^[a-z0-9_]+$'),
  acknowledgement_text text not null,
  status text not null check (status in ('draft', 'published', 'retired')),
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table private.participants (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (char_length(btrim(first_name)) between 1 and 80),
  email text not null check (char_length(email) <= 254),
  normalized_email text not null check (normalized_email = lower(btrim(email))),
  mobile_e164 text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (normalized_email)
);

comment on column private.participants.normalized_email is
  'Identity assumption: one trim-and-lowercase normalized email corresponds to one participant across screenings. No provider-specific transformations.';

create table private.participations (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references private.participants(id),
  screening_id uuid not null references private.screenings(id),
  questionnaire_version_id uuid not null references private.questionnaire_versions(id),
  idempotency_key uuid not null,
  city text check (city is null or char_length(city) <= 120),
  age_band text check (age_band is null or age_band in ('18–24', '25–34', '35–44', '45–54', '55+')),
  occupation text check (occupation is null or char_length(occupation) <= 120),
  status text not null check (status in ('completed')) default 'completed',
  started_at timestamptz not null default now(),
  submitted_at timestamptz not null default now(),
  unique (screening_id, idempotency_key)
);

create index participations_screening_submitted_idx
  on private.participations(screening_id, submitted_at desc);
create index participations_participant_idx on private.participations(participant_id);
create index participations_age_band_idx on private.participations(age_band) where age_band is not null;
create index participations_city_idx on private.participations(lower(city)) where city is not null;

create table private.consents (
  id uuid primary key default gen_random_uuid(),
  participation_id uuid not null unique references private.participations(id) on delete cascade,
  policy_version_id uuid not null references private.policy_versions(id),
  data_use_accepted boolean not null check (data_use_accepted),
  accepted_at timestamptz not null default now()
);

create table private.communication_preferences (
  id uuid primary key default gen_random_uuid(),
  participation_id uuid not null unique references private.participations(id) on delete cascade,
  future_communications_allowed boolean not null default false,
  recorded_at timestamptz not null default now()
);

comment on table private.communication_preferences is
  'Optional marketing/future-communications preference only. Transactional reward delivery is stored separately.';

create table private.responses (
  id uuid primary key default gen_random_uuid(),
  participation_id uuid not null unique references private.participations(id) on delete cascade,
  questionnaire_version_id uuid not null references private.questionnaire_versions(id),
  submitted_at timestamptz not null default now()
);

create table private.response_answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references private.responses(id) on delete cascade,
  question_id uuid not null references private.questions(id),
  text_value text,
  scalar_value jsonb,
  created_at timestamptz not null default now(),
  check ((text_value is not null)::integer + (scalar_value is not null)::integer = 1),
  unique (response_id, question_id)
);

create table private.response_selections (
  response_id uuid not null references private.responses(id) on delete cascade,
  question_id uuid not null references private.questions(id),
  option_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (response_id, question_id, option_id),
  foreign key (option_id, question_id) references private.question_options(id, question_id)
);

create index response_selections_question_option_idx
  on private.response_selections(question_id, option_id);

create table private.reward_deliveries (
  id uuid primary key default gen_random_uuid(),
  participation_id uuid not null references private.participations(id) on delete cascade,
  channel text not null check (channel in ('email', 'sms')),
  provider text,
  status text not null check (status in ('deferred', 'pending', 'processing', 'sent', 'failed', 'cancelled')),
  provider_reference text,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $enable_rls$
declare
  table_name text;
begin
  foreach table_name in array array[
    'questionnaire_versions', 'questions', 'question_options', 'screenings',
    'policy_versions', 'participants', 'participations', 'consents',
    'communication_preferences', 'responses', 'response_answers',
    'response_selections', 'reward_deliveries'
  ] loop
    execute format('alter table private.%I enable row level security', table_name);
    execute format('revoke all on table private.%I from public, anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on table private.%I to service_role', table_name);
  end loop;
end
$enable_rls$;

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
  response_id uuid;
  existing_response_id uuid;
  reward_delivery_id uuid;
  answer jsonb;
  question private.questions%rowtype;
  option_key text;
  option_id uuid;
  first_name text := btrim(payload #>> '{participant,firstName}');
  email text := btrim(payload #>> '{participant,email}');
  normalized_email text := lower(btrim(payload #>> '{participant,email}'));
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
  values (first_name, email, normalized_email)
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
  returning id into response_id;

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
        values (response_id, question.id, option_id);
      end loop;
    elsif answer ? 'text' then
      if question.answer_type <> 'text' then
        raise exception using errcode = 'P0001', message = 'answer_type_invalid';
      end if;
      if nullif(btrim(answer ->> 'text'), '') is not null then
        insert into private.response_answers (response_id, question_id, text_value)
        values (response_id, question.id, btrim(answer ->> 'text'));
      end if;
    else
      raise exception using errcode = 'P0001', message = 'answer_type_invalid';
    end if;
  end loop;

  if exists (
    select 1
    from private.response_selections selected
    join private.question_options practice on practice.id = selected.option_id
    where selected.response_id = response_id
      and practice.parent_option_id is not null
      and not exists (
        select 1 from private.response_selections pathway
        where pathway.response_id = response_id
          and pathway.option_id = practice.parent_option_id
      )
  ) then
    raise exception using errcode = 'P0001', message = 'practice_pathway_mismatch';
  end if;

  return jsonb_build_object(
    'submissionId', response_id,
    'participationId', participation_id,
    'rewardDeliveryId', reward_delivery_id,
    'status', 'completed',
    'replayed', false
  );
end;
$function$;

revoke execute on all functions in schema api from public, anon, authenticated;
revoke execute on function api.get_screening_v1(text) from public, anon, authenticated;
revoke execute on function api.submit_participation_v1(jsonb) from public, anon, authenticated;
grant execute on function api.get_screening_v1(text) to service_role;
grant execute on function api.submit_participation_v1(jsonb) to service_role;
