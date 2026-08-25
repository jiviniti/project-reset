-- Supabase API roles reject UPDATE statements without an explicit WHERE clause.
-- Keep the realtime invalidation table a true singleton and target that row
-- explicitly so a committed submission can safely advance the revision.
create unique index if not exists aggregate_revision_singleton_idx
  on public.aggregate_revision ((true));

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

  update public.aggregate_revision revision_row
  set revision = next_revision, updated_at = now()
  where revision_row.revision = (
    select max(current_row.revision)
    from public.aggregate_revision current_row
  );

  if not found then
    insert into public.aggregate_revision (revision, updated_at)
    values (next_revision, now());
  end if;

  return next_revision;
end;
$function$;

revoke execute on function aggregate.bump_revision_v1() from public, anon, authenticated;
grant execute on function aggregate.bump_revision_v1() to service_role;
