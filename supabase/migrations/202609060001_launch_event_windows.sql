-- Provision the two approved Project RESET launch pathways.
-- Times are stored in UTC and correspond to midnight America/New_York.
begin;

do $launch_events$
declare
  questionnaire_id uuid;
begin
  select id into questionnaire_id
  from private.questionnaire_versions
  where key = 'reset-v1' and version = 3 and status = 'published';

  if questionnaire_id is null then
    raise exception 'Published questionnaire reset-v1 version 3 is required';
  end if;

  insert into private.screenings (
    slug, name, institution, location, event_date, status,
    questionnaire_version_id, pathway_type, check_in_opens_at,
    check_in_closes_at, film_access_ends_at, cohort_metadata
  ) values
  (
    'climate-week-nyc-2026',
    'Third Degree Burnout: Climate Week NYC 2026',
    'Project RESET',
    'New York, NY',
    '2026-09-22 04:00:00+00',
    'active', questionnaire_id, 'event',
    '2026-09-22 04:00:00+00', '2026-10-07 04:00:00+00', '2026-10-07 04:00:00+00',
    '{"event":"climate_week_nyc","year":2026}'::jsonb
  ),
  (
    'columbia-climate-school-2026',
    'Third Degree Burnout: Columbia Climate School 2026',
    'Columbia Climate School',
    'New York, NY',
    '2026-10-07 04:00:00+00',
    'active', questionnaire_id, 'event',
    '2026-10-07 04:00:00+00', '2026-10-22 04:00:00+00', '2026-10-22 04:00:00+00',
    '{"event":"columbia_climate_school","year":2026}'::jsonb
  )
  on conflict (slug) do update set
    name = excluded.name,
    institution = excluded.institution,
    location = excluded.location,
    event_date = excluded.event_date,
    status = excluded.status,
    questionnaire_version_id = excluded.questionnaire_version_id,
    pathway_type = excluded.pathway_type,
    check_in_opens_at = excluded.check_in_opens_at,
    check_in_closes_at = excluded.check_in_closes_at,
    film_access_ends_at = excluded.film_access_ends_at,
    cohort_metadata = excluded.cohort_metadata,
    updated_at = now();
end
$launch_events$;

commit;
