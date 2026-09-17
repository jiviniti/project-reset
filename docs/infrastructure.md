# Infrastructure inventory

Last reconciled with the production specification: 17 September 2026

Never store passwords, OTPs, API keys or database credentials here.

| System | Project RESET state | Ownership | Notes |
|---|---|---|---|
| GitHub | Active: `jiviniti/project-reset` | Virsa/JIVINITI | Security CI and weekly reviewed dependency updates protect the active repository. Legacy Burnout Stripes is unrelated and untouched. |
| Vercel | Active production deployment: `reset.thirddegreeburnout.com` with `project-reset-psi.vercel.app` fallback | Existing Virsa Pro team | Git-connected project. KINEMA values are configured as Production secrets. WAF instrument still requires owner-side confirmation. |
| Supabase | Active project: `Project RESET Preview` (`ujhriesmiqndptmxrgpw`) | Existing Virsa Pro organization | Despite the legacy dashboard name, this is the isolated PostgreSQL source of truth for production. Questionnaire v3 and the production screening records are defined. The owner reports that internal and illustrative data were removed; verify the live observed/seeded totals and backup status during handover rather than relying on the project name or earlier rollout notes. |
| KINEMA | Private film and manual redemption verified | Virsa/team access exists | TVOD/rentals and the private film page were verified with a no-cost dummy redemption on 8 September 2026. Values remain server-only. Production availability, code capacity/shutdowns, confirmation email, account flow, and viewing reports remain KINEMA-controlled and must be verified in its console. |
| Email | KINEMA-managed after redemption | KINEMA | Project RESET displays access immediately and does not email the promo code. KINEMA sends its standard confirmation after a successful redemption. |
| SMS | Deferred | Not selected | No Phase 1 provider or cost approved. |
