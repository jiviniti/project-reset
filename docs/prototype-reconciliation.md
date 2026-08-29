# Prototype reconciliation

Last updated: 26 August 2026

## Source-of-truth rule

The active Next.js/Supabase implementation is authoritative for persistence, consent, idempotency, aggregate computation, realtime invalidation, privacy/security boundaries and deployment. The latest approved prototype is authoritative for the participant journey, screen order, user-facing copy, visual language, layout, hierarchy, typography, component appearance, spacing, imagery, motion, navigation and terminology unless a prototype behavior conflicts with the verified production boundary.

The opaque prototype runtime is reference-only. Production recreates approved behavior with typed React, semantic HTML, accessible controls and reusable CSS; it does not embed or ship the prototype bundle.

## Latest prototype identified

- Supplied file: `Project RESET Learning Lab Prototype - Latest.html`
- Supplied file timestamp: 25 August 2026, 17:39 local
- Canonical reference: `reference/prototype/Project RESET Learning Lab Prototype.html`
- SHA-256: `bf06b5c2c8cf45aa94c05a0ab6cbac1095aca41a3b815346fa9b44d2610cd1ac`
- Verification: the newly supplied “Latest” file is byte-identical to the canonical reference already stored in the repository.

## Reconciliation table

| Screen / component | Current implementation | Latest approved prototype | Difference | Required change | Technical impact | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Experience shell | Responsive centered shell capped at 430px | Centered 390px mobile artifact on desktop; edge-to-edge at mobile size | Production measure is wider | Standardize the product measure to 390px while retaining edge-to-edge mobile behavior | CSS only | Implemented |
| Hero navigation | White wordmark and small text Donate link | White wordmark and filled coral Donate action | Action hierarchy differs | Use the approved filled Donate treatment and existing approved URL | CSS only | Implemented |
| Hero identity | Film-first title, “Welcome.” script line, shortened campaign copy | Project RESET lockup, “Choose Better. Together.” script line, documentary descriptor and fuller Picture Motion/campaign copy | Brand hierarchy and copy differ materially | Rebuild the hero hierarchy and copy around the approved RESET identity | React/CSS only | Implemented |
| Hero imagery/actions | Approved collage and two actions already present | Same collage in burgundy card; stronger spacing and campaign metadata | Image framing and spacing differ | Match framing, radii, spacing and action styling | CSS only | Implemented |
| Journey progress | Three form steps; success is a separate unnumbered view | Four-stage presentation with thank-you shown as Step 04 of 04 | Participant perception differs | Show persisted success as Step 04 without moving persistence or creating an extra submission stage | React state/CSS only | Implemented |
| Burnout question | Correct dark surface and selections; compact private-tag Add row | Editorial spacing plus autocomplete-style tag panel and contextual explanation | Tag interaction and hierarchy differ | Match the panel/chip presentation while keeping tags private, literal and unaggregated | React/CSS; no schema change | Implemented |
| RESET question | Correct pathways/practices and private tags; compact presentation | Peach field, larger pathway cards, contextual tag copy and practice groups | Visual hierarchy differs | Reconcile cards, fields, spacing and copy | React/CSS only | Implemented |
| Final PII stage | PII already appears only at the final stage; email-only reward and required consent are production-safe | Final identity stage also demonstrates SMS and “skip film” concepts but omits production consent wording | Prototype demo includes deferred/unsafe paths | Match visual layout but retain email-only delivery, required identity and required data-use consent | No backend change | Intentionally preserved production difference |
| Thank-you | Accurate deferred-reward copy; share card precedes reward block | Coral celebration; reward block and Learning Lab action precede invitation/share area | Order, hierarchy and styling differ | Present success as Step 04, then truthful reward state, Lab action and share invitation | React/CSS only | Implemented |
| Share card | Functional 1080×1350 canvas, download and native share | Compact “My RESET” card within “Bring someone with you” section | Production function is stronger; presentation differs | Preserve export/share behavior and restyle the preview/section to match the approved composition | Canvas/CSS only | Implemented |
| Aggregate introduction | Separate burgundy intro emphasizing observed responses | Prototype begins directly with the Burnout Landscape | Section order differs | Integrate a compact safe provenance/participation summary into the prototype-style sequence | React/CSS only | Implemented |
| Burnout visualization | Filled circular bubbles with counts | Frequency-scaled drifting word cloud | Visual model differs | Render allowlisted aggregate metrics as accessible frequency-scaled words | React/CSS; same API | Implemented |
| RESET visualization | Separate pathway and practice bubble groups | RESET practice word cloud, cumulative stats and pathway rings | Visual model and hierarchy differ | Recompose safe aggregate data into word cloud, stats and pathway rings | React/CSS; same API | Implemented |
| Community-created tags | Not exposed publicly | Prototype displays seeded/new community tags | Conflicts with privacy rule and deferred moderation | Keep omitted from the public client | None | Intentionally excluded |
| Community voices | Not exposed publicly | Prototype rotates anonymous free-text quotes | Public API forbids free text | Keep omitted until a separately approved editorial/moderation pipeline exists | None | Intentionally excluded |
| Map | Not implemented | Explicitly labelled phase-two illustrative placeholder | Outside this pass | Keep omitted | None | Deferred |
| Donate/footer | Hero Donate only | Additional campaign Donate CTA and partner/footer block | Product ending differs | Add approved campaign/footer composition without new integrations | React/CSS/static assets | Implemented |
| Typography/tokens | Partial palette with system fallbacks | Poppins, EB Garamond, script accent, full Virsa palette, 8px spacing rhythm | Token coverage and font fidelity differ | Add reusable tokens and approved local font assets | Static assets/CSS | Implemented with prototype substitute script font |
| Motion | Step/bubble entrance only | Step rise, word drift, blooming tags, counter/ring movement and rotating-content feel | Motion language differs | Reproduce restrained relevant motion with reduced-motion support | CSS/React only | Implemented |
| U.S. English | Mostly compliant | Prototype contains British “anonymised” in its footer | Production terminology must be U.S. English | Audit all visible and accessibility copy; use “anonymized,” “programs,” “personalized,” and “color” | Copy plus additive policy version | Implemented |

## Seeded baseline provenance

The value `4,283` originates directly in the latest approved prototype as `const total = 4283`. It is presentation/demo data; no supplied dataset or evidence identifies it as observed Project RESET participation.

The database fixture in `supabase/seed/002_aggregate_baseline.sql` is deterministically derived from the same prototype model:

- the total is the prototype constant `4,283`;
- burnout counts use the prototype’s 61% “named overwhelm” anchor, multiplied by each `BURNOUT_SEED` relative weight;
- RESET-practice counts use the prototype’s 68% “chose Walking” anchor, multiplied by each `RESET_SEED` relative weight, restricted to approved questionnaire options;
- pathway counts use the prototype’s `[64, 71, 58, 66, 52]` pathway percentages;
- prototype-only terms without approved metric definitions are not inserted into the public aggregate allowlist.

The baseline must continue to be labelled illustrative and remain structurally separate from observed submissions. It must not be described as real participants without new documentary evidence from the Foundation.

## Intentionally preserved production differences

- Required data-use consent and atomic persistence remain mandatory before success.
- Email remains the only enabled reward-delivery channel; SMS is deferred.
- The prototype’s “skip film” path is not implemented because participant identity is currently required by the approved submission contract.
- Participant-created tags preserve submitted wording in private text responses. They are not alias-matched, canonicalized, clustered, moderated or added to public metrics.
- Community-created tags, free-text voices and the illustrative map do not appear in the public visualization.
- The thank-you reward card states the truthful deferred preview status instead of claiming that an email was sent.
- The production share card retains native download/share functionality even though the prototype only demonstrates a static share composition and platform buttons.

## Unresolved dependencies

- The prototype notes that “Debora Celina Script” is a paid/custom typeface and substitutes Petit Formal Script. The approved webfont files are still required if the exact paid face is intended for production.
- Reward delivery copy must change again only when an approved email provider and KINEMA workflow are implemented.
- The illustrative baseline wording should receive final Foundation approval before production cutover.

## Foundation feedback pass — 26 August 2026

The first stakeholder review of the reconciled preview confirmed that the overall visual direction, copy, personal RESET snapshot, and community word clouds were working well. The following unambiguous refinements were adopted without changing the production architecture:

- the Learning Lab now keeps a visible “Take the Check-In” action at the top, so visitors do not need to reach the final call-to-action before contributing;
- participant-created responses use consumer-facing language that explains what happens to the data without exposing internal “private tag” terminology;
- the noninteractive Email pill was removed from the final stage;
- required name/initials and email fields are labelled explicitly, while city, age range, and occupation are grouped and described as optional;
- share actions now distinguish saving a PNG from opening the device share sheet, including a short device-availability note;
- the observed-check-in callout was removed from the Learning Lab while the underlying observed count remains available to the safe aggregate model;
- the preview is explicitly labelled illustrative, and the footer uses a legible JIVINITI mark with a tighter Picture Motion partnership composition.

The review did not authorize changes to identity requirements, KINEMA provider integration, seeded-data policy, legal copyright wording, or the aggregate/security architecture. A later Foundation decision established the event/non-event reward rules; the implementation now records those decisions without yet issuing KINEMA access.

## Event/non-event addendum — 29 August 2026

This product rule postdates the visual prototype, so the Foundation decision supersedes prototype reward copy without changing the approved visual language:

- an active event pathway earns time-limited film access;
- a general/non-event pathway earns trailer access;
- an expired or not-yet-open event URL falls back to the non-event trailer experience;
- both pathways retain the visualization and share card;
- the share card’s campaign URL must always enter the non-event pathway.

The active frontend now presents the resolved reward truthfully. Actual film issuance remains deferred until KINEMA confirms its supported integration model.
