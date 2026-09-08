# Infrastructure inventory

Never store passwords, OTPs, API keys or database credentials here.

| System | Project RESET state | Ownership | Notes |
|---|---|---|---|
| GitHub | Active: `jiviniti/project-reset` | Virsa/JIVINITI | Private source repository. Legacy Burnout Stripes repository is unrelated and untouched. |
| Vercel | Active production deployment: `reset.thirddegreeburnout.com` with `project-reset-psi.vercel.app` fallback | Existing Virsa Pro team | Git-connected project. KINEMA values are configured as Production secrets. WAF instrument still requires owner-side confirmation. |
| Supabase | Active: `Project RESET Preview` (`ujhriesmiqndptmxrgpw`) | Existing Virsa Pro organization | Isolated from legacy projects. PostgreSQL source of truth. Questionnaire v3 and both event-window records are applied. Internal test responses and the illustrative baseline remain pending a documented Foundation cleanup decision. |
| KINEMA | Private film and manual redemption verified | Virsa/team access exists | TVOD/rentals and the private film page are active. A no-cost dummy redemption reached Reports on 8 September 2026. Values remain server-only; production availability, engagement-link configuration, confirmation-email return path, and written shutdown confirmation require final verification before QR distribution. |
| Email | KINEMA-managed after redemption | KINEMA | Project RESET displays access immediately and does not email the promo code. KINEMA sends its standard confirmation after a successful redemption. |
| SMS | Deferred | Not selected | No Phase 1 provider or cost approved. |
