# Project RESET launch audit

Audit date: 5 September 2026

Scope: participant check-in, questionnaire v3, KINEMA manual rewards, Take It to the Table, security boundaries, build quality, responsive behavior, and visual alignment with the RESET brand system.

## Current assessment

The implementation is deployed and the review experience is suitable for stakeholder testing. Questionnaire v3 is active and the server-only KINEMA production settings are configured. The two live event routes must remain disabled until their exact event windows are approved and controlled redemption tests can be performed.

## Launch blockers

### Completed: questionnaire v3 migration

`202609050001_questionnaire_v3_commitment.sql` was applied to the target Supabase project on 5 September 2026. The deployed preview screening now reports questionnaire version 3 and includes the optional private commitment question.

### 1. Live event records need approved windows

The Climate Week and Columbia screening records must not be created or activated until their exact opening timestamp, closing timestamp, and time zone are approved. The implementation already reserves these slugs:

- `climate-week-nyc-2026`
- `columbia-climate-school-2026`

### Completed: KINEMA production settings

The following Vercel production values were configured on 5 September 2026:

- `REWARD_PROVIDER=kinema_manual`
- `KINEMA_FILM_URL`
- `KINEMA_CLIMATE_WEEK_NYC_2026_CODE`
- `KINEMA_COLUMBIA_CLIMATE_SCHOOL_2026_CODE`

The provider is enabled in Production, but no launch event route exists yet. After the approved windows are added, a controlled check-in must confirm that each route returns only its own code before either QR code is distributed.

### 2. Editorial approval remains outstanding

The 60-question conversation bank and participant-facing copy remain draft content for Foundation review. The tool is correctly marked `noindex, nofollow` during this stage.

## Operational checks before launch

- Confirm the Vercel `reset-submissions` firewall rule is configured and reconsider its threshold for many attendees sharing venue Wi-Fi.
- Complete one controlled eligible check-in for each event and one premature or expired check-in.
- Confirm the private KINEMA film page remains private and that both codes work through manual checkout entry.
- Record who will monitor the KINEMA Reports page and who is authorized to email KINEMA to disable or raise a code cap.
- Remember that KINEMA gives a redeemed rental 30 days to start and 48 hours to finish. Project RESET cannot revoke it earlier.
- At the current caps, maximum platform delivery cost is $350 if all 350 redemptions are used.

## Design audit

### Corrected in this pass

- Replaced the generic cream panel and floating-card treatment with a Shweta editorial section and black ruled question grid that continues the visual language of the topic selector.
- Added a single Sindoor crimp transition, matching the event creative without introducing a second full torn band.
- Removed decorative pathway-color assignment from question cards. Film themes are not RESET pathways.
- Changed selected topic surfaces from reserved Marigold Light and unrelated pathway colors to Sindoor.
- Replaced the off-white safety panel with the approved Shweta surface and ruled treatment.
- Kept the complete five-color pathway strip as the shared footer marker.
- Slowed and staggered question entry, with motion disabled under `prefers-reduced-motion`.

### Intentional exceptions

- Learning Lab word clouds retain their varied EB Garamond typography, italics, sizes, colors, and animation.
- The Take It to the Table questions are shown in full because team feedback favored browsing over an artificial sequence.

### Remaining polish

- The remote favicon should eventually be self-hosted so browser identity does not depend on a third-party CDN request.
- The conversation stylesheet still contains unused rules from the retired timed-session prototype. They do not ship visible UI risk, but should be removed in a later maintenance pass.
- Six questions create a long mobile page. This is a deliberate consequence of browseability, but Climate Week observation should determine whether compact summaries or collapsible questions are needed.

## Interaction and accessibility audit

### Passing

- Theme selection has a labelled destination and moves focus to the updated heading.
- Carrying a question now moves focus gently to a visible completion response.
- All actions are native buttons or links with keyboard focus treatment.
- Reduced-motion users receive immediate state changes without decorative movement.
- The conversation tool asks for no typed or spoken response and makes no API or analytics call.
- Shared links contain only allowlisted theme and question IDs.
- Responsive browser tests pass at phone and desktop viewports without horizontal overflow.

### Follow-up validation

- Conduct one manual screen-reader pass on iOS VoiceOver and one on desktop before a broad public launch.
- Observe whether the automatic scroll after theme selection feels comfortable on smaller phones and slower devices.
- Confirm all final copy changes preserve descriptive button labels and heading structure.

## Privacy and security audit

### Passing

- KINEMA URL and promo codes are server-only environment values and are appended only after a committed, eligible event submission.
- Non-event, premature, and expired pathways cannot receive `rewardAccess`.
- Idempotent replay reads the originally stored pathway decision rather than recalculating it from the current event window.
- Request bodies are capped, JSON content type and origin are checked, and Vercel rate limiting is integrated.
- Supabase service credentials remain server-only.
- The optional commitment is private and absent from aggregate metric definitions, public word clouds, sharing, logs, and KINEMA.
- The public aggregate boundary excludes responses and participant identifiers.
- No tracked secret or credential file was detected in the repository scan.
- The production dependency audit reports zero known vulnerabilities.

### Residual risks

- Reusable KINEMA codes can be copied before redemption. This is an accepted campaign risk; KINEMA account binding and DRM begin only after redemption.
- Origin headers and rate limiting are defense in depth, not participant authentication. This is acceptable for a public check-in but should not be mistaken for identity verification.
- Code shutdown and cap changes depend on KINEMA support rather than an application API.

## Quality verification

- TypeScript: passed
- ESLint: passed
- Unit and migration/security tests: 39 passed
- Production build: passed
- Playwright journeys: 24 passed across mobile and desktop Chromium
- Production dependency audit: zero known vulnerabilities
- Visual QA: desktop and 390 px mobile layouts reviewed with no clipping or horizontal overflow

## Deferred by product decision

- Creating or activating launch screening records before event windows are approved
- Analytics or a 1-10 likelihood survey
- Transactional email delivery
- Automated KINEMA API integration
- Removing the unlinked share-card concepts review route
