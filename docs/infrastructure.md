# Infrastructure inventory

Never store passwords, OTPs, API keys or database credentials here.

| System | Project RESET state | Ownership | Notes |
|---|---|---|---|
| GitHub | Active: `jiviniti/project-reset` | Virsa/JIVINITI | Private source repository. Legacy Burnout Stripes repository is unrelated and untouched. |
| Vercel | Active production deployment: `project-reset-psi.vercel.app` | Existing Virsa Pro team | Git-connected project. KINEMA values are configured as Production secrets. Custom domain deferred. WAF instrument still requires owner-side confirmation. |
| Supabase | Active: `Project RESET Preview` (`ujhriesmiqndptmxrgpw`) | Existing Virsa Pro organization | Isolated from legacy projects. PostgreSQL source of truth. Questionnaire v3 is applied. Two non-real milestone submissions exist and must be removed before any production promotion. |
| KINEMA | Integration active; event routes pending | Virsa/team access exists | Manual checkout flow uses a private film URL and the two capped event promo codes. Values remain server-only. Exact event windows and controlled redemption tests are still required before QR distribution. |
| Email | Deferred | Not selected | KINEMA access is displayed immediately after an eligible check-in; no reward email is sent. |
| SMS | Deferred | Not selected | No Phase 1 provider or cost approved. |
