-- Milestone 2: cumulative, de-identified aggregate model and PII-free realtime invalidation.
create schema if not exists aggregate;

revoke all on schema aggregate from public, anon, authenticated;
grant usage on schema aggregate to service_role;

alter default privileges in schema aggregate revoke all on tables from public, anon, authenticated;
alter default privileges in schema aggregate grant select, insert, update, delete on tables to service_role;
alter default privileges in schema aggregate revoke execute on functions from public, anon, authenticated;

create table aggregate.scopes (
  id uuid primary key default gen_random_uuid(),
  scope_type text not null check (scope_type in ('screening', 'seeded_baseline', 'cohort')),
  scope_key text not null unique check (scope_key ~ '^[a-z0-9]+(?:[-:][a-z0-9]+)*$'),
  label text not null check (char_length(btrim(label)) between 1 and 160),
  screening_id uuid unique references private.screenings(id),
  public_cohort_key text,
  include_in_cumulative boolean not null default false,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (scope_type = 'screening' and screening_id is not null and public_cohort_key is null and include_in_cumulative)
    or (scope_type = 'seeded_baseline' and screening_id is null and public_cohort_key is null and include_in_cumulative)
    or (scope_type = 'cohort' and screening_id is null and public_cohort_key is not null and not include_in_cumulative)
  )
);

create unique index aggregate_one_seeded_baseline_idx
  on aggregate.scopes (scope_type)
  where scope_type = 'seeded_baseline';

create table aggregate.metric_definitions (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('emotions', 'pathways', 'practices')),
  metric_key text not null check (metric_key ~ '^[a-z0-9_]+$'),
  label text not null check (char_length(btrim(label)) between 1 and 120),
  source_question_key text not null check (source_question_key ~ '^[a-z0-9_]+$'),
  source_option_key text not null check (source_option_key ~ '^[a-z0-9_]+$'),
  sort_order integer not null check (sort_order > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category, metric_key),
  unique (source_question_key, source_option_key)
);

create table aggregate.metric_counts (
  scope_id uuid not null references aggregate.scopes(id) on delete cascade,
  data_origin text not null check (data_origin in ('seeded', 'observed')),
  metric_definition_id uuid not null references aggregate.metric_definitions(id),
  count bigint not null default 0 check (count >= 0),
  updated_at timestamptz not null default now(),
  primary key (scope_id, data_origin, metric_definition_id)
);

create table aggregate.submission_totals (
  scope_id uuid not null references aggregate.scopes(id) on delete cascade,
  data_origin text not null check (data_origin in ('seeded', 'observed')),
  count bigint not null default 0 check (count >= 0),
  updated_at timestamptz not null default now(),
  primary key (scope_id, data_origin)
);

-- Internal idempotency/recovery bridge. It is non-exposed and never returned publicly.
create table aggregate.processed_responses (
  response_id uuid primary key references private.responses(id) on delete cascade,
  scope_id uuid not null references aggregate.scopes(id) on delete cascade,
  processed_at timestamptz not null default now()
);

create table aggregate.state (
  state_key text primary key check (state_key = 'global'),
  revision bigint not null default 0 check (revision >= 0),
  snapshot_version integer not null default 1 check (snapshot_version > 0),
  updated_at timestamptz not null default now()
);

insert into aggregate.state (state_key) values ('global') on conflict (state_key) do nothing;

-- The only browser-readable database resource. It intentionally has exactly two columns.
create table if not exists public.aggregate_revision (
  revision bigint primary key check (revision >= 0),
  updated_at timestamptz not null
);

insert into public.aggregate_revision (revision, updated_at)
values (0, now())
on conflict do nothing;

alter table public.aggregate_revision enable row level security;
revoke all on table public.aggregate_revision from public, anon, authenticated;
grant select on table public.aggregate_revision to anon, authenticated;
grant select, insert, update, delete on table public.aggregate_revision to service_role;

drop policy if exists aggregate_revision_browser_read on public.aggregate_revision;
create policy aggregate_revision_browser_read
  on public.aggregate_revision
  for select
  to anon, authenticated
  using (true);

do $secure_aggregate_tables$
declare
  table_name text;
begin
  foreach table_name in array array[
    'scopes', 'metric_definitions', 'metric_counts', 'submission_totals',
    'processed_responses', 'state'
  ] loop
    execute format('alter table aggregate.%I enable row level security', table_name);
    execute format('revoke all on table aggregate.%I from public, anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on table aggregate.%I to service_role', table_name);
  end loop;
end
$secure_aggregate_tables$;

create or replace function aggregate.enforce_origin_scope_v1()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  target_scope_type text;
begin
  select scope_type into strict target_scope_type
  from aggregate.scopes
  where id = new.scope_id;

  if new.data_origin = 'seeded' and target_scope_type <> 'seeded_baseline' then
    raise exception using errcode = '23514', message = 'seeded_origin_requires_canonical_baseline';
  end if;

  if new.data_origin = 'observed' and target_scope_type = 'seeded_baseline' then
    raise exception using errcode = '23514', message = 'observed_origin_cannot_use_seeded_baseline';
  end if;

  return new;
end;
$function$;

revoke execute on function aggregate.enforce_origin_scope_v1() from public, anon, authenticated;

create trigger metric_counts_origin_scope
before insert or update on aggregate.metric_counts
for each row execute function aggregate.enforce_origin_scope_v1();

create trigger submission_totals_origin_scope
before insert or update on aggregate.submission_totals
for each row execute function aggregate.enforce_origin_scope_v1();

create or replace function aggregate.bump_revision_v1()
returns bigint
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  next_revision bigint;
begin
  update aggregate.state
  set revision = revision + 1, updated_at = now()
  where state_key = 'global'
  returning revision into strict next_revision;

  update public.aggregate_revision
  set revision = next_revision, updated_at = now();

  if not found then
    insert into public.aggregate_revision (revision, updated_at)
    values (next_revision, now());
  end if;

  return next_revision;
end;
$function$;

revoke execute on function aggregate.bump_revision_v1() from public, anon, authenticated;
grant execute on function aggregate.bump_revision_v1() to service_role;

create or replace function aggregate.apply_observed_submission_v1(
  submitted_response_id uuid,
  submitted_screening_id uuid
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  target_scope_id uuid;
  inserted_rows integer;
begin
  if not exists (
    select 1
    from private.responses response
    join private.participations participation on participation.id = response.participation_id
    where response.id = submitted_response_id
      and participation.screening_id = submitted_screening_id
      and participation.status = 'completed'
  ) then
    raise exception using errcode = 'P0001', message = 'aggregate_response_screening_mismatch';
  end if;

  insert into aggregate.scopes (
    scope_type, scope_key, label, screening_id, include_in_cumulative, is_public
  )
  select 'screening', 'screening:' || screening.slug, screening.name, screening.id, true, false
  from private.screenings screening
  where screening.id = submitted_screening_id
  on conflict (screening_id) do update
    set label = excluded.label, updated_at = now()
  returning id into target_scope_id;

  insert into aggregate.processed_responses (response_id, scope_id)
  values (submitted_response_id, target_scope_id)
  on conflict (response_id) do nothing;
  get diagnostics inserted_rows = row_count;

  if inserted_rows = 0 then
    return false;
  end if;

  insert into aggregate.submission_totals (scope_id, data_origin, count)
  values (target_scope_id, 'observed', 1)
  on conflict (scope_id, data_origin) do update
    set count = aggregate.submission_totals.count + 1,
        updated_at = now();

  insert into aggregate.metric_counts (
    scope_id, data_origin, metric_definition_id, count
  )
  select target_scope_id, 'observed', definition.id, count(*)
  from private.response_selections selection
  join private.questions question on question.id = selection.question_id
  join private.question_options option on option.id = selection.option_id
  join aggregate.metric_definitions definition
    on definition.source_question_key = question.key
   and definition.source_option_key = option.key
   and definition.is_active
  where selection.response_id = submitted_response_id
  group by definition.id
  on conflict (scope_id, data_origin, metric_definition_id) do update
    set count = aggregate.metric_counts.count + excluded.count,
        updated_at = now();

  perform aggregate.bump_revision_v1();
  return true;
end;
$function$;

revoke execute on function aggregate.apply_observed_submission_v1(uuid, uuid) from public, anon, authenticated;
grant execute on function aggregate.apply_observed_submission_v1(uuid, uuid) to service_role;

create or replace function aggregate.rebuild_observed_v1()
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  rebuilt_responses bigint;
  next_revision bigint;
begin
  insert into aggregate.scopes (
    scope_type, scope_key, label, screening_id, include_in_cumulative, is_public
  )
  select 'screening', 'screening:' || screening.slug, screening.name, screening.id, true, false
  from private.screenings screening
  on conflict (screening_id) do update
    set label = excluded.label, updated_at = now();

  delete from aggregate.metric_counts where data_origin = 'observed';
  delete from aggregate.submission_totals where data_origin = 'observed';
  delete from aggregate.processed_responses;

  insert into aggregate.processed_responses (response_id, scope_id)
  select response.id, scope.id
  from private.responses response
  join private.participations participation on participation.id = response.participation_id
  join aggregate.scopes scope on scope.screening_id = participation.screening_id
  where participation.status = 'completed';
  get diagnostics rebuilt_responses = row_count;

  insert into aggregate.submission_totals (scope_id, data_origin, count)
  select scope.id, 'observed', count(*)
  from private.responses response
  join private.participations participation on participation.id = response.participation_id
  join aggregate.scopes scope on scope.screening_id = participation.screening_id
  where participation.status = 'completed'
  group by scope.id;

  insert into aggregate.metric_counts (
    scope_id, data_origin, metric_definition_id, count
  )
  select scope.id, 'observed', definition.id, count(*)
  from private.responses response
  join private.participations participation on participation.id = response.participation_id
  join aggregate.scopes scope on scope.screening_id = participation.screening_id
  join private.response_selections selection on selection.response_id = response.id
  join private.questions question on question.id = selection.question_id
  join private.question_options option on option.id = selection.option_id
  join aggregate.metric_definitions definition
    on definition.source_question_key = question.key
   and definition.source_option_key = option.key
   and definition.is_active
  where participation.status = 'completed'
  group by scope.id, definition.id;

  next_revision := aggregate.bump_revision_v1();
  return jsonb_build_object('rebuiltResponses', rebuilt_responses, 'revision', next_revision);
end;
$function$;

revoke execute on function aggregate.rebuild_observed_v1() from public, anon, authenticated;
grant execute on function aggregate.rebuild_observed_v1() to service_role;

-- Latest approved prototype keeps participant-created tags private for later moderation.
with questionnaire as (
  select id
  from private.questionnaire_versions
  where key = 'reset-v1' and version = 1
)
insert into private.questions (
  questionnaire_version_id, key, prompt, answer_type, position, required
)
select questionnaire.id, item.key, item.prompt, 'text', item.position, false
from questionnaire
cross join (values
  ('burnout_custom_tags', 'Participant-created burnout tags', 6),
  ('reset_custom_tags', 'Participant-created RESET tags', 7)
) as item(key, prompt, position)
on conflict (questionnaire_version_id, key) do update
set prompt = excluded.prompt, answer_type = excluded.answer_type, position = excluded.position;

-- Establish the approved v1 allowlist and backfill already committed preview responses.
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

select aggregate.rebuild_observed_v1();

create or replace function api.get_public_aggregates_v1()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $function$
  with eligible_counts as (
    select
      definition.category,
      definition.metric_key,
      definition.label,
      definition.sort_order,
      coalesce(sum(metric.count) filter (
        where metric.data_origin = 'seeded'
          and scope.scope_type = 'seeded_baseline'
          and scope.include_in_cumulative
      ), 0)::bigint as seeded,
      coalesce(sum(metric.count) filter (
        where metric.data_origin = 'observed'
          and scope.scope_type = 'screening'
          and scope.include_in_cumulative
      ), 0)::bigint as observed
    from aggregate.metric_definitions definition
    left join aggregate.metric_counts metric on metric.metric_definition_id = definition.id
    left join aggregate.scopes scope on scope.id = metric.scope_id
    where definition.is_active
    group by definition.id
  ), totals as (
    select
      coalesce(sum(total.count) filter (
        where total.data_origin = 'seeded'
          and scope.scope_type = 'seeded_baseline'
          and scope.include_in_cumulative
      ), 0)::bigint as seeded,
      coalesce(sum(total.count) filter (
        where total.data_origin = 'observed'
          and scope.scope_type = 'screening'
          and scope.include_in_cumulative
      ), 0)::bigint as observed
    from aggregate.submission_totals total
    join aggregate.scopes scope on scope.id = total.scope_id
  ), categories as (
    select category, jsonb_agg(
      jsonb_build_object(
        'key', metric_key,
        'label', label,
        'seeded', seeded,
        'observed', observed,
        'combined', seeded + observed,
        'suppressed', false
      ) order by sort_order, metric_key
    ) as metrics
    from eligible_counts
    group by category
  )
  select jsonb_build_object(
    'apiVersion', '1',
    'snapshotVersion', state.snapshot_version,
    'revision', state.revision,
    'generatedAt', now(),
    'scope', 'cumulative',
    'suppression', jsonb_build_object(
      'minimumObservedCellSize', 5,
      'applied', false
    ),
    'totals', jsonb_build_object(
      'seeded', totals.seeded,
      'observed', totals.observed,
      'combined', totals.seeded + totals.observed
    ),
    'metrics', jsonb_build_object(
      'emotions', coalesce((select metrics from categories where category = 'emotions'), '[]'::jsonb),
      'pathways', coalesce((select metrics from categories where category = 'pathways'), '[]'::jsonb),
      'practices', coalesce((select metrics from categories where category = 'practices'), '[]'::jsonb)
    )
  )
  from aggregate.state state
  cross join totals
  where state.state_key = 'global';
$function$;

revoke execute on function api.get_public_aggregates_v1() from public, anon, authenticated;
grant execute on function api.get_public_aggregates_v1() to service_role;

-- Postgres Changes publishes only this PII-free invalidation resource.
do $realtime_publication$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    execute 'create publication supabase_realtime';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'aggregate_revision'
  ) then
    execute 'alter publication supabase_realtime add table public.aggregate_revision';
  end if;
end
$realtime_publication$;

-- Keep the realtime surface explicit: no raw or aggregate-count table may be published.
do $remove_unsafe_realtime_tables$
declare
  published record;
begin
  for published in
    select schemaname, tablename
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and (schemaname = 'private' or schemaname = 'aggregate')
  loop
    execute format(
      'alter publication supabase_realtime drop table %I.%I',
      published.schemaname,
      published.tablename
    );
  end loop;
end
$remove_unsafe_realtime_tables$;
