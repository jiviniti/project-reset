# Take It to the Table

Last updated: 5 September 2026

Status: public, noindex conversation companion. It replaces the share card in the post-check-in journey; the share-card concept route remains available only for internal review.

## Experience

Take It to the Table is a client-only question library informed by *Third Degree Burnout – A Survivor’s Guide*. It supports one person, two people or a small group, and no question requires prior viewing of the film.

The first view features Burnout beyond work, Food memory and care, Choice and its limits, and Connection and isolation. “Show all 10 themes” reveals the complete set. A separate mixed collection offers six prompts from across the film when someone is unsure where to begin.

Selecting a theme reveals all six primary questions together. Context and a deeper follow-up can be expanded within each card. There is no timer, required order, answer field, pass state or completion quota. “Carry this question forward” highlights one stable prompt and offers a theme/question deep link through native sharing or clipboard fallback.

## Data boundary

- The route is `/take-it-to-the-table` and is linked after the Learning Lab and film/trailer reward.
- It makes no API, Supabase, analytics or KINEMA requests.
- It contains no answer fields and records nothing participants say.
- Deep links contain only allowlisted `theme` and `question` identifiers.
- The prompt bank remains 60 typed, versioned prompts across 10 themes.
- Search indexing remains disabled during review.

The safety copy identifies the page as a conversation guide rather than therapy or crisis support. KINEMA may also link to the same generic route after viewing the film.
