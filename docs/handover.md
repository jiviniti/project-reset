# Handover and verification

Last updated: 29 August 2026

## Event/non-event pathway rollout

1. Set `SUBMISSIONS_ENABLED=false` in the Vercel preview environment and redeploy.
2. Apply `supabase/migrations/202608290001_event_non_event_pathways.sql` in Supabase SQL Editor.
3. Reapply `supabase/seed/001_preview.sql`; it explicitly keeps `preview-screening` on the non-event pathway.
4. Run `supabase/tests/pathway_foundation.sql`. It creates active and expired event submissions inside a transaction and rolls all writes back.
5. Add `NEXT_PUBLIC_PROJECT_RESET_TRAILER_URL` in Vercel only after Nivi confirms the final trailer destination. It is browser-safe configuration, not a secret.
6. Redeploy, verify `/s/preview-screening` promises trailer access, then re-enable preview submissions.

To configure a real event after its dates are approved:

```sql
update private.screenings
set pathway_type = 'event',
    check_in_opens_at = '2026-09-15T00:00:00Z',
    check_in_closes_at = '2026-09-23T00:00:00Z',
    film_access_ends_at = '2026-09-25T00:00:00Z',
    updated_at = now()
where slug = 'replace-with-approved-event-slug';

select api.get_screening_v1('replace-with-approved-event-slug');
```

The returned `entryPathway`, `rewardType` and `eventWindowStatus` must match the current window. Do not put event URLs into `NEXT_PUBLIC_PROJECT_RESET_SIGNUP_URL`; that share-card destination must remain a canonical non-event route.

## Milestone 2 preview rollout

1. Disable preview submissions in Vercel with `SUBMISSIONS_ENABLED=false`.
2. In Supabase SQL Editor, apply these files in order:
   - `supabase/migrations/202608250003_aggregate_model.sql`
   - `supabase/migrations/202608250004_submission_aggregate_hook.sql`
   - `supabase/migrations/202608250005_fix_revision_safe_update.sql`
   - `supabase/migrations/202608250006_us_english_policy.sql`
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

## Hosted verification record

Verified on 25 August 2026 at `project-reset-psi.vercel.app`:

- the browser bundle contained the intended public Supabase URL and publishable key, with no secret key;
- the public aggregate endpoint returned the allowlisted cumulative snapshot;
- one synthetic preview submission committed and increased observed responses from four to five;
- an already-open visualization received a PII-free revision update and moved from revision 3 to revision 4 without a page reload;
- the observed total remained five during the notification-only refresh;
- `202608250005_fix_revision_safe_update.sql` corrected Supabase API safe-update rejection by targeting the singleton revision row explicitly.

## Product and visual reconciliation verification

The latest approved file was confirmed byte-identical to `reference/prototype/Project RESET Learning Lab Prototype.html`; see `docs/prototype-reconciliation.md` for its checksum and screen audit.

Verified locally on 25 August 2026:

- lint, TypeScript and production build completed without errors;
- 28 Vitest unit/integration assertions passed;
- four Playwright journeys passed across iPhone 13 and desktop Chromium;
- custom burnout and RESET tags retained trimmed literal wording in the final payload;
- a long, punctuated non-ASCII first name rendered into a valid 1080×1350 canvas card;
- the card excluded PII beyond first name, burnout answers, free text, demographics and custom tags;
- required 390px, larger-mobile, tablet and desktop layouts were visually inspected;
- focus styling, sticky progress, wrapped custom-tag suggestions, scroll-to-stage behavior and reduced-motion CSS were checked;
- the aggregate SQL regression passed inside a rollback, including private custom-tag persistence, safe public output, idempotency, failed-submission rollback, seeded/observed separation, screening/cumulative totals, grants/RLS and realtime publication boundaries;
- `202608250006_us_english_policy.sql` was applied to the preview database without altering the previous policy record.

The exact paid “Debora Celina Script” font remains an optional Foundation-supplied dependency. The approved prototype’s embedded Petit Formal Script substitute is used in the current build.

Hosted reconciliation verification on 25 August 2026:

- commit `4dac975` deployed successfully to `https://project-reset-psi.vercel.app/s/preview-screening`;
- the new RESET hero, final-step PII order, private-tag composer, U.S.-English acknowledgement and Learning Lab composition were present;
- the safe endpoint returned revision 5 with seeded 4,283, observed 6 and combined 4,289, containing only approved totals and metric categories;
- an already-open Learning Lab moved from five to six observed check-ins without a page reload after the independent revision 4 → 5 update;
- no hosted submission was made during this reconciliation audit. The source of the sixth preview response was not inferred; all preview records remain subject to the documented production-cleanup requirement.

Foundation-feedback verification on 26 August 2026:

- the Learning Lab’s top check-in action remained fixed at the top of the 390px viewport after scrolling to the footer;
- the mobile layout had no horizontal overflow, and the desktop artifact remained centered at its approved 390px measure;
- the final stage showed explicit required labels for name/initials and email, a separate optional-demographics explanation, and no noninteractive delivery-method control;
- the JIVINITI footer mark rendered dark against the cream background and the partner lockup was tightened;
- the observed-check-in callout was absent while the illustrative-preview label and safe aggregate data remained intact;
- the participant and Learning Lab Playwright journeys passed on mobile and desktop Chromium.

Hosted pathway/journey verification on 30 August 2026:

- `202608290001_event_non_event_pathways.sql` was applied to the isolated Project RESET preview database;
- `preview-screening` resolves to `non_event`, `trailer_access`, and `non_event` window status;
- the resolver is executable by `service_role` and not by `anon` or `authenticated`; `anon` cannot read private participations;
- one clearly synthetic submission (`deployment-qa-559086a@example.invalid`) committed as `non_event / trailer_access / web / available` and increased the preview observed aggregate once;
- commit `559086a` deployed through the existing Git integration and was verified at `https://project-reset-psi.vercel.app/s/preview-screening`;
- the hosted success page rendered the earlier full inline Learning Lab, contained no restart controls, retained the card, and its skip anchor reached the card; this was subsequently superseded by Nivi’s request for a condensed results → access → card sequence;
- `preview-event` and `preview-expired-event` are demonstration-only screening routes, not approved production events.

## Manual owner actions

- Review the illustrative seeded-baseline wording with the Foundation before production.
- Confirm whether the Foundation owns/licences “Debora Celina Script” if exact script-typeface parity is required.
- Retain the preview-only dataset warning: the synthetic test response and all other preview research records must be removed before any production cutover.
- Confirm whether name/initials and email are required for every check-in or whether an anonymous/no-reward submission path is desired.
- Supply the final consumer wording for the identity and film-access stage.
- Supply the exact copyright owner and approved copyright phrase before a site-wide footer is introduced.
- Confirm that native device sharing plus PNG download is the intended share-card scope; direct posting destinations cannot be guaranteed by a web application.

Production cutover, custom domain, KINEMA and actual reward delivery remain deferred.
