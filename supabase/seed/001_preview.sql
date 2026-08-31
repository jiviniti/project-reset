insert into private.questionnaire_versions (key, version, title, status, published_at)
values ('reset-v1', 2, 'Project RESET Check-In', 'published', now())
on conflict (key, version) do update set title = excluded.title, status = excluded.status;

insert into private.policy_versions (version, acknowledgement_text, status, published_at)
values (
  'reset_data_use_v1_us',
  'I understand that my responses will be stored for Project RESET research and may contribute to anonymized or aggregated findings.',
  'published',
  now()
)
on conflict (version) do update
set acknowledgement_text = excluded.acknowledgement_text, status = excluded.status;

with version as (
  select id from private.questionnaire_versions where key = 'reset-v1' and version = 2
)
insert into private.questions (questionnaire_version_id, key, prompt, answer_type, position, required)
select version.id, item.key, item.prompt, item.answer_type, item.position, false
from version
cross join (values
  ('burnout_signs', 'How does burnout show up for you?', 'multi_choice', 1),
  ('burnout_note', 'Tell us more', 'text', 2),
  ('reset_pathways', 'What helps you reset?', 'multi_choice', 3),
  ('reset_practices', 'Which practices help?', 'multi_choice', 4),
  ('reset_ritual', 'Tell us about your RESET ritual', 'text', 5),
  ('burnout_custom_tags', 'Participant-created burnout tags', 'text', 6),
  ('reset_custom_tags', 'Participant-created RESET tags', 'text', 7)
) as item(key, prompt, answer_type, position)
on conflict (questionnaire_version_id, key) do update
set prompt = excluded.prompt, answer_type = excluded.answer_type, position = excluded.position;

with question as (
  select q.id from private.questions q
  join private.questionnaire_versions v on v.id = q.questionnaire_version_id
  where v.key = 'reset-v1' and v.version = 2 and q.key = 'burnout_signs'
)
insert into private.question_options (question_id, key, label, position)
select question.id, item.key, item.label, item.position
from question
cross join (values
  ('exhausted', 'Exhausted', 1), ('overwhelmed', 'Overwhelmed', 2),
  ('anxious', 'Anxious', 3), ('numb', 'Numb', 4), ('stuck', 'Stuck', 5),
  ('lonely', 'Lonely', 6), ('cant_sleep', 'Can''t sleep', 7),
  ('brain_fog', 'Brain fog', 8), ('emotional_eating', 'Emotional eating', 9),
  ('never_enough', 'Never enough', 10),
  ('reaching_for_junk_food', 'Reaching for junk food', 11),
  ('skipping_meals', 'Skipping meals', 12), ('living_on_takeout', 'Living on takeout', 13),
  ('chronic_illness', 'Chronic illness', 14), ('gut_problems', 'Gut problems', 15),
  ('disconnected', 'Disconnected', 16), ('cynical', 'Cynical', 17),
  ('constantly_busy', 'Constantly busy', 18),
  ('compassion_fatigue', 'Compassion fatigue', 19),
  ('climate_anxiety', 'Climate anxiety', 20), ('financial_stress', 'Financial stress', 21),
  ('other', 'Other…', 22)
) as item(key, label, position)
on conflict (question_id, key) do update set label = excluded.label, position = excluded.position;

with question as (
  select q.id from private.questions q
  join private.questionnaire_versions v on v.id = q.questionnaire_version_id
  where v.key = 'reset-v1' and v.version = 2 and q.key = 'reset_pathways'
)
insert into private.question_options (question_id, key, label, position)
select question.id, item.key, item.label, item.position
from question
cross join (values
  ('nourish', 'Nourish', 1), ('restore', 'Restore', 2), ('move', 'Move', 3),
  ('connect', 'Connect', 4), ('rebalance', 'Rebalance', 5)
) as item(key, label, position)
on conflict (question_id, key) do update set label = excluded.label, position = excluded.position;

with practice_question as (
  select q.id from private.questions q
  join private.questionnaire_versions v on v.id = q.questionnaire_version_id
  where v.key = 'reset-v1' and v.version = 2 and q.key = 'reset_practices'
), pathway_question as (
  select q.id from private.questions q
  join private.questionnaire_versions v on v.id = q.questionnaire_version_id
  where v.key = 'reset-v1' and v.version = 2 and q.key = 'reset_pathways'
), practices(key, label, pathway_key, position) as (values
  ('eating_more_plants', 'More plant-based foods', 'nourish', 1),
  ('fruit_veg', 'Fruit & veg', 'nourish', 2), ('plant_protein', 'More plant protein', 'nourish', 3),
  ('cooking_at_home', 'Home cooking', 'nourish', 4),
  ('less_ultra_processed', 'Less ultra-processed foods', 'nourish', 5), ('hydration', 'Hydration', 'nourish', 6),
  ('sleep', 'Sleeping', 'restore', 7), ('breathwork', 'Breathwork', 'restore', 8),
  ('meditation', 'Meditation', 'restore', 9), ('reading', 'Reading', 'restore', 10), ('therapy', 'Therapy', 'restore', 11),
  ('less_social_media', 'Less social media', 'restore', 12),
  ('walking', 'Walking', 'move', 13), ('strength', 'Strength training', 'move', 14),
  ('yoga', 'Yoga', 'move', 15), ('dance', 'Dancing', 'move', 16), ('sport', 'Sport', 'move', 17),
  ('friends', 'Friends', 'connect', 18), ('family', 'Family', 'connect', 19),
  ('animals', 'Animals', 'connect', 20), ('community', 'Community', 'connect', 21),
  ('volunteering', 'Volunteering', 'connect', 22), ('in_person_meetings', 'In-person meetings', 'connect', 23),
  ('boundaries', 'Setting boundaries', 'rebalance', 24),
  ('journaling', 'Journaling', 'rebalance', 25), ('creative_work', 'Creative work', 'rebalance', 26),
  ('digital_detox', 'Digital detox', 'rebalance', 27), ('purpose', 'Finding purpose', 'rebalance', 28)
)
insert into private.question_options (question_id, key, label, parent_option_id, position)
select practice_question.id, practices.key, practices.label, pathway.id, practices.position
from practice_question
cross join pathway_question
join practices on true
join private.question_options pathway
  on pathway.question_id = pathway_question.id and pathway.key = practices.pathway_key
on conflict (question_id, key) do update
set label = excluded.label, parent_option_id = excluded.parent_option_id, position = excluded.position;

update private.question_options option
set metadata = jsonb_build_object('active', option.key <> 'fruit_veg')
from private.questions question
join private.questionnaire_versions version on version.id = question.questionnaire_version_id
where option.question_id = question.id
  and version.key = 'reset-v1'
  and version.version = 2
  and question.key = 'reset_practices';

insert into private.screenings (
  slug, name, institution, status, questionnaire_version_id, cohort_metadata,
  pathway_type, check_in_opens_at, check_in_closes_at, film_access_ends_at
)
select
  'preview-screening', 'Project RESET Preview Screening', 'The Virsa Foundation', 'active', id,
  '{"environment":"preview","seeded":true}'::jsonb, 'non_event', null, null, null
from private.questionnaire_versions where key = 'reset-v1' and version = 2
on conflict (slug) do update
set name = excluded.name, institution = excluded.institution, status = excluded.status,
    questionnaire_version_id = excluded.questionnaire_version_id,
    cohort_metadata = excluded.cohort_metadata, pathway_type = excluded.pathway_type,
    check_in_opens_at = excluded.check_in_opens_at,
    check_in_closes_at = excluded.check_in_closes_at,
    film_access_ends_at = excluded.film_access_ends_at, updated_at = now();

insert into private.screenings (
  slug, name, institution, status, questionnaire_version_id, cohort_metadata,
  pathway_type, check_in_opens_at, check_in_closes_at, film_access_ends_at
)
select
  'preview-event', 'Project RESET Active Event Preview', 'The Virsa Foundation', 'active', id,
  '{"environment":"preview","seeded":true,"demonstration":"active_event"}'::jsonb,
  'event', '2026-08-01T00:00:00Z', '2026-09-30T23:59:59Z', '2026-10-07T23:59:59Z'
from private.questionnaire_versions where key = 'reset-v1' and version = 2
on conflict (slug) do update
set name = excluded.name, institution = excluded.institution, status = excluded.status,
    questionnaire_version_id = excluded.questionnaire_version_id,
    cohort_metadata = excluded.cohort_metadata, pathway_type = excluded.pathway_type,
    check_in_opens_at = excluded.check_in_opens_at,
    check_in_closes_at = excluded.check_in_closes_at,
    film_access_ends_at = excluded.film_access_ends_at, updated_at = now();

insert into private.screenings (
  slug, name, institution, status, questionnaire_version_id, cohort_metadata,
  pathway_type, check_in_opens_at, check_in_closes_at, film_access_ends_at
)
select
  'preview-expired-event', 'Project RESET Expired Event Preview', 'The Virsa Foundation', 'active', id,
  '{"environment":"preview","seeded":true,"demonstration":"expired_event"}'::jsonb,
  'event', '2026-08-01T00:00:00Z', '2026-08-02T23:59:59Z', '2026-08-04T23:59:59Z'
from private.questionnaire_versions where key = 'reset-v1' and version = 2
on conflict (slug) do update
set name = excluded.name, institution = excluded.institution, status = excluded.status,
    questionnaire_version_id = excluded.questionnaire_version_id,
    cohort_metadata = excluded.cohort_metadata, pathway_type = excluded.pathway_type,
    check_in_opens_at = excluded.check_in_opens_at,
    check_in_closes_at = excluded.check_in_closes_at,
    film_access_ends_at = excluded.film_access_ends_at, updated_at = now();
