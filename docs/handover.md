# Project RESET operational handover

Status: Phase 1 production handover

Prepared for: The Virsa Foundation

Updated: 17 September 2026

This is the primary owner-facing guide to Project RESET. It explains what is live, where each responsibility sits, how to monitor and report on the system, and where to find deeper technical detail. It contains no credentials, promo codes, participant records, or other secrets.

## 1. What has been delivered

Phase 1 includes:

- a general Project RESET check-in and Learning Lab;
- two event-attributed check-in pathways;
- a temporary team rehearsal pathway that closes automatically;
- private participant submission through the application server;
- cumulative, de-identified public Learning Lab aggregates;
- server-controlled KINEMA film access for eligible event participants;
- trailer access outside an eligible film-access window;
- the Continue the Conversation reflection tool;
- event slides and QR assets delivered separately;
- deployment, security, reporting, and incident-response documentation.

The system intentionally does not include a participant email system, an administrative reporting dashboard, automatic KINEMA integration, or conversation analytics. These remain possible Phase 2 work.

## 2. Production links and pathway behavior

| Experience | Production link | Current behavior |
| --- | --- | --- |
| General Learning Lab | <https://reset.thirddegreeburnout.com/> | Check-in, public community picture, and trailer access |
| Climate Week NYC | <https://reset.thirddegreeburnout.com/s/climate-week-nyc-2026> | Film access from 17 September through 6 October 2026 |
| Columbia Climate School | <https://reset.thirddegreeburnout.com/s/columbia-climate-school-2026> | Film access from 7 October through 21 October 2026 |
| Continue the Conversation | <https://reset.thirddegreeburnout.com/start-a-conversation> | Local reflection tool that opens independently of a check-in |
| Privacy update | <https://reset.thirddegreeburnout.com/privacy> | Interim beta and de-identification statement pending final legal copy |
| Team rehearsal | <https://reset.thirddegreeburnout.com/s/preview-event> | Temporary, unindexed pathway; available only while its server-side code and database window remain active |

Event closing timestamps are exclusive and use New York time. Climate Week stops issuing film access at 12:00 a.m. on 7 October. Columbia stops at 12:00 a.m. on 22 October. After a window closes, the same route continues to accept check-ins but returns to trailer access.

The event URL alone does not expose a promo code. Film access is returned only after an eligible check-in has been committed successfully.

For the complete journey, see [user-journey.md](user-journey.md).

## 3. Participant journey

Every participant follows the same basic sequence:

1. Open the general or event-specific route.
2. Review the pathway benefit and interim privacy notice where applicable.
3. Complete the reset check-in.
4. Provide the required identity and consent fields.
5. Optionally provide demographics and communications consent.
6. Submit the response through the protected server route.
7. View the check-in confirmation, Burnout Landscape, and Community RESET Map.
8. Receive film access when the event window is active, or trailer access otherwise.
9. Open KINEMA and Continue the Conversation in new tabs so the completed RESET page remains available.

Names, email addresses, demographics, free-text answers, custom tags, consent records, and record identifiers are never displayed in the public Learning Lab.

Repeated check-ins are permitted. One person may therefore create more than one participation record, and a participation count must not be described as a unique-person count.

## 4. System architecture and ownership

The production system is divided across four platforms:

| Platform | Responsibility | Primary owner action |
| --- | --- | --- |
| GitHub | Source code, migrations, documentation, and change history | Review changes and preserve the protected release workflow |
| Vercel | Next.js application, production domain, server runtime, logs, firewall, and environment variables | Monitor deployments and runtime errors; manage server-only configuration |
| Supabase | Private submissions, consent, screening configuration, aggregate state, and reporting queries | Run approved read-only reports and control reviewed database changes |
| KINEMA | Film account, rental checkout, promo-code acceptance, DRM, viewing window, email, and redemption reports | Monitor redemptions and manage code availability with KINEMA |

Representative request flow:

```text
Participant browser
  -> reset.thirddegreeburnout.com
  -> Next.js server validates the request
  -> Supabase records the private participation and updates safe aggregates
  -> server appends KINEMA access only for an eligible committed event response
  -> browser displays the completion journey and public aggregate picture
```

The browser never receives a Supabase secret, production promo code before eligibility, or direct permission to read private records.

See [architecture.md](architecture.md) and [infrastructure.md](infrastructure.md) for the complete boundary map.

## 5. Data model and privacy boundary

### Private source data

Private records include:

- participant name and email;
- optional city, age band, and occupation;
- selected responses and free-text answers;
- selected and participant-created tags;
- consent version and acceptance timestamp;
- optional communications preference;
- screening, pathway, event-window, and reward outcome;
- idempotency and operational metadata.

These records are retained in Supabase's private schema and are not browser-readable.

### Public aggregate data

The public interface receives only approved cumulative values such as:

- total observed check-ins;
- allowlisted burnout and RESET practice counts;
- selected aggregate percentages;
- aggregate revision and snapshot metadata.

The public interface is aggregated and de-identified. The private source records are not anonymous because the application stores required identity fields.

### Consent and policy versions

Consent language is versioned. Do not overwrite a policy version that participants have already accepted. If counsel approves materially different consent language, create a new version and review whether any collection, retention, deletion, or participant-rights behavior must also change.

The current `/privacy` page is an interim beta notice, not the final privacy policy. Static approved policy copy can replace it directly. Functional legal requirements require technical review before implementation.

See [data-model.md](data-model.md), [security.md](security.md), and [security-operations.md](security-operations.md).

## 6. Learning Lab and public aggregates

Every successful submission updates an approved observed aggregate within the same database transaction as the private participation record. This prevents the public picture from drifting away from the accepted source data during normal operation.

The production interface renders observed values only. Compatibility fields may remain in the API response but are not the public display source.

Participant-created terms are not automatically promoted into public word clouds. New terms require an approved curation or allowlisting decision.

The public aggregate response is intentionally PII-free. It must never be expanded casually to include participant-level, cohort-level, demographic, or small-cell detail.

See [architecture.md](architecture.md), [data-model.md](data-model.md), and [database-reporting.md](database-reporting.md).

## 7. Reporting with Supabase

Phase 1 uses reviewed, read-only SQL rather than an additional reporting dashboard. The complete query library is in [database-reporting.md](database-reporting.md).

### Safe reporting workflow

1. Sign in to the correct Supabase project.
2. Open SQL Editor.
3. Start a new query rather than editing an old operational query in place.
4. Use an approved `SELECT` query from the reporting guide.
5. Confirm the requested event slug, time zone, and definition of a completed check-in.
6. Run the query.
7. Review the result for private information before downloading or sharing it.
8. Export only when there is an approved purpose and recipient.

Do not run AI-generated `INSERT`, `UPDATE`, `DELETE`, `ALTER`, `DROP`, `TRUNCATE`, policy, permission, or schema statements. AI can help draft a read-only report, but a human must verify its tables, joins, filters, privacy risk, and interpretation.

### Core reporting definitions

- A completed check-in is a participation with an associated response.
- A participation count is not a unique-person count.
- Film access means the application recorded an eligible `active_event / film_access` outcome.
- Film access does not prove that KINEMA accepted the code, that the participant redeemed it, or that the film was watched.
- KINEMA Reports is the source of truth for redemption and viewing activity.
- New York event reporting should use `America/New_York` for local dates and times.

### Using the documentation with an AI assistant

Provide the AI assistant with this guide, [data-model.md](data-model.md), and [database-reporting.md](database-reporting.md). Instruct it to:

- generate one read-only `SELECT` query;
- use only documented tables and columns;
- define the reporting unit and date boundary;
- use `America/New_York` where event-local time matters;
- suppress or avoid participant-level and small-cell output;
- state assumptions and privacy risks;
- never invent a relationship or field;
- never produce a mutating query unless a separately authorized technical workflow requires it.

## 8. Deployment and rollback

The normal application release path is:

1. Create a focused branch.
2. Make and review the change.
3. Run the relevant checks.
4. Open a pull request.
5. Review the GitHub checks and Vercel Preview.
6. Merge through the protected production branch.
7. Verify the production routes, domain, logs, and key participant journey.

Database migrations are separate from application deployments. A Vercel rollback restores application code but does not undo a Supabase migration. Database changes require a specifically reviewed recovery plan or verified backup restoration.

If submissions must be stopped without taking down the informational application, set the server-only `SUBMISSIONS_ENABLED` value to false and redeploy. Re-enable it only after the issue is understood and a complete check-in path has been verified.

Do not expose or copy production secret values into documents, tickets, chat, screenshots, or client-side environment variables.

See [deployment.md](deployment.md), [infrastructure.md](infrastructure.md), and [security-operations.md](security-operations.md).

## 9. KINEMA boundary

Project RESET determines whether a completed check-in is eligible for film access and displays the server-held event code and private film link. KINEMA controls everything after that boundary, including:

- account creation and sign-in;
- promo-code acceptance or rejection;
- checkout and rental ownership;
- CAPTCHA behavior;
- DRM and playback;
- confirmation email;
- the 30-day period to begin watching;
- the 48-hour period to finish after starting;
- redemption caps, shutdowns, and reports.

The application cannot revoke a code that has already been copied or a rental that has already been redeemed. If a code is exposed or abused, contact KINEMA to disable it and follow the incident process.

Do not share production promo codes in handover documents or general team messages.

## 10. Event-day monitoring and incident response

### Before participants arrive

- Verify the exact production URL and printed QR code.
- Complete one controlled check-in without publishing the promo code.
- Confirm that submissions are enabled.
- Confirm the correct film or trailer outcome for the route.
- Confirm the aggregate endpoint and Continue the Conversation route load.
- Review Vercel and Supabase operational status.
- Confirm who is monitoring KINEMA Reports and who may contact KINEMA.

### During the event

- Watch Vercel logs for repeated errors or rate limits.
- Check aggregate volume for plausible growth.
- Compare application film-access outcomes with KINEMA redemption activity.
- Do not tighten firewall rules or make speculative production changes during an active event unless responding to a verified incident.

### First-response table

| Symptom | First action | Escalation |
| --- | --- | --- |
| Submissions fail or spike unexpectedly | Disable submissions and inspect Vercel and Supabase | Application operator and Supabase owner |
| Application release is faulty | Restore the previous verified Vercel deployment | Vercel operator |
| Database state may be damaged | Stop writes and review a recovery plan | Supabase owner and retained technical support |
| Promo code is exposed | Ask KINEMA to disable it | Foundation, Picture Motion, and KINEMA |
| High 429 rate at venue | Review the expected attendance and firewall rule | Vercel operator |
| Learning Lab appears stale | Check submission success, aggregate revision, and reconciliation | Application operator |

Never delete participant records during an incident. Preserve logs and timestamps and record the incident, affected route, containment action, owner, and resolution.

## 11. Access and ownership checklist

### GitHub and Vercel

- [ ] The Foundation owner can access the GitHub repository.
- [ ] The Foundation owner can access Vercel deployments and logs.
- [ ] The production domain points to the intended production deployment.
- [ ] Branch protection and required checks are understood.
- [ ] Firewall configuration and the emergency submission switch are understood.
- [ ] Server-only production variables remain secret and present where required.

### Supabase

- [ ] The Foundation owner can access the project and SQL Editor.
- [ ] Production screening configuration has been reviewed.
- [ ] The read-only reporting workflow is understood.
- [ ] Aggregate reconciliation checks are understood.
- [ ] Backup and restoration responsibilities have an assigned owner.

### KINEMA

- [ ] The correct owner can access KINEMA Reports and configuration.
- [ ] Film availability covers the approved event windows.
- [ ] Promo-code caps and shutdown times are confirmed.
- [ ] The escalation path for code or playback issues is known.

### Documentation

- [ ] This handover guide has been received.
- [ ] The reporting guide and data model have been received.
- [ ] The deployment, security, and incident runbooks have been received.
- [ ] The final approved privacy text has an owner and follow-up date.
- [ ] Any retained post-Phase 1 support arrangement is documented separately.

## 12. Remaining and deferred work

### External or pending

- final counsel-approved privacy-policy text;
- any functional legal requirements created by that policy;
- KINEMA availability, caps, shutdowns, email, account, and viewing behavior;
- event operations and moderation owned by the Foundation and its partners.

### Potential Phase 2 work

- participant email or SMS delivery;
- authenticated reporting dashboard;
- approved participant-level research workflow;
- retention, deletion, access, correction, or portability workflows;
- deeper KINEMA integration;
- conversation analytics;
- richer cohort reporting with an approved privacy model;
- participant or event enforcement beyond the current operational controls.

These items are not part of the completed Phase 1 application unless separately scoped and approved.

## 13. Quick-answer reference

| Question | Answer | Deeper reference |
| --- | --- | --- |
| Where are completed check-ins stored? | In private Supabase records written through the application server | [data-model.md](data-model.md) |
| Are results anonymous? | No. Public results are aggregated and de-identified; private source records retain required identity fields | [security.md](security.md) |
| What opens a film-access pathway? | The screening record, database time, and server-held code configuration | [user-journey.md](user-journey.md) |
| How are completed check-ins counted? | Participation records with an associated response | [database-reporting.md](database-reporting.md) |
| How is redemption or viewing confirmed? | KINEMA Reports | Section 9 of this guide |
| How is a faulty release reversed? | Restore the prior verified Vercel deployment | [deployment.md](deployment.md) |
| How are writes stopped in an incident? | Disable submissions with the server-only environment switch and redeploy | [security-operations.md](security-operations.md) |
| Can Continue the Conversation save answers? | No. Saved prompts remain local to the participant's device | [conversation-tool.md](conversation-tool.md) |

## 14. Documentation index

| Document | Purpose |
| --- | --- |
| [architecture.md](architecture.md) | System components, trust boundaries, and request flow |
| [brand-guide.md](brand-guide.md) | Brand tokens and interface usage |
| [conversation-tool.md](conversation-tool.md) | Continue the Conversation behavior and privacy boundary |
| [data-model.md](data-model.md) | Current entities, relationships, classifications, and lifecycle |
| [database-reporting.md](database-reporting.md) | Reporting vocabulary, query library, and AI query-generation guardrails |
| [deployment.md](deployment.md) | Release, event-window, environment, verification, and rollback procedures |
| [infrastructure.md](infrastructure.md) | Platform inventory and current ownership notes |
| [security.md](security.md) | Implemented application security controls |
| [security-operations.md](security-operations.md) | Monitoring, incident response, and operational responsibilities |
| [user-journey.md](user-journey.md) | Participant pathways and completion sequence |

## 15. Facts to verify whenever ownership or configuration changes

- the exact production deployment and commit;
- production environment-variable presence without exposing values;
- Vercel firewall configuration and expected audience threshold;
- current Supabase screening timestamps and status;
- Supabase backup and restoration ownership;
- KINEMA availability, capacity, shutdown, email, and viewing settings;
- final privacy-policy wording and any resulting functional requirements.

Operational facts can change independently of the repository. Verify them in the relevant platform before relying on an older screenshot or document.
