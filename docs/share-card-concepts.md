# Share-card concept lab

The temporary review route at `/share-card-concepts` renders eleven Project RESET share-card directions from the same participant answers. Its interactive playground supports editable names, one to five pathways, practices and campaign URLs, plus presets for one pathway, all five pathways, long names, non-ASCII text, long entries and empty answers. It is intentionally separate from the production card so a direction can be selected before the participant experience changes.

Every card is generated deterministically with the native Canvas API at 1080 × 1350. No generative-image service, participant API, or public participant data is used. The documentary collage is a transparent PNG mechanically converted from the supplied `thirddegreeburnout -1.avif` artwork.

Multiline entries are fitted into each card’s available text box. The renderer progressively reduces the font size and recalculates line wrapping, including safe character-level wrapping for an unusually long unbroken word, so the participant’s wording is not silently truncated.

## Directions

1. Personal Scrapbook — Nivi shortlist 01
2. Poster Grid — Nivi shortlist 02
3. Film Collage Poster
4. Type Is the Poster
5. Community Spotlight
6. Pathway Worlds
7. The Community Issue
8. Split Editorial
9. Minimal Editorial
10. Color Bands
11. Collage Window

The renderers live in `src/features/share-card/concept-renderers.ts`. The gallery lives in `src/features/share-card/share-card-concept-gallery.tsx`. Run `npm run export:share-cards` while the local app is available at `http://localhost:3000` to export review PNGs into the ignored `artifacts/share-card-concepts` directory.

## Decision boundary

These concepts are exploratory. Selecting one direction is a product/design decision for Nivi and the Project RESET team. Until then, the existing participant share card remains unchanged.
