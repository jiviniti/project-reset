# Deployment

## Preview

Milestone 1 was verified on 24 August 2026, Milestone 2 and the pre-Milestone-3 product/visual reconciliation on 25 August 2026 at [project-reset-psi.vercel.app](https://project-reset-psi.vercel.app/). Questionnaire version 3 was rolled out and verified there on 5 September 2026.

1. Apply the committed files in `supabase/migrations/` in filename order, including `202609050001_questionnaire_v3_commitment.sql`, `202609060001_launch_event_windows.sql`, and `202609070001_final_consent_policy.sql`, then apply preview seeds only when preparing a fresh preview project. `supabase/seed.sql` is a psql entry point and its `\ir` command is not accepted by the Dashboard SQL Editor.
2. In Supabase **Data API → Settings**, add `api` to the exposed schemas and leave `private` and `aggregate` excluded. Do not use dashboard exposure toggles for server-only functions. The migration explicitly grants execution to `service_role`.
3. Set the Vercel variables listed in `.env.example`. Only the Supabase URL, current publishable key and browser-visible campaign URLs may use `NEXT_PUBLIC_`; the secret key must remain server-only. `NEXT_PUBLIC_DONATE_URL` defaults to the approved Fuel the Impact page at `https://thirddegreeburnout.com/fueltheimpact`. `NEXT_PUBLIC_PROJECT_RESET_TRAILER_URL` defaults to the approved film homepage `https://www.thirddegreeburnout.com/`.
4. Deploy from the GitHub repository only after Security CI passes. Dependencies are exact-version pinned; do not replace them with `latest` ranges.
5. Configure the `reset-submissions` Vercel WAF instrument for 1,000 requests/IP/60 seconds and 429 action.
6. Complete `/s/preview-screening`, verify the record graph and cumulative snapshot, and run the two-window realtime check in `docs/handover.md`.

### Participant-path preview routes

- `/` opens the ordinary non-event Learning Lab check-in directly. The former screening-selection interstitial has been removed.
- `/s/preview-event` normally returns `DEMO_CODE_NOT_VALID` with a generic KINEMA link. During the approved team test only, `KINEMA_TEST_CODE` and `KINEMA_FILM_URL` may provide the limited dummy redemption and private page while `DATASET_ENV=preview`. Remove the test code from every Vercel environment immediately after Nivi and Brian finish testing.
- `/s/preview-expired-event` simulates an event whose access window has ended and shows the trailer pathway.
- `/s/preview-screening` remains a compatibility and testing URL for the same ordinary non-event pathway and shows trailer access after check-in.

These routes are demonstrations, not launch QR destinations. The active-event placeholder is available only while `DATASET_ENV=preview`.

## KINEMA manual reward activation

1. Create the two screening rows only after exact opening/closing timestamps are approved. Use slugs `climate-week-nyc-2026` and `columbia-climate-school-2026`, pathway `event`, and questionnaire version 3.
2. Set server-only `KINEMA_FILM_URL`, `KINEMA_CLIMATE_WEEK_NYC_2026_CODE`, and `KINEMA_COLUMBIA_CLIMATE_SCHOOL_2026_CODE` in Vercel. Do not use `NEXT_PUBLIC_`.
3. Set `REWARD_PROVIDER=kinema_manual`, redeploy, and complete one controlled eligible check-in per event.
4. Confirm expired and not-yet-open routes return trailer access and never include `rewardAccess`.
5. Monitor redemption counts in KINEMA Reports. KINEMA charges $1 per redemption; the current combined cap is 350.
6. In the KINEMA Filmmaker Dashboard, enable TVOD/rentals, set rental availability to cover both event windows, and publish the film page as **Private**. Add `https://reset.thirddegreeburnout.com/start-a-conversation` as the post-film engagement link.
7. Run one controlled checkout with KINEMA's no-cost, limited-use dummy code. Use a participant test account, confirm the price becomes zero, verify the confirmation email and return path, and confirm the redemption appears under Reports → Rentals. Never place the dummy code in application configuration or documentation.
8. Obtain written confirmation from KINEMA that the two production-code shutdowns are scheduled separately. The application cannot revoke a copied code or an already redeemed rental. A redeemed rental allows 30 days to start and 48 hours to finish once started.

Controlled KINEMA verification completed on 8 September 2026: TVOD/rentals were enabled, the film page was published privately, the no-cost dummy code unlocked the film, and the redemption appeared in Reports → Rentals. Verification of the standard confirmation email's return link remains outstanding.

The launch windows are configured by `202609060001_launch_event_windows.sql`:

- Climate Week NYC: September 22 through October 7, 2026, closing at midnight New York time on October 7.
- Columbia Climate School: October 7 through October 22, 2026, closing at midnight New York time on October 22.

Closing timestamps are exclusive. The participant-facing deadline is therefore 11:59 p.m. New York time on October 6 for Climate Week and October 21 for Columbia. At each closing time the application returns to trailer access, but a code copied earlier remains redeemable until KINEMA disables it. KINEMA has confirmed that each code can be shut down separately; written confirmation that both shutdowns are scheduled is still required. Never reuse either code for another event.

The production codes are already active. KINEMA advised leaving them active rather than issuing replacement codes. They remain server-only and are not returned by Project RESET before the relevant event window. After redemption, KINEMA sends its standard confirmation email with a way back to the film; Project RESET itself does not email the promo code.

The preview WAF threshold is intentionally provisional and must be reviewed against expected audience size, venue networking and submission bursts before production.

## Security release gate

1. `npm audit --omit=dev` must report no high or critical production findings.
2. Run lint, typecheck, all unit/integration tests, the production build, and Playwright before promotion.
3. Deploy dependency patches separately from CSP or application-policy changes so either release can be diagnosed independently.
4. Verify the production CSP, clickjacking, MIME, referrer and permissions headers after deployment.
5. Test the Learning Lab, check-in submission, aggregate realtime refresh, KINEMA handoff, conversation tool, and PNG-card download with browser developer tools open. Treat CSP violations as a failed release gate.
6. Follow `docs/security-operations.md` for monitoring, containment, credential rotation, access review, and recovery.

## Consent cutover

`202609070001_final_consent_policy.sql` replaces the test-era wording in `reset_data_use_v1_us` with the Foundation-approved launch statement. This in-place correction is permitted only because all existing submissions are internal pre-launch tests. Once public participant collection starts, do not edit this row again. Publish every material future wording change under a new policy-version identifier and point only new screenings or submissions to it.

## Production data preparation

The custom domain is active. Before public collection, obtain written Foundation approval for the dataset policy. If the approved direction is an empty live dataset followed by genuine team submissions, disable writes, back up the internal-test dataset, remove both internal responses and the canonical illustrative baseline with a purpose-built guarded script, verify zero research and aggregate rows, update any remaining illustrative-baseline copy, and re-enable submissions. The existing `supabase/scripts/prepare_production.sql` is not sufficient for that decision because it deliberately preserves the seeded baseline.
