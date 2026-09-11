-- Temporarily restore one unindexed team rehearsal pathway. The application
-- additionally fails closed unless its server-only rehearsal code exists.
begin;

do $team_rehearsal$
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
  ) values (
    'preview-event',
    'Project RESET Learning Lab',
    'The Virsa Foundation',
    null,
    null,
    'active',
    questionnaire_id,
    'event',
    '2026-09-11 00:00:00+00',
    '2026-09-22 04:00:00+00',
    '2026-09-22 04:00:00+00',
    '{"pathway":"team_rehearsal","year":2026}'::jsonb
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

  update private.screenings
  set status = 'closed', updated_at = now()
  where slug in ('preview-screening', 'preview-expired-event');
end
$team_rehearsal$;

commit;
