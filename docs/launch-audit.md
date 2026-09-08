# Project RESET launch audit

Audit date: 8 September 2026

Scope: participant check-in, questionnaire v3, KINEMA manual rewards, Continue the Conversation, security boundaries, build quality, responsive behavior, and visual alignment with the RESET brand system.

## Current assessment

The implementation is suitable for final launch testing. Questionnaire v3 is active, the final participant copy is locked, the server-only KINEMA production settings are configured, and the two approved event windows are defined in a migration. The private KINEMA page and no-cost dummy redemption were verified on 8 September 2026. Final KINEMA scheduling and email-return-path checks remain required before QR distribution.

## Launch blockers

### Completed: questionnaire v3 migration

`202609050001_questionnaire_v3_commitment.sql` was applied to the target Supabase project on 5 September 2026. The deployed preview screening now reports questionnaire version 3 and includes the optional private commitment question.

### Completed: live event records and approved windows

The Climate Week and Columbia screening records use the approved midnight New York boundaries. The implementation reserves these slugs:

- `climate-week-nyc-2026`
- `columbia-climate-school-2026`

### Completed: KINEMA production settings

The following Vercel production values were configured on 5 September 2026:

- `REWARD_PROVIDER=kinema_manual`
- `KINEMA_FILM_URL`
- `KINEMA_CLIMATE_WEEK_NYC_2026_CODE`
- `KINEMA_COLUMBIA_CLIMATE_SCHOOL_2026_CODE`

The provider is enabled in Production and both launch routes exist. A controlled check-in must still confirm that each route returns only its own code before either QR code is distributed.

### Completed: participant copy approval

The Foundation has approved and locked the check-in and conversation copy, except for any future KINEMA clarification required after a controlled redemption test. The visible “Draft for Foundation review” label has been removed. The tool remains `noindex, nofollow` until the production-domain launch. Multiple saved questions remain local to the participant's browser and can be copied as text or saved as a branded PNG card.

### Completed: launch consent wording

The final acknowledgement is applied to `reset_data_use_v1_us` by `202609070001_final_consent_policy.sql`. The in-place correction is safe because the earlier records are internal pre-launch tests rather than public participant submissions. Any material wording change after launch requires a new policy version.

## Operational checks before launch

- Confirm the Vercel `reset-submissions` firewall rule is configured and reconsider its threshold for many attendees sharing venue Wi-Fi.
- Complete one controlled eligible check-in for each event and one premature or expired check-in.
- **Completed 8 September:** publish the KINEMA page privately, confirm the direct link opens it, and complete the no-cost dummy-code checkout with a participant test account. The free redemption appeared under Reports → Rentals.
- Confirm KINEMA's post-redemption email provides a usable return path and that the redemption appears under Reports → Rentals.
- Obtain written confirmation that KINEMA has scheduled the Climate Week shutdown for October 7 at 12:00 a.m. New York time and the Columbia shutdown for October 22 at 12:00 a.m.
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
- Continue the Conversation questions are shown in full because team feedback favored browsing over an artificial sequence.

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
- Code shutdown and cap changes depend on KINEMA support rather than an application API. KINEMA has said separate scheduled shutdowns are available, but written scheduling confirmation is pending.

## Quality verification

- TypeScript: passed
- ESLint: passed
- Unit and migration/security tests: 44 passed
- Production build: passed
- Playwright journeys: 28 passed across mobile and desktop Chromium
- Production dependency audit: zero known vulnerabilities
- Visual QA: desktop and 390 px mobile layouts reviewed with no clipping or horizontal overflow

## Deferred by product decision

- Creating or activating launch screening records before event windows are approved
- Analytics or a 1-10 likelihood survey
- Transactional email delivery
- Automated KINEMA API integration
- Removing the unlinked share-card concepts review route
