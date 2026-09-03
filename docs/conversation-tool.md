# Take It to the Table

Last updated: 3 September 2026

Status: experimental, public-but-unlinked review prototype. Prompt copy requires Foundation approval before participant-facing integration.

## Purpose

Take It to the Table is a client-only conversation companion inspired by *Third Degree Burnout – A Survivor’s Guide*. It helps two people or a small group use one shared device to move from an opening observation into personal, relational and systemic questions, then close without requiring a resolved answer.

The working title uses the table as a metaphor. The tool also explicitly welcomes walks, calls, classrooms and other gatherings. It supports mixed groups where only some people have watched the film.

## Experience

Participants select an approximate 15, 30 or 60-minute session. This selects four, five or nine questions respectively; it does not start a timer. Prompts preserve the sequence:

1. Arrive
2. Name the exhaustion
3. Understand one another
4. Look at the systems
5. Carry it forward

Each card contains a short context, one question, an optional follow-up and permission to pass. Passing substitutes another unused prompt from the same stage when possible. The final screen invites the group to carry one question forward, restart, or copy the generic tool link.

## Data and architecture boundary

- The route is `/take-it-to-the-table` and is not linked from the active check-in.
- It makes no API, Supabase, analytics or KINEMA requests.
- It contains no answer fields and does not record what participants say.
- `sessionStorage` contains only content version, duration, random seed, prompt IDs, passed IDs, position and completion state. Closing the tab removes it with the browser session.
- The prompt bank is typed and versioned independently of questionnaire versions.
- Search indexing is disabled during review.

## Content and safety

The 20 draft prompts are grounded in the film’s published framing of personal burnout, food systems, health equity, social conditions and planetary strain. They do not require scene-specific knowledge. Participants are reminded that passing is allowed, listening is not fixing, personal stories stay private, and the experience is not therapy or crisis support.

All prompt wording and the working title require Foundation approval before the route is linked from any participant-facing journey.
