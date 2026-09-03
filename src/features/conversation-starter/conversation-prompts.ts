export const CONVERSATION_CONTENT_VERSION = 1 as const;

export type ConversationDuration = 15 | 30 | 60;
export type ConversationStageId = "arrive" | "name" | "understand" | "systems" | "carry";

export type ConversationPrompt = {
  id: string;
  version: typeof CONVERSATION_CONTENT_VERSION;
  stage: ConversationStageId;
  context: string;
  question: string;
  followUp: string;
  eligibleDurations: readonly ConversationDuration[];
};

export const CONVERSATION_STAGES: Record<ConversationStageId, { label: string; number: string }> = {
  arrive: { label: "Arrive", number: "01" },
  name: { label: "Name the exhaustion", number: "02" },
  understand: { label: "Understand one another", number: "03" },
  systems: { label: "Look at the systems", number: "04" },
  carry: { label: "Carry it forward", number: "05" },
};

const ALL_DURATIONS = [15, 30, 60] as const;

export const CONVERSATION_PROMPTS: readonly ConversationPrompt[] = [
  {
    id: "arrive-staying-with-you",
    version: 1,
    stage: "arrive",
    context: "You do not need to have watched the film. Start with what brought you to this conversation.",
    question: "What has stayed with you recently that you have wanted to talk about?",
    followUp: "Why do you think it has been difficult to begin?",
    eligibleDurations: ALL_DURATIONS,
  },
  {
    id: "arrive-after-the-film",
    version: 1,
    stage: "arrive",
    context: "Some of us may have seen the film and some may simply be curious. Both are welcome here.",
    question: "If you saw the film, what followed you out of the room? If you did not, what made you curious?",
    followUp: "Did it challenge, confirm, or complicate something for you?",
    eligibleDurations: ALL_DURATIONS,
  },
  {
    id: "arrive-missing-conversation",
    version: 1,
    stage: "arrive",
    context: "Not every important conversation arrives with an obvious opening line.",
    question: "What kind of conversation have you been missing lately?",
    followUp: "Who would you most want to have it with?",
    eligibleDurations: ALL_DURATIONS,
  },
  {
    id: "arrive-useful-and-safe",
    version: 1,
    stage: "arrive",
    context: "Before going deeper, the people in the conversation get to shape how it feels.",
    question: "What would make this conversation feel useful and safe?",
    followUp: "Is there anything you want the group to avoid trying to fix?",
    eligibleDurations: ALL_DURATIONS,
  },
  {
    id: "name-kind-of-tired",
    version: 1,
    stage: "name",
    context: "Burnout is often treated as a workplace problem, but exhaustion can begin elsewhere.",
    question: "When you say “tired,” what kind of tired do you mean?",
    followUp: "Where do you notice that tiredness most clearly?",
    eligibleDurations: ALL_DURATIONS,
  },
  {
    id: "name-earned-burnout",
    version: 1,
    stage: "name",
    context: "People sometimes judge their exhaustion against what they think they should be able to handle.",
    question: "Have you ever felt that you had not earned the right to feel burned out?",
    followUp: "Whose definition of burnout were you measuring yourself against?",
    eligibleDurations: ALL_DURATIONS,
  },
  {
    id: "name-unseen-pressure",
    version: 1,
    stage: "name",
    context: "Every generation and stage of life carries pressures that can be difficult to see from the outside.",
    question: "What pressures do people at your stage of life carry that others may not see?",
    followUp: "Which pressures feel personal, and which feel larger than any one person?",
    eligibleDurations: ALL_DURATIONS,
  },
  {
    id: "name-what-exhaustion-asks",
    version: 1,
    stage: "name",
    context: "Naming what is missing can be different from immediately solving it.",
    question: "What does your exhaustion seem to be asking for: rest, support, change, understanding, or something else?",
    followUp: "What makes that need easier or harder to honor?",
    eligibleDurations: ALL_DURATIONS,
  },
  {
    id: "understand-what-i-carry",
    version: 1,
    stage: "understand",
    context: "Being understood is not the same as being fixed.",
    question: "What do you wish someone close to you understood about what you carry?",
    followUp: "What might help you say that to them?",
    eligibleDurations: ALL_DURATIONS,
  },
  {
    id: "understand-helpful-response",
    version: 1,
    stage: "understand",
    context: "Care can look different to different people, especially when energy is low.",
    question: "When you are struggling, what response helps, and what makes it harder?",
    followUp: "Do the people around you know the difference?",
    eligibleDurations: ALL_DURATIONS,
  },
  {
    id: "understand-lessons-about-success",
    version: 1,
    stage: "understand",
    context: "Our ideas about a worthwhile life often arrive long before we choose them for ourselves.",
    question: "Who taught you what rest, productivity, and success should look like?",
    followUp: "Which part of that lesson would you keep, and which part would you release?",
    eligibleDurations: ALL_DURATIONS,
  },
  {
    id: "understand-honest-space",
    version: 1,
    stage: "understand",
    context: "Honesty depends as much on the space around us as it does on courage.",
    question: "Where can you be honest about not coping, and what makes that possible?",
    followUp: "How could you help create that kind of space for someone else?",
    eligibleDurations: ALL_DURATIONS,
  },
  {
    id: "systems-noticing-differently",
    version: 1,
    stage: "systems",
    context: "The film asks us to notice the systems connecting personal, social, and planetary well-being.",
    question: "What ordinary part of daily life have you started noticing differently?",
    followUp: "What became visible once you paid attention?",
    eligibleDurations: ALL_DURATIONS,
  },
  {
    id: "systems-how-much-choice",
    version: 1,
    stage: "systems",
    context: "Choices are shaped by time, money, culture, access, work, and the options made available to us.",
    question: "How much choice do people really have over food, work, rest, and health?",
    followUp: "Who is offered more choice, and who is asked to make do with less?",
    eligibleDurations: ALL_DURATIONS,
  },
  {
    id: "systems-unseen-labor",
    version: 1,
    stage: "systems",
    context: "Daily life depends on people and systems that can disappear behind the things we consume.",
    question: "Whose labor makes your daily life possible but often remains unseen?",
    followUp: "How might noticing that labor change our sense of responsibility?",
    eligibleDurations: ALL_DURATIONS,
  },
  {
    id: "systems-better-choices",
    version: 1,
    stage: "systems",
    context: "Advice about individual behavior can overlook the conditions in which decisions are made.",
    question: "When does advice about “better choices” ignore access, history, or power?",
    followUp: "What would fairer support look like instead?",
    eligibleDurations: ALL_DURATIONS,
  },
  {
    id: "carry-around-not-inside",
    version: 1,
    stage: "carry",
    context: "Recovery is not only an individual responsibility.",
    question: "What would need to change around you, not only inside you, for recovery to feel possible?",
    followUp: "Is any part of that change something people could ask for together?",
    eligibleDurations: ALL_DURATIONS,
  },
  {
    id: "carry-gentle-nudge",
    version: 1,
    stage: "carry",
    context: "A meaningful next step can be small, shared, or simply a new way of noticing.",
    question: "What is one gentle nudge, personal or shared, that feels possible?",
    followUp: "What could make it easier to begin?",
    eligibleDurations: ALL_DURATIONS,
  },
  {
    id: "carry-leave-open",
    version: 1,
    stage: "carry",
    context: "A good conversation does not need to resolve everything it opens.",
    question: "What question from this conversation do you want to leave open?",
    followUp: "What would it look like to keep listening for an answer?",
    eligibleDurations: ALL_DURATIONS,
  },
  {
    id: "carry-invite-someone",
    version: 1,
    stage: "carry",
    context: "Conversations travel through relationships, one invitation at a time.",
    question: "Who else would you like to invite into this conversation, and what would help you begin?",
    followUp: "Which question from today might you bring to them?",
    eligibleDurations: ALL_DURATIONS,
  },
] as const;

const SESSION_RECIPES: Record<ConversationDuration, readonly ConversationStageId[]> = {
  15: ["arrive", "name", "systems", "carry"],
  30: ["arrive", "name", "understand", "systems", "carry"],
  60: ["arrive", "name", "name", "understand", "understand", "systems", "systems", "carry", "carry"],
};

function seededRandom(seed: number) {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

export function getPrompt(promptId: string) {
  return CONVERSATION_PROMPTS.find((prompt) => prompt.id === promptId);
}

export function buildConversationSession(duration: ConversationDuration, seed: number) {
  const random = seededRandom(seed);
  const used = new Set<string>();

  return SESSION_RECIPES[duration].map((stage) => {
    const candidates = CONVERSATION_PROMPTS.filter(
      (prompt) => prompt.stage === stage && prompt.eligibleDurations.includes(duration) && !used.has(prompt.id),
    );
    const selected = candidates[Math.floor(random() * candidates.length)];
    if (!selected) throw new Error(`No conversation prompt available for ${stage}`);
    used.add(selected.id);
    return selected.id;
  });
}

export function findReplacementPrompt(
  currentPromptId: string,
  usedPromptIds: readonly string[],
  passedPromptIds: readonly string[],
  duration: ConversationDuration,
  seed: number,
) {
  const current = getPrompt(currentPromptId);
  if (!current) return undefined;
  const unavailable = new Set([...usedPromptIds, ...passedPromptIds]);
  const candidates = CONVERSATION_PROMPTS.filter(
    (prompt) => prompt.stage === current.stage
      && prompt.eligibleDurations.includes(duration)
      && !unavailable.has(prompt.id),
  );
  if (!candidates.length) return undefined;
  return candidates[Math.floor(seededRandom(seed)() * candidates.length)];
}
