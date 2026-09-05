# Deployment

## Preview

Milestone 1 was verified on 24 August 2026, Milestone 2 and the pre-Milestone-3 product/visual reconciliation on 25 August 2026 at [project-reset-psi.vercel.app](https://project-reset-psi.vercel.app/). Questionnaire version 2 was transactionally rolled out and verified there on 2 September 2026 with 32 observed preview responses at aggregate revision 32.

1. Apply the committed files in `supabase/migrations/` in filename order, including `202609050001_questionnaire_v3_commitment.sql`, then apply preview seeds only when preparing a fresh preview project. `supabase/seed.sql` is a psql entry point and its `\ir` command is not accepted by the Dashboard SQL Editor.
2. In Supabase **Data API → Settings**, add `api` to the exposed schemas and leave `private` and `aggregate` excluded. Do not use dashboard exposure toggles for server-only functions. The migration explicitly grants execution to `service_role`.
3. Set the Vercel variables listed in `.env.example`. Only the Supabase URL, current publishable key and browser-visible campaign URLs may use `NEXT_PUBLIC_`; the secret key must remain server-only. `NEXT_PUBLIC_DONATE_URL` defaults to the approved `https://thirddegreeburnout.com/donate`, and `NEXT_PUBLIC_PROJECT_RESET_TRAILER_URL` defaults to the approved film homepage `https://www.thirddegreeburnout.com/`.
4. Deploy from the private GitHub repository.
5. Configure the `reset-submissions` Vercel WAF instrument for 1,000 requests/IP/60 seconds and 429 action.
6. Complete `/s/preview-screening`, verify the record graph and cumulative snapshot, and run the two-window realtime check in `docs/handover.md`.

## KINEMA manual reward activation

1. Create the two screening rows only after exact opening/closing timestamps are approved. Use slugs `climate-week-nyc-2026` and `columbia-climate-school-2026`, pathway `event`, and questionnaire version 3.
2. Set server-only `KINEMA_FILM_URL`, `KINEMA_CLIMATE_WEEK_NYC_2026_CODE`, and `KINEMA_COLUMBIA_CLIMATE_SCHOOL_2026_CODE` in Vercel. Do not use `NEXT_PUBLIC_`.
3. Set `REWARD_PROVIDER=kinema_manual`, redeploy, and complete one controlled eligible check-in per event.
4. Confirm expired and not-yet-open routes return trailer access and never include `rewardAccess`.
5. Monitor redemption counts in KINEMA Reports. KINEMA charges $1 per redemption; the current combined cap is 350.
6. Email KINEMA to disable or change a code. There is no scheduled shutdown or app-side revocation after redemption. Rentals allow 30 days to start and 48 hours to finish once started.

The preview WAF threshold is intentionally provisional and must be reviewed against expected audience size, venue networking and submission bursts before production.

## Production cutover

Production cutover is not part of this milestone. Before promotion: disable writes, back up, explicitly unlock and run `supabase/scripts/prepare_production.sql`, reseed approved configuration, verify zero test research rows, remove the production secret from Preview, and set Preview `SUBMISSIONS_ENABLED=false`.
