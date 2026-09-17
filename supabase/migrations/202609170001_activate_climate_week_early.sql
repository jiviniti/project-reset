-- Open the Climate Week pathway early for controlled pre-event sharing.
-- The closing boundary and Columbia pathway remain unchanged.
begin;

do $activate_climate_week_early$
declare
  affected_rows integer;
begin
  update private.screenings
  set check_in_opens_at = '2026-09-17 04:00:00+00'::timestamptz,
      updated_at = now()
  where slug = 'climate-week-nyc-2026'
    and status = 'active'
    and pathway_type = 'event'
    and check_in_closes_at = '2026-10-07 04:00:00+00'::timestamptz
    and film_access_ends_at = '2026-10-07 04:00:00+00'::timestamptz;

  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'Expected to activate exactly one Climate Week screening; updated %', affected_rows;
  end if;
end
$activate_climate_week_early$;

commit;
