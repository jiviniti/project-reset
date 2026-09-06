# Project RESET user journey

Last updated: 6 September 2026

## Current product model

Project RESET is a participatory educational product rather than a single survey or content page. Its current journey moves through five connected modes:

1. The check-in creates a brief moment of personal reflection and contributes an anonymous response to the shared picture.
2. The Burnout Landscape and Community RESET Map turn individual selections into collective meaning.
3. Film or trailer access carries participants into the documentary's deeper narrative.
4. Take It to the Table helps that reflection travel into conversations with friends, families, classmates, colleagues and communities.
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

The required consent statement remains unchanged for launch. Its final wording and the destination for a future Privacy & Data Use link are pending editorial approval from the Foundation. No privacy link should be added until both are approved.

## Completion

The final page deliberately follows this hierarchy:

```text
saved confirmation + gentle celebration
  → Burnout Landscape
  → Community RESET Map
  → KINEMA film access or trailer access
  → Take It to the Table conversation questions
```

If a commitment was entered, it is echoed from local form state on the success page. It is never placed in a public visualization or URL.

Eligible event participants receive a manually entered KINEMA code and private film link. They create or sign in to a KINEMA account, complete the free rental, have 30 days to start and 48 hours to finish after starting. KINEMA controls DRM, caps, reports, fees and manual code shutdown.

The share card is no longer part of this journey. Its concept route remains available for internal review only.

## Conversation companion

Take It to the Table initially offers four featured themes and can reveal all 10. Selecting a theme displays all six questions together; deeper prompts are optional. Participants may carry one question forward and share a deep link containing only stable theme and question identifiers. No answers, identities, analytics events or conversation state are submitted.
