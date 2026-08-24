# Architecture

Project RESET is a screening-specific Next.js application deployed on Vercel. Browser submissions go only to `POST /api/v1/submissions`; the browser has no Supabase key or raw database access.

The route applies request and abuse controls, validates the payload and calls `api.submit_participation_v1(jsonb)` using a server-only Supabase secret key. The `SECURITY INVOKER` function atomically stores private identity, participation, consent, optional future-communications preference, substantive responses and a deferred reward-delivery record.

The source prototype is preserved under `reference/prototype/`. The active UI is the typed React implementation under `src/`.

Aggregate/realtime and Learning Lab persistence are deferred.
