-- Add an optional, private action-oriented reflection without changing v1 or v2.
-- The response is deliberately absent from aggregate.metric_definitions.

begin;

insert into private.questionnaire_versions (key, version, title, status, published_at)
values ('reset-v1', 3, 'Project RESET Check-In', 'published', now())
on conflict (key, version) do update
set title = excluded.title,
    status = excluded.status,
    published_at = coalesce(private.questionnaire_versions.published_at, excluded.published_at);

with source_version as (
  select id from private.questionnaire_versions where key = 'reset-v1' and version = 2
), target_version as (
  select id from private.questionnaire_versions where key = 'reset-v1' and version = 3
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

with target_version as (
  select id from private.questionnaire_versions where key = 'reset-v1' and version = 3
)
insert into private.questions (
  questionnaire_version_id, key, prompt, answer_type, position, required, settings
)
select id, 'today_commitment',
       'What is one small thing you could choose today that might support you?',
       'text', 8, false, jsonb_build_object('maxLength', 500, 'visibility', 'private')
from target_version
on conflict (questionnaire_version_id, key) do update
set prompt = excluded.prompt,
    answer_type = excluded.answer_type,
    position = excluded.position,
    required = excluded.required,
    settings = excluded.settings;

-- Copy option records first, then reconnect child practices to the v3 pathway parents.
with source_version as (
  select id from private.questionnaire_versions where key = 'reset-v1' and version = 2
), target_version as (
  select id from private.questionnaire_versions where key = 'reset-v1' and version = 3
), source_options as (
  select question.key as question_key, option.key, option.label,
         option.position, option.metadata
  from private.question_options option
  join private.questions question on question.id = option.question_id
  cross join source_version
  where question.questionnaire_version_id = source_version.id
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

with source_version as (
  select id from private.questionnaire_versions where key = 'reset-v1' and version = 2
), target_version as (
  select id from private.questionnaire_versions where key = 'reset-v1' and version = 3
), parent_links as (
  select child_question.key as child_question_key,
         child.key as child_key,
         parent_question.key as parent_question_key,
         parent.key as parent_key
  from private.question_options child
  join private.questions child_question on child_question.id = child.question_id
  join private.question_options parent on parent.id = child.parent_option_id
  join private.questions parent_question on parent_question.id = parent.question_id
  cross join source_version
  where child_question.questionnaire_version_id = source_version.id
)
update private.question_options target_child
set parent_option_id = target_parent.id
from parent_links
cross join target_version
join private.questions target_child_question
  on target_child_question.questionnaire_version_id = target_version.id
 and target_child_question.key = parent_links.child_question_key
join private.questions target_parent_question
  on target_parent_question.questionnaire_version_id = target_version.id
 and target_parent_question.key = parent_links.parent_question_key
join private.question_options target_parent
  on target_parent.question_id = target_parent_question.id
 and target_parent.key = parent_links.parent_key
where target_child.question_id = target_child_question.id
  and target_child.key = parent_links.child_key;

-- Existing launch rows are upgraded if they have already been provisioned. This
-- migration intentionally does not create or activate events without approved windows.
update private.screenings screening
set questionnaire_version_id = questionnaire.id,
    updated_at = now()
from private.questionnaire_versions questionnaire
where questionnaire.key = 'reset-v1'
  and questionnaire.version = 3
  and screening.slug in (
    'preview-screening',
    'preview-event',
    'preview-expired-event',
    'climate-week-nyc-2026',
    'columbia-climate-school-2026'
  );

commit;
