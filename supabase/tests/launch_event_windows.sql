-- Run after 202609060001_launch_event_windows.sql. All checks are read-only.
do $launch_event_test$
declare
  climate_id uuid;
  columbia_id uuid;
  result record;
begin
  select id into strict climate_id from private.screenings where slug = 'climate-week-nyc-2026';
  select id into strict columbia_id from private.screenings where slug = 'columbia-climate-school-2026';

  if (select check_in_opens_at from private.screenings where id = climate_id) <> '2026-09-22 04:00:00+00'::timestamptz
     or (select check_in_closes_at from private.screenings where id = climate_id) <> '2026-10-07 04:00:00+00'::timestamptz then
    raise exception 'Climate Week window is incorrect';
  end if;

  if (select check_in_opens_at from private.screenings where id = columbia_id) <> '2026-10-07 04:00:00+00'::timestamptz
     or (select check_in_closes_at from private.screenings where id = columbia_id) <> '2026-10-22 04:00:00+00'::timestamptz then
    raise exception 'Columbia window is incorrect';
  end if;

  select * into result from private.resolve_screening_pathway_v1(climate_id, '2026-09-22 03:59:59+00');
  if result.event_window_status <> 'event_not_started' or result.reward_type <> 'trailer_access' then
    raise exception 'Climate Week opened early: %', result;
  end if;

  select * into result from private.resolve_screening_pathway_v1(climate_id, '2026-09-22 04:00:00+00');
  if result.event_window_status <> 'active_event' or result.reward_type <> 'film_access' then
    raise exception 'Climate Week did not open on its boundary: %', result;
  end if;

  select * into result from private.resolve_screening_pathway_v1(climate_id, '2026-10-07 04:00:00+00');
  if result.event_window_status <> 'event_expired' or result.reward_type <> 'trailer_access' then
    raise exception 'Climate Week closing boundary is not exclusive: %', result;
  end if;

  select * into result from private.resolve_screening_pathway_v1(columbia_id, '2026-10-07 04:00:00+00');
  if result.event_window_status <> 'active_event' or result.reward_type <> 'film_access' then
    raise exception 'Columbia did not open on its boundary: %', result;
  end if;

  select * into result from private.resolve_screening_pathway_v1(columbia_id, '2026-10-22 04:00:00+00');
  if result.event_window_status <> 'event_expired' or result.reward_type <> 'trailer_access' then
    raise exception 'Columbia closing boundary is not exclusive: %', result;
  end if;

  if exists (
    select 1 from private.screenings screening
    join private.questionnaire_versions questionnaire on questionnaire.id = screening.questionnaire_version_id
    where screening.id in (climate_id, columbia_id)
      and (questionnaire.key <> 'reset-v1' or questionnaire.version <> 3)
  ) then
    raise exception 'Launch events are not assigned to questionnaire version 3';
  end if;
end
$launch_event_test$;
