# Deployment

## Preview

1. Apply committed migrations and `supabase/seed.sql` to the isolated RESET preview project.
2. Expose only the `api` schema in Supabase Data API settings. Do not expose `private`.
3. Set the Vercel variables listed in `.env.example`.
4. Deploy from the private GitHub repository.
5. Configure the `reset-submissions` Vercel WAF instrument for 1,000 requests/IP/60 seconds and 429 action.
6. Complete `/s/preview-screening` and verify the record graph using `docs/handover.md`.

## Production cutover

Production cutover is not part of this milestone. Before promotion: disable writes, back up, explicitly unlock and run `supabase/scripts/prepare_production.sql`, reseed approved configuration, verify zero test research rows, remove the production secret from Preview, and set Preview `SUBMISSIONS_ENABLED=false`.
