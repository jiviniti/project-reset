# Project RESET user journey

Last updated: 7 September 2026

## Current product model

Project RESET is a participatory educational product rather than a single survey or content page. Its current journey moves through five connected modes:

1. The check-in creates a brief moment of personal reflection and contributes an anonymous response to the shared picture.
2. The Burnout Landscape and Community RESET Map turn individual selections into collective meaning.
3. Film or trailer access carries participants into the documentary's deeper narrative.
4. Continue the Conversation helps that reflection travel into conversations with friends, families, classmates, colleagues and communities.
5. Event screenings create identifiable cohorts, while repeated use can support cumulative and longitudinal learning without exposing participant identities in public results.

This sequence is the current launch model. It is intentionally participatory: reflection, visualization, story and conversation reinforce one another.

## Entry and eligibility

| Entry | Effective pathway | Post-check-in reward |
| --- | --- | --- |
| Active approved event route | Event | Private KINEMA link and event promo code |
| Event route before opening | Non-event fallback | Film trailer |
| Event route at or after closing | Non-event fallback | Film trailer |
| Website, social, media or general campaign route | Non-event | Film trailer |

The database determines pathway eligibility from private screening configuration and database time. The browser supplies only the screening slug. A KINEMA code is appended after a committed eligible response and is never present in screening configuration.

## Check-in

1. Participants select burnout signs and may reveal a private custom-tag field when the listed choices do not fit.
2. They select RESET pathways and practices and may describe a private ritual.
3. They may write one small commitment, then provide required identity and consent plus optional demographics and communications preference.
4. One atomic request stores the response, frozen reward decision and allowlisted aggregate update.

Questionnaire version 3 adds only the optional private commitment. It is limited to 500 characters and is not aggregated.

The earlier optional `burnout_note` answer remains accepted by the server for historical responses and forms that were already loaded, but the current questionnaire does not display or submit that field.

The Foundation-approved launch consent is: “I understand that my responses will be securely stored and may be used for Project RESET research. Anything shared publicly will be de-identified or combined with other responses.” Because every existing record is an internal pre-launch test, this wording replaces the test-era text under `reset_data_use_v1_us`. After real participant collection begins, every material wording change must use a new policy version so prior consent provenance remains exact. The destination for a future Privacy & Data Use link remains pending Legal-approved content.

## Completion

The final page deliberately follows this hierarchy:

```text
saved confirmation + gentle celebration
  → Burnout Landscape
  → Community RESET Map
  → KINEMA film access or trailer access
  → Continue the Conversation questions
```

If a commitment was entered, it is echoed from local form state on the success page. It is never placed in a public visualization or URL.

Eligible event participants receive a manually entered KINEMA code and a direct link to the private film page. A private KINEMA page does not need to be listed in the public catalogue. Participants copy or screenshot the code, open the direct page, create or sign in to KINEMA, and enter the code at checkout for free access. The success page states the route-specific redemption deadline. Project RESET does not email the code; after redemption, KINEMA sends a confirmation with a way back to the film. Participants then have 30 days to start and 48 hours to finish after starting. KINEMA controls DRM, caps, reports, fees and code shutdown.

The share card is no longer part of this journey. Its concept route remains available for internal review only.

## Conversation companion

Continue the Conversation initially offers four featured themes and can reveal all 10. Selecting a theme displays all six questions together; deeper prompts are optional. Participants may save multiple questions across themes on their current browser and device, then copy a plain-text list or save a branded PNG question card. Existing theme and question deep links remain compatible. No answers, identities, analytics events or saved selections are submitted.
