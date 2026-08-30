# Project RESET participant journey

Last updated: 30 August 2026

Status: post-submission composition approved and implemented on 30 August 2026.

## Purpose

This document maps how participants currently move through Project RESET, where the experience loses continuity, and the recommended post-submission journey. It is the durable product reference for future interface decisions; architecture and privacy rules remain documented separately.

## Participant goals

A participant should be able to:

1. understand what Project RESET is and why the check-in matters;
2. contribute without encountering identity fields before reflection;
3. receive the reward appropriate to their entry pathway;
4. see how their response contributes to the larger community picture;
5. create, download or share their personalized card without losing it while exploring the Learning Lab.

## Entry contexts

All entry contexts use the same questionnaire and aggregate visualization. The configured screening and database-time event window determine the reward; the browser cannot choose it.

| Entry context | Effective pathway | Reward | Continued experience |
| --- | --- | --- | --- |
| Active event QR/link | Event | Time-limited film access intent | Visualization + share card |
| Event QR/link before opening | Non-event fallback, attributed to the event | Trailer | Visualization + share card |
| Event QR/link after expiry | Non-event fallback, attributed to the event | Trailer | Visualization + share card |
| Website, social, media, influencer or share-card link | Non-event | Trailer | Visualization + share card |

The share card must always link to the canonical non-event entry point. It must never reproduce or expose an event-specific URL.

## Previous journey — verified before the 30 August fix

```text
Screening/campaign link
  └─ Hero
      ├─ Explore the Learning Lab
      │   └─ Standalone Lab
      │       └─ Take the Check-In → questionnaire
      └─ Contribute your RESET
          └─ Step 1: burnout landscape
              └─ Step 2: RESET map
                  └─ Step 3: identity, optional demographics and consent
                      └─ atomic submission
                          └─ Step 4: persisted thank-you
                              ├─ pathway-appropriate reward status
                              ├─ Enter the Learning Lab → standalone Lab
                              └─ personalized share card + download/share
```

The share-card canvas is derived from the completed form state in `ResetExperience`. It contains first name/initials, approved pathways and up to three approved practices. It excludes email, demographics, burnout answers, free text and custom tags.

## Continuity problem — verified and resolved

On the persisted thank-you screen, the participant can see both the “Enter the Learning Lab” action and their share card. Selecting the Lab action changes the React view from `success` to `lab`.

Consequences:

- the Lab offers no route back to “My RESET” or the share card;
- browser Back does not restore the success view because the view change does not create a route/history entry;
- the completed form remains in memory initially, but it is inaccessible from the Lab;
- selecting “Take the Check-In” or “Contribute your RESET” inside the Lab calls `resetFlow`, which clears the completed form, submission result and share-card state;
- refreshing the page also loses the session-only share-card state.

This breaks the intended narrative: the Lab should make the participant’s card feel more meaningful, but the current navigation makes the two outcomes compete with each other.

## Design options

### Option A — One continuous post-submission story

After the committed thank-you and reward status, place the Learning Lab directly in the final page and place the personalized share card after it.

Suggested sequence:

```text
Thank you + reward status
  → “See how your RESET fits the bigger picture”
  → note: “Your personal card is waiting at the end”
  → optional “Skip to my card” anchor
  → embedded Learning Lab results
  → transition: “This is the community picture. Here is your RESET.”
  → personalized share card
  → download/share actions
```

Advantages:

- creates the strongest emotional and narrative connection between contribution, collective result and sharing;
- the participant never leaves the page that owns the card state;
- anchors work without introducing a new route or persistence model;
- the card remains the natural conclusion rather than a competing action.

Risks:

- creates a long mobile page;
- forcing every sharing-focused participant through the Lab could be frustrating;
- the embedded Lab must suppress its pre-submission “Take the Check-In” actions and avoid duplicate navigation/footer content;
- loading/error behavior for aggregates becomes part of the final page.

Mitigation: provide a prominent “Skip to my card” link and a small sticky “My card ↓” action while scrolling through the Lab.

### Option B — Keep the Lab separate, add “Back to my RESET”

Retain the current views but give post-submission Lab visitors a persistent action that returns to the success/card view without clearing state.

Advantages:

- smallest and lowest-risk implementation;
- preserves the existing Lab composition;
- does not lengthen the success page.

Risks:

- the collective picture and personal card remain conceptually separated;
- browser refresh still loses the card;
- requires the Lab to distinguish pre-submission and post-submission visitors.

### Option C — Persistent “My RESET” drawer or modal

Show a persistent “My RESET” action in the Lab that opens the card in a bottom sheet/modal.

Advantages:

- card is accessible from anywhere in the Lab;
- participant does not lose their reading position.

Risks:

- more interaction and accessibility complexity;
- modal canvas/download/share behavior needs careful mobile testing;
- still depends on session memory unless separate persistence is introduced.

### Option D — Separate result route with recoverable state

Create a dedicated result route and make the Lab a separate route so browser navigation works normally. Recovering a result after refresh would require either browser storage or a private server-side receipt model.

Advantages:

- robust browser history and clearer URLs;
- creates a path to later result recovery.

Risks:

- materially larger architecture and privacy decision;
- first name is PII even if stored only in session storage;
- a server-side receipt requires authorization, retention and enumeration protections;
- unnecessary for the immediate prototype-stage continuity problem.

### Option E — Ask users to download first

Keep the views separate but prompt the participant to download the card before entering the Lab.

This is not recommended. It protects the implementation rather than improving the journey, interrupts the emotional payoff, and does not help users who want to share only after seeing the larger context.

## Implemented decision

Project RESET adopts **Option A**.

The proposed final journey should be one continuous story:

1. confirm that the check-in was saved;
2. present the appropriate film/trailer reward status;
3. tell the participant their card is ready and available at the end;
4. offer “Skip to my card” so the Lab is never a forced detour;
5. render a post-submission version of the Learning Lab inline;
6. end with the personalized card and download/share actions.

The existing standalone Lab remains the pre-submission experience reached from the hero. The aggregate component now supports two explicit modes:

- `standalone`: show “Take the Check-In” navigation and the full campaign ending;
- `post_submission`: suppress all reset/restart controls, omit duplicate framing as needed, and provide an anchor to the participant’s card.

This is a frontend-only composition change. It does not change submission persistence, aggregate queries, realtime invalidation, pathway resolution, public-data allowlisting or the share-card data boundary.

### Implemented post-submission journey

```text
Committed thank-you + reward status
  → explanation that the card is waiting below
  ├─ Skip to my card
  └─ inline post-submission Learning Lab
      → community picture
      → transition to the participant’s RESET
      → personalized share card + download/share
```

The inline Lab replaces every restart action with a persistent “My card” anchor. The standalone pre-submission Lab retains its “Take the Check-In” and “Contribute your RESET” actions.

## Session persistence decision

For the immediate change, keep the card session-only and prevent navigation from making it inaccessible. Do not introduce browser or server persistence merely to solve the Lab transition.

If recovery after refresh becomes a requirement, treat it as a separate product/privacy decision:

- session storage is simpler but would store first name/initials on the device until the tab session ends;
- server recovery requires an opaque receipt, access controls, expiry and retention rules;
- a URL must never contain name, email, responses or card personalization data.

## Implementation impact map

| Surface | Expected impact |
| --- | --- |
| Product | Replace competing Lab/card actions with a continuous post-submission narrative |
| UI state | Keep `success` as the owning state; do not switch to `lab` after submission |
| Learning Lab component | Add explicit standalone/post-submission presentation modes |
| Navigation | Add accessible anchor links and optional sticky “My card” action |
| Share card | No payload or canvas-content change |
| API/database | No change |
| Aggregate/realtime | Reuse the existing safe snapshot and invalidation flow |
| Privacy | No new data exposure or persistence |
| Accessibility | Verify anchor focus, sticky control, reduced motion and aggregate loading/error states |
| Responsive QA | Test long-page flow at 390px, larger mobile, tablet and desktop |

## Acceptance criteria for the recommended flow

- A successful submission is still required before the personalized result appears.
- The participant sees a clear message that their card is available at the end of the Lab.
- “Skip to my card” moves focus and scroll position to the share-card heading.
- The inline Lab contains no action that clears or starts over the completed response.
- The card can be downloaded or shared after exploring the Lab.
- Aggregate loading failure does not hide or block the share card.
- Pre-submission visitors can still explore the standalone Lab and start the check-in.
- Event and non-event reward states both use the same post-submission structure.
- Refresh recovery remains explicitly out of scope for this iteration.

## Future product decisions

1. Decide later whether the full Lab should be replaced by a shorter post-submission summary after real-event observation.
2. Decide later whether card recovery after page refresh is worth the added privacy and persistence complexity.
