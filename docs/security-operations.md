# Security operations

Last reconciled with source: 17 September 2026

This runbook covers Project RESET launch operations. Never paste passwords, OTPs, API keys, database credentials, or KINEMA promo codes into this file, tickets, or chat.

## Incident ownership

| Decision or action | Primary owner | Backup / escalation |
|---|---|---|
| Disable or re-enable application submissions | Designated Virsa/Vercel application operator, through the server-only `SUBMISSIONS_ENABLED` variable | Foundation owner / retained technical support |
| Roll back a Vercel deployment | Designated Virsa/Vercel application operator | Foundation owner / retained technical support |
| Rotate the Supabase secret key and update Vercel | Virsa Supabase owner, coordinated with the application operator | Supabase support |
| Approve deletion, restoration, or export of participant data | Nivi / The Virsa Foundation | Legal counsel |
| Disable, extend, or raise the cap of a KINEMA promo code | KINEMA support after Project RESET approval | Brian / Picture Motion campaigns liaison |
| Participant-facing incident communication | Nivi / The Virsa Foundation | Brian / Picture Motion and retained technical support |

## Launch monitoring

1. Before admitting participants, verify the production route, one trailer route, one active-event route, and `GET /api/v1/aggregates`.
2. Confirm the Vercel `reset-submissions` firewall instrument uses a 1,000 requests/IP/60 seconds threshold with a 429 action. This accommodates a venue where many devices share one public IP.
3. During each live activation, check Vercel logs and KINEMA Reports at the start, midpoint, and end. Investigate repeated 5xx responses, a sustained rise in 429 responses, unexpected aggregate growth, or redemptions above attendance.
4. Do not tighten the shared-IP threshold during a live activation unless measured traffic shows abuse and legitimate attendees retain access.
5. Record the incident time, affected route, correlation IDs, mitigation, owner, and resolution. Do not copy participant payloads into the incident record.

## Containment and recovery

1. For a submission or database incident, set `SUBMISSIONS_ENABLED=false` and redeploy. The Learning Lab remains readable while writes fail closed.
2. For a bad application release, restore the last verified Vercel deployment. Do not roll back to a dependency version with a known high or critical advisory.
3. For suspected Supabase credential exposure, disable submissions, rotate the secret, replace the Vercel value in every affected environment, redeploy, and review database logs before re-enabling writes.
4. For promo-code exposure, ask KINEMA to disable the affected code. The application cannot revoke a copied code or an already redeemed rental.
5. Validate the full check-in and aggregate path after recovery, then document closure without participant PII.

## Access and data reviews

- Require MFA for every GitHub, Vercel, Supabase, GoDaddy, and KINEMA administrator.
- Review membership before launch and after any team change. Remove access that is no longer required.
- A `jiviniti` GitHub administrator must protect `main` and require the Security CI check before merging. The current deployment operator has push access but cannot configure repository protection.
- Keep Supabase secret keys in server-only Vercel variables. Browser code receives only the publishable key used for the PII-free aggregate revision subscription.
- Confirm Supabase backup availability and perform a documented restoration rehearsal before deleting pre-launch data.
- Participant retention and deletion periods remain pending Legal/Foundation approval. Until approved, do not promise an unimplemented automated deletion schedule.

## KINEMA production configuration

- The application supports the two server-held production codes plus the temporary server-only `KINEMA_TEST_CODE` rehearsal code documented in `.env.example`. The rehearsal code is restricted to `preview-event`, and the route fails closed when the variable is absent or after `2026-09-22 04:00:00Z`.
- Never configure `E2E_USE_TEST_FIXTURE` in Vercel.
- Verify `preview-screening` and `preview-expired-event` return 404 after every production deployment. Verify `preview-event` returns 404 after its cutoff or as soon as the rehearsal variable is removed and the screening is closed.
- A production code is returned only after a completed, database-eligible submission on its exact allowlisted event slug.
