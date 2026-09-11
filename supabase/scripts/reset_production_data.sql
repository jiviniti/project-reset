-- DESTRUCTIVE: prepare an empty, genuine-response-only production dataset.
-- Never run automatically or before written approval from the data owner.
--
-- Before execution:
--   1. Set SUBMISSIONS_ENABLED=false and verify submissions return 503.
--   2. Take and verify a restorable Supabase backup.
--   3. In this same SQL session run:
--      select set_config('app.confirm_production_reset', 'YES', false);

do $guard$
begin
  if current_setting('app.confirm_production_reset', true) is distinct from 'YES' then
    raise exception 'Production reset refused: set app.confirm_production_reset=YES in this session.';
  end if;
end
$guard$;

begin;

-- TRUNCATE ... CASCADE removes the internal participant graph while preserving
-- questionnaires, policies, screenings, and all schema configuration.
truncate table private.participants cascade;

-- The public experience no longer uses the canonical illustrative baseline.
-- Deleting its scope cascades only its seeded totals and metric counts.
delete from aggregate.scopes
where scope_type = 'seeded_baseline';

-- Rebuild from the now-empty response graph and publish a new aggregate revision.
select aggregate.rebuild_observed_v1();

do $verify_empty$
declare
  private_records bigint;
  seeded_records bigint;
  observed_records bigint;
begin
  select
    (select count(*) from private.participants)
    + (select count(*) from private.participations)
    + (select count(*) from private.consents)
    + (select count(*) from private.communication_preferences)
    + (select count(*) from private.responses)
    + (select count(*) from private.response_answers)
    + (select count(*) from private.response_selections)
    + (select count(*) from private.reward_deliveries)
  into private_records;

  select
    (select count(*) from aggregate.metric_counts where data_origin = 'seeded')
    + (select count(*) from aggregate.submission_totals where data_origin = 'seeded')
  into seeded_records;

  select
    (select count(*) from aggregate.metric_counts where data_origin = 'observed')
    + (select count(*) from aggregate.submission_totals where data_origin = 'observed')
    + (select count(*) from aggregate.processed_responses)
  into observed_records;

  if private_records <> 0 or seeded_records <> 0 or observed_records <> 0 then
    raise exception 'Production reset verification failed (private %, seeded %, observed %)',
      private_records, seeded_records, observed_records;
  end if;

  if not exists (
    select 1 from private.screenings
    where slug = 'project-reset' and status = 'active' and pathway_type = 'non_event'
  ) then
    raise exception 'Production reset verification failed: project-reset screening is not active';
  end if;
end
$verify_empty$;

commit;

-- Keep submissions disabled until the empty aggregate response and all public
-- production routes have been verified. Re-enable only in Vercel configuration.
