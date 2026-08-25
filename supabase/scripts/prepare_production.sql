-- DESTRUCTIVE: never run automatically.
-- Before execution: disable submissions, take a backup, and set the confirmation
-- in the same SQL session with: select set_config('app.confirm_preview_cleanup', 'YES', false);

do $guard$
begin
  if current_setting('app.confirm_preview_cleanup', true) is distinct from 'YES' then
    raise exception 'Preview cleanup refused: set app.confirm_preview_cleanup=YES in this session.';
  end if;
end
$guard$;

begin;
truncate table private.participants cascade;
select aggregate.rebuild_observed_v1();
commit;

-- Configuration and the canonical seeded baseline are deliberately preserved.
-- Verify all participant/research tables and observed aggregates contain zero
-- test rows, then enable production submissions only in the production deployment.
