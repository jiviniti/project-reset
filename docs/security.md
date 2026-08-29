# Security

Last verified: 29 August 2026

## Database boundary

- `private` and `aggregate` are excluded from the Supabase Data API.
- RLS is enabled on every raw and aggregate table with no browser policies.
- `PUBLIC`, `anon` and `authenticated` have no privileges on raw or aggregate-count tables.
- API and aggregate functions are `SECURITY INVOKER`.
- Function execution is explicitly revoked from browser roles and granted only to `service_role`.
- The current `sb_secret_...` credential is stored only in Vercel/server environment variables.
- No privileged value uses a `NEXT_PUBLIC_` name.

## Public snapshot

`GET /api/v1/aggregates` is a server-mediated, cumulative allowlist. The database function reads only aggregate tables, and the route validates the outgoing JSON with a strict Zod schema.

The public response excludes participant names/emails, participant/participation/response IDs, mobile numbers, free text, screening metadata, demographics, consent, communication preferences and raw records.

Participant-created tags remain private text until a future moderation and allowlisting process is approved.

The downloadable share card is generated locally in the browser. It includes only first name, selected approved pathways and up to three selected approved practices. Email, demographics, burnout answers, free text and participant-created tags are excluded.

## Realtime boundary

The only browser-readable database resource is:

```text
public.aggregate_revision
- revision
- updated_at
```

- `anon` and `authenticated` receive SELECT only.
- They receive no INSERT, UPDATE or DELETE privilege.
- Only this resource is added to `supabase_realtime`.
- No `private` or `aggregate` table may be present in the publication.
- The browser uses a current `sb_publishable_...` key only for this PII-free subscription.
- Realtime messages cause a debounced safe-API refetch and never supply counts directly.
- A singleton unique index and explicit `WHERE` clause protect revision mutation; browser roles still retain SELECT only.

Origin and `Sec-Fetch-Site` checks remain defence-in-depth rather than authentication.

## Reward eligibility boundary

- A screening URL is a low-stakes bearer entry point, not proof of identity.
- The browser supplies only the screening slug; it cannot supply pathway, reward type or access expiry.
- A `SECURITY INVOKER` database function resolves eligibility from private screening configuration and database time.
- Event eligibility uses a half-open interval: opening is inclusive and closing is exclusive.
- Expired or not-yet-open event links fall back to trailer access while preserving screening attribution.
- The committed decision is returned to the UI and stored privately. It is absent from the public aggregate API and realtime resource.
- Share-card links use the canonical non-event campaign URL, never the event QR URL.
- KINEMA credentials and provider calls have not been introduced.

## Submission protection

- Request body capped at 32 KiB before JSON parsing.
- JSON content-type and strict Zod validation.
- Active-screening and database-level question/option validation.
- Screening-scoped idempotency.
- Transactional aggregate update after a valid new response only.
- PII-free application logs with correlation ID and safe code.
- Preview WAF: 1,000 submission requests per IP per 60 seconds.

The WAF threshold must be reviewed against venue networking, expected screening size and concentrated submission bursts before production.

## Compliance statement

Phase 1 is not represented as HIPAA compliant. Provider eligibility or an upgrade path does not by itself establish compliance; legal applicability, BAAs, configuration, policy, access control and operating practice require a separate review.
