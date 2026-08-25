-- Canonical, explicitly synthetic baseline derived from the latest supplied prototype.
-- These values are presentation fixtures, not observed Project RESET participants.

with published_options as (
  select
    case question.key
      when 'burnout_signs' then 'emotions'
      when 'reset_pathways' then 'pathways'
      when 'reset_practices' then 'practices'
    end as category,
    question.key as source_question_key,
    option.key as source_option_key,
    option.key as metric_key,
    option.label,
    option.position as sort_order
  from private.questionnaire_versions questionnaire
  join private.questions question on question.questionnaire_version_id = questionnaire.id
  join private.question_options option on option.question_id = question.id
  where questionnaire.key = 'reset-v1'
    and questionnaire.version = 1
    and questionnaire.status = 'published'
    and question.key in ('burnout_signs', 'reset_pathways', 'reset_practices')
    and option.key <> 'other'
)
insert into aggregate.metric_definitions (
  category, metric_key, label, source_question_key, source_option_key, sort_order
)
select category, metric_key, label, source_question_key, source_option_key, sort_order
from published_options
on conflict (category, metric_key) do update
set label = excluded.label,
    source_question_key = excluded.source_question_key,
    source_option_key = excluded.source_option_key,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

insert into aggregate.scopes (
  scope_type, scope_key, label, include_in_cumulative, is_public
)
values (
  'seeded_baseline',
  'canonical-demo-baseline',
  'Prototype demonstration baseline',
  true,
  true
)
on conflict (scope_key) do update
set label = excluded.label,
    include_in_cumulative = true,
    is_public = true,
    updated_at = now();

insert into aggregate.submission_totals (scope_id, data_origin, count)
select id, 'seeded', 4283
from aggregate.scopes
where scope_type = 'seeded_baseline'
on conflict (scope_id, data_origin) do update
set count = excluded.count, updated_at = now();

with baseline_values(category, metric_key, count) as (values
  ('emotions', 'overwhelmed', 2613),
  ('emotions', 'exhausted', 2456),
  ('emotions', 'emotional_eating', 2038),
  ('emotions', 'never_enough', 1855),
  ('emotions', 'brain_fog', 1724),
  ('emotions', 'reaching_for_junk_food', 1646),
  ('emotions', 'constantly_busy', 1541),
  ('emotions', 'anxious', 1463),
  ('emotions', 'skipping_meals', 1306),
  ('emotions', 'disconnected', 1228),
  ('emotions', 'numb', 1123),
  ('emotions', 'cant_sleep', 1045),
  ('emotions', 'living_on_takeout', 941),
  ('emotions', 'lonely', 888),
  ('emotions', 'climate_anxiety', 784),
  ('emotions', 'chronic_illness', 679),
  ('emotions', 'stuck', 601),
  ('emotions', 'gut_problems', 496),
  ('emotions', 'cynical', 418),
  ('pathways', 'nourish', 2741),
  ('pathways', 'restore', 3041),
  ('pathways', 'move', 2484),
  ('pathways', 'connect', 2827),
  ('pathways', 'rebalance', 2227),
  ('practices', 'walking', 2912),
  ('practices', 'eating_more_plants', 2767),
  ('practices', 'sleep', 2388),
  ('practices', 'cooking_at_home', 2213),
  ('practices', 'family', 2010),
  ('practices', 'fruit_veg', 1835),
  ('practices', 'friends', 1689),
  ('practices', 'yoga', 1369),
  ('practices', 'meditation', 1019),
  ('practices', 'boundaries', 903),
  ('practices', 'plant_protein', 757),
  ('practices', 'journaling', 553),
  ('practices', 'volunteering', 437)
), canonical_scope as (
  select id from aggregate.scopes where scope_type = 'seeded_baseline'
)
insert into aggregate.metric_counts (
  scope_id, data_origin, metric_definition_id, count
)
select canonical_scope.id, 'seeded', definition.id, baseline_values.count
from baseline_values
cross join canonical_scope
join aggregate.metric_definitions definition
  on definition.category = baseline_values.category
 and definition.metric_key = baseline_values.metric_key
on conflict (scope_id, data_origin, metric_definition_id) do update
set count = excluded.count, updated_at = now();

-- Rebuild observed values from committed raw submissions and publish one new revision.
select aggregate.rebuild_observed_v1();
