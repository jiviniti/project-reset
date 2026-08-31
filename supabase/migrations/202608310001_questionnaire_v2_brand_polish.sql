-- Publish the approved questionnaire wording as version 2 without rewriting
-- historical version-1 responses. fruit_veg remains privately valid for a
-- form loaded before cutover, but is hidden from new forms and public metrics.

insert into private.questionnaire_versions (key, version, title, status, published_at)
values ('reset-v1', 2, 'Project RESET Check-In', 'published', now())
on conflict (key, version) do update
set title = excluded.title,
    status = excluded.status,
    published_at = coalesce(private.questionnaire_versions.published_at, excluded.published_at);

with source_version as (
  select id from private.questionnaire_versions where key = 'reset-v1' and version = 1
), target_version as (
  select id from private.questionnaire_versions where key = 'reset-v1' and version = 2
)
insert into private.questions (
  questionnaire_version_id, key, prompt, answer_type, position, required, settings
)
select target_version.id, source.key, source.prompt, source.answer_type,
       source.position, source.required, source.settings
from private.questions source
cross join source_version
cross join target_version
where source.questionnaire_version_id = source_version.id
on conflict (questionnaire_version_id, key) do update
set prompt = excluded.prompt,
    answer_type = excluded.answer_type,
    position = excluded.position,
    required = excluded.required,
    settings = excluded.settings;

-- Copy every non-practice option verbatim, including the pathway parents.
with source_version as (
  select id from private.questionnaire_versions where key = 'reset-v1' and version = 1
), target_version as (
  select id from private.questionnaire_versions where key = 'reset-v1' and version = 2
), source_options as (
  select question.key as question_key, option.key, option.label,
         option.position, option.metadata
  from private.question_options option
  join private.questions question on question.id = option.question_id
  cross join source_version
  where question.questionnaire_version_id = source_version.id
    and question.key <> 'reset_practices'
)
insert into private.question_options (question_id, key, label, position, metadata)
select target_question.id, source_options.key, source_options.label,
       source_options.position, source_options.metadata
from source_options
cross join target_version
join private.questions target_question
  on target_question.questionnaire_version_id = target_version.id
 and target_question.key = source_options.question_key
on conflict (question_id, key) do update
set label = excluded.label,
    position = excluded.position,
    metadata = excluded.metadata;

with target_version as (
  select id from private.questionnaire_versions where key = 'reset-v1' and version = 2
), practices(key, label, pathway_key, position, active) as (values
  ('eating_more_plants', 'More plant-based foods', 'nourish', 1, true),
  ('fruit_veg', 'Fruit & veg', 'nourish', 2, false),
  ('plant_protein', 'More plant protein', 'nourish', 3, true),
  ('cooking_at_home', 'Home cooking', 'nourish', 4, true),
  ('less_ultra_processed', 'Less ultra-processed foods', 'nourish', 5, true),
  ('hydration', 'Hydration', 'nourish', 6, true),
  ('sleep', 'Sleeping', 'restore', 7, true),
  ('breathwork', 'Breathwork', 'restore', 8, true),
  ('meditation', 'Meditation', 'restore', 9, true),
  ('reading', 'Reading', 'restore', 10, true),
  ('therapy', 'Therapy', 'restore', 11, true),
  ('less_social_media', 'Less social media', 'restore', 12, true),
  ('walking', 'Walking', 'move', 13, true),
  ('strength', 'Strength training', 'move', 14, true),
  ('yoga', 'Yoga', 'move', 15, true),
  ('dance', 'Dancing', 'move', 16, true),
  ('sport', 'Sport', 'move', 17, true),
  ('friends', 'Friends', 'connect', 18, true),
  ('family', 'Family', 'connect', 19, true),
  ('animals', 'Animals', 'connect', 20, true),
  ('community', 'Community', 'connect', 21, true),
  ('volunteering', 'Volunteering', 'connect', 22, true),
  ('in_person_meetings', 'In-person meetings', 'connect', 23, true),
  ('boundaries', 'Setting boundaries', 'rebalance', 24, true),
  ('journaling', 'Journaling', 'rebalance', 25, true),
  ('creative_work', 'Creative work', 'rebalance', 26, true),
  ('digital_detox', 'Digital detox', 'rebalance', 27, true),
  ('purpose', 'Finding purpose', 'rebalance', 28, true)
)
insert into private.question_options (
  question_id, key, label, parent_option_id, position, metadata
)
select practice_question.id, practices.key, practices.label, pathway.id,
       practices.position, jsonb_build_object('active', practices.active)
from practices
cross join target_version
join private.questions practice_question
  on practice_question.questionnaire_version_id = target_version.id
 and practice_question.key = 'reset_practices'
join private.questions pathway_question
  on pathway_question.questionnaire_version_id = target_version.id
 and pathway_question.key = 'reset_pathways'
join private.question_options pathway
  on pathway.question_id = pathway_question.id
 and pathway.key = practices.pathway_key
on conflict (question_id, key) do update
set label = excluded.label,
    parent_option_id = excluded.parent_option_id,
    position = excluded.position,
    metadata = excluded.metadata;

-- Preview routes move to v2. Existing participations retain their recorded v1 id.
update private.screenings screening
set questionnaire_version_id = questionnaire.id,
    updated_at = now()
from private.questionnaire_versions questionnaire
where questionnaire.key = 'reset-v1'
  and questionnaire.version = 2
  and screening.slug in ('preview-screening', 'preview-event', 'preview-expired-event');

-- Existing stable metric keys keep their history while labels change. New
-- options begin at zero seeded/observed counts. fruit_veg is no longer public.
update aggregate.metric_definitions
set is_active = false, updated_at = now()
where category = 'practices' and metric_key = 'fruit_veg';

with metrics(metric_key, label, sort_order) as (values
  ('eating_more_plants', 'More plant-based foods', 1),
  ('plant_protein', 'More plant protein', 3),
  ('cooking_at_home', 'Home cooking', 4),
  ('less_ultra_processed', 'Less ultra-processed foods', 5),
  ('hydration', 'Hydration', 6),
  ('sleep', 'Sleeping', 7),
  ('breathwork', 'Breathwork', 8),
  ('meditation', 'Meditation', 9),
  ('reading', 'Reading', 10),
  ('therapy', 'Therapy', 11),
  ('less_social_media', 'Less social media', 12),
  ('walking', 'Walking', 13),
  ('strength', 'Strength training', 14),
  ('yoga', 'Yoga', 15),
  ('dance', 'Dancing', 16),
  ('sport', 'Sport', 17),
  ('friends', 'Friends', 18),
  ('family', 'Family', 19),
  ('animals', 'Animals', 20),
  ('community', 'Community', 21),
  ('volunteering', 'Volunteering', 22),
  ('in_person_meetings', 'In-person meetings', 23),
  ('boundaries', 'Setting boundaries', 24),
  ('journaling', 'Journaling', 25),
  ('creative_work', 'Creative work', 26),
  ('digital_detox', 'Digital detox', 27),
  ('purpose', 'Finding purpose', 28)
)
insert into aggregate.metric_definitions (
  category, metric_key, label, source_question_key, source_option_key,
  sort_order, is_active
)
select 'practices', metrics.metric_key, metrics.label, 'reset_practices',
       metrics.metric_key, metrics.sort_order, true
from metrics
on conflict (category, metric_key) do update
set label = excluded.label,
    source_question_key = excluded.source_question_key,
    source_option_key = excluded.source_option_key,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

-- Hide inactive compatibility options from every new screening response.
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
            and coalesce((qo.metadata ->> 'active')::boolean, true)
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

select aggregate.rebuild_observed_v1();
