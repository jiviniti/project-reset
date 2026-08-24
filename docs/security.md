# Security

- `private` is not exposed through the Supabase Data API.
- RLS is enabled on every raw table with no browser policies.
- `PUBLIC`, `anon` and `authenticated` have no raw-table privileges.
- API functions are `SECURITY INVOKER`; execution is revoked from browser roles and granted to `service_role` only.
- Vercel holds a current `sb_secret_...` key in `SUPABASE_SECRET_KEY`. It must never use a `NEXT_PUBLIC_` name, browser bundle, URL, log, chat or documentation.
- Origin and `Sec-Fetch-Site` checks reduce cross-site misuse but are defence-in-depth, not authentication.
- The submission body is capped at 32 KiB before JSON/Zod/database validation.
- Logs contain correlation IDs and safe codes only, never request bodies or PII.
- Preview WAF is 1,000 submission requests per IP per 60 seconds. Review it against the expected screening size before production launch.

Phase 1 is not represented as HIPAA compliant.
