-- Promote the canonical Project RESET Learning Lab pathway and retire the
-- public screening records used during pre-launch review.
begin;

do $production_cutover$
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
    'project-reset',
    'Project RESET Learning Lab',
    'The Virsa Foundation',
    null,
    null,
    'active',
    questionnaire_id,
    'non_event',
    null,
    null,
    null,
    '{"pathway":"project_reset_learning_lab"}'::jsonb
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
  where slug in ('preview-screening', 'preview-event', 'preview-expired-event');
end
$production_cutover$;

commit;
