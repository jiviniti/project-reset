# Project RESET user journey

Last updated: 5 September 2026

## Entry and eligibility

| Entry | Effective pathway | Post-check-in reward |
| --- | --- | --- |
| Active approved event route | Event | Private KINEMA link and event promo code |
| Event route before opening | Non-event fallback | Film trailer |
| Event route at or after closing | Non-event fallback | Film trailer |
| Website, social, media or general campaign route | Non-event | Film trailer |

The database determines pathway eligibility from private screening configuration and database time. The browser supplies only the screening slug. A KINEMA code is appended after a committed eligible response and is never present in screening configuration.

## Check-in

1. Participants select burnout signs and may add private free text or custom tags.
2. They select RESET pathways and practices and may describe a private ritual.
3. They may write one small commitment, then provide required identity and consent plus optional demographics and communications preference.
4. One atomic request stores the response, frozen reward decision and allowlisted aggregate update.

Questionnaire version 3 adds only the optional private commitment. It is limited to 500 characters and is not aggregated.

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
