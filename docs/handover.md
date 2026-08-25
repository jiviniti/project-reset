# Handover and verification

Last updated: 25 August 2026

## Milestone 2 preview rollout

1. Disable preview submissions in Vercel with `SUBMISSIONS_ENABLED=false`.
2. In Supabase SQL Editor, apply these files in order:
   - `supabase/migrations/202608250003_aggregate_model.sql`
   - `supabase/migrations/202608250004_submission_aggregate_hook.sql`
3. Apply `supabase/seed/002_aggregate_baseline.sql`. Dashboard SQL Editor does not support the `\ir` command in `supabase/seed.sql`.
4. Run `supabase/tests/aggregate_milestone2.sql`. It performs test submissions inside a transaction and rolls them back.
5. Add Vercel browser-safe variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
6. Keep `SUPABASE_SECRET_KEY` server-only. Never substitute the publishable key for it.
7. Deploy the preview, verify the aggregate endpoint and realtime, then re-enable preview submissions.

## Verify the public aggregate snapshot

Open:

```text
https://project-reset-psi.vercel.app/api/v1/aggregates
```

Confirm:

- `scope` is `cumulative`;
- seeded, observed and combined totals are separate;
- only emotions, pathways and practices appear;
- no participant, screening, free-text, demographic or consent data appears.

In SQL Editor, compare the server snapshot:

```sql
select api.get_public_aggregates_v1();
```

## Verify counts and seeded/observed separation

```sql
select
  scope.scope_type,
  scope.scope_key,
  total.data_origin,
  total.count
from aggregate.submission_totals total
join aggregate.scopes scope on scope.id = total.scope_id
order by scope.scope_type, scope.scope_key, total.data_origin;

select
  definition.category,
  definition.metric_key,
  count.data_origin,
  sum(count.count) as total
from aggregate.metric_counts count
join aggregate.metric_definitions definition on definition.id = count.metric_definition_id
join aggregate.scopes scope on scope.id = count.scope_id
where scope.include_in_cumulative
group by definition.category, definition.metric_key, count.data_origin
order by definition.category, definition.metric_key, count.data_origin;
```

There must be exactly one `seeded_baseline` scope. Observed totals must exist only on screening/cohort scopes; cumulative public computation uses screening scopes only.

## Verify realtime and browser-role security

```sql
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
order by schemaname, tablename;

select
  has_table_privilege('anon', 'public.aggregate_revision', 'select') as anon_select,
  has_table_privilege('anon', 'public.aggregate_revision', 'insert') as anon_insert,
  has_table_privilege('anon', 'public.aggregate_revision', 'update') as anon_update,
  has_table_privilege('anon', 'public.aggregate_revision', 'delete') as anon_delete;

select
  p.proname,
  p.prosecdef as security_definer,
  has_function_privilege('service_role', p.oid, 'execute') as server_execute,
  has_function_privilege('anon', p.oid, 'execute') as anon_execute,
  has_function_privilege('authenticated', p.oid, 'execute') as authenticated_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('api', 'aggregate')
order by n.nspname, p.proname;
```

Expected:

- `public.aggregate_revision` is the only Project RESET realtime table;
- `anon_select = true` and all mutation columns are false;
- all application functions show `security_definer = false`;
- server execution is true only where granted;
- browser execution is false.

Open the Learning Lab in two browser windows. Submit a new response in one. The other must update without a page reload. Its network log should show an aggregate-revision event followed by `GET /api/v1/aggregates`, with no raw response payload.

## Rebuild/recovery

Disable submissions first, then run:

```sql
select aggregate.rebuild_observed_v1();
```

This clears and rebuilds observed aggregate rows and processed-response markers from committed raw responses, preserves seeded rows, and increments the revision once.

## Verify a raw test submission

Use a preview-only email and complete `/s/preview-screening`, then follow the private-record queries retained from Milestone 1. Do not paste identity or free text into tickets, chat or documentation.

## Manual owner actions

- Add the publishable Supabase key and public Supabase URL to Vercel Preview.
- Apply the two migrations and aggregate seed in Supabase.
- Run the SQL integration test.
- Confirm the hosted two-window realtime behavior.
- Review the illustrative seeded-baseline wording with the Foundation before production.

Production cutover, custom domain, KINEMA and actual reward delivery remain deferred.
