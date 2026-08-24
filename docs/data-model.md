# Data model

All raw records live in `private`. A participant is a durable identity; a participation is one completion associated with a screening and questionnaire version.

One trim-and-lowercase normalized email is assumed to identify one participant across screenings. This is enforced by a unique index. Email is not the primary key and receives no provider-specific transformation.

Direct identity is stored in `participants`; screening demographics live in `participations`; research answers live in `responses`, `response_answers` and `response_selections`. Free text remains private because it may identify a participant.

`communication_preferences` stores only optional future communications and defaults to false. Transactional film access is represented independently in `reward_deliveries`.
