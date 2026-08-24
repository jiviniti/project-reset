# Infrastructure inventory

Never store passwords, OTPs, API keys or database credentials here.

| System | Project RESET state | Ownership | Notes |
|---|---|---|---|
| GitHub | Active: `jiviniti/project-reset` | Virsa/JIVINITI | Private source repository. Legacy Burnout Stripes repository is unrelated and untouched. |
| Vercel | Active preview: `project-reset-psi.vercel.app` | Existing Virsa Pro team | Git-connected project. Custom domain deferred. WAF instrument still requires owner-side confirmation. |
| Supabase | Active preview: `Project RESET Preview` (`ujhriesmiqndptmxrgpw`) | Existing Virsa Pro organization | Isolated from legacy projects. PostgreSQL source of truth. Two non-real milestone submissions exist and must be removed before any production promotion. |
| KINEMA | Deferred | Virsa/team access exists | Workflow unknown; no provider code implemented. |
| Email | Deferred | Not selected | Reward row is recorded but no message is sent. |
| SMS | Deferred | Not selected | No Phase 1 provider or cost approved. |
