# Deployment

## Preview

Milestone 1 was verified on 24 August 2026, Milestone 2 and the pre-Milestone-3 product/visual reconciliation on 25 August 2026 at [project-reset-psi.vercel.app](https://project-reset-psi.vercel.app/). The reconciliation check verified the new frontend and a no-reload update from five to six observed responses (revision 4 to 5) without making another hosted submission.

1. Apply the committed files in `supabase/migrations/` in filename order, including the additive `202608250006_us_english_policy.sql`, then apply `supabase/seed/001_preview.sql` and `supabase/seed/002_aggregate_baseline.sql` to the isolated RESET preview project. `supabase/seed.sql` is a psql entry point and its `\ir` command is not accepted by the Dashboard SQL Editor.
2. In Supabase **Data API → Settings**, add `api` to the exposed schemas and leave `private` and `aggregate` excluded. Do not use dashboard exposure toggles for server-only functions. The migration explicitly grants execution to `service_role`.
3. Set the Vercel variables listed in `.env.example`. Only the Supabase URL, current publishable key and browser-visible campaign URLs may use `NEXT_PUBLIC_`; the secret key must remain server-only. `NEXT_PUBLIC_DONATE_URL` defaults to the approved `https://thirddegreeburnout.com/donate` and can be overridden without a code change.
4. Deploy from the private GitHub repository.
5. Configure the `reset-submissions` Vercel WAF instrument for 1,000 requests/IP/60 seconds and 429 action.
6. Complete `/s/preview-screening`, verify the record graph and cumulative snapshot, and run the two-window realtime check in `docs/handover.md`.

The preview WAF threshold is intentionally provisional and must be reviewed against expected audience size, venue networking and submission bursts before production.

## Production cutover

Production cutover is not part of this milestone. Before promotion: disable writes, back up, explicitly unlock and run `supabase/scripts/prepare_production.sql`, reseed approved configuration, verify zero test research rows, remove the production secret from Preview, and set Preview `SUBMISSIONS_ENABLED=false`.
