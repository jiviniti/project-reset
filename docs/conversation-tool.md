# Take It to the Table

Last updated: 3 September 2026

Status: experimental, public-but-unlinked review prototype. The Foundation has selected this direction to replace the share card, but prompt copy and final integration still require review.

## Purpose

Take It to the Table is a client-only conversation companion informed by *Third Degree Burnout – A Survivor’s Guide*. It helps two people or a small group use one shared device to explore a subject they choose, without requiring a resolved answer or prior knowledge of the film.

The working title uses the table as a metaphor. The tool also explicitly welcomes walks, calls, classrooms and other gatherings. It supports mixed groups where only some people have watched the film.

## Experience

Participants first choose one of ten film-informed themes, or “Across the film” for a mixed selection:

1. Burnout beyond work
2. The body keeps speaking
3. Food, memory, and care
4. The 24/7 life
5. Who shapes our choices?
6. Food, land, and labor
7. Choice and its limits
8. Living with climate feelings
9. Connection and isolation
10. Change without perfection

They then select “One question,” “A short conversation” with three questions, or “Go deeper” with five. These labels deliberately avoid implying a fixed time commitment. The version 2 bank contains 60 prompts, six per theme, selected from the larger Foundation-supplied draft bank and edited so that no question requires having watched the film.

Each card contains a short context, one question, an optional follow-up and permission to pass. Passing substitutes another unused prompt from the same theme when possible. The final screen invites the group to carry one question forward, choose another theme, or copy the generic tool link.

## Data and architecture boundary

- The route is `/take-it-to-the-table` and is not linked from the active check-in.
- It makes no API, Supabase, analytics or KINEMA requests.
- It contains no answer fields and does not record what participants say.
- `sessionStorage` contains only content version, theme, conversation mode, random seed, prompt IDs, passed IDs, position and completion state. Closing the tab removes it with the browser session.
- The prompt bank is typed and versioned independently of questionnaire versions.
- Search indexing is disabled during review.

## Content and safety

The 60 draft prompts are grounded in the film’s framing of burnout beyond work, chronic illness, food and memory, the 24/7 lifestyle, media influence, land and labor, access, climate feelings, community and agency. They ask about perception, memory, mood, behavior and relationships rather than testing facts. They do not require scene-specific knowledge or assume a participant follows or wants to follow a particular diet. Participants are reminded that passing is allowed, listening is not fixing, personal stories stay private, and the experience is not therapy or crisis support.

The Foundation intends the tool to replace the rejected share-card concept and for KINEMA to link to it after viewing. The old share-card review route remains available only in case that decision is revisited. The live participant journey remains unchanged until the tool’s content and placement receive final approval.
