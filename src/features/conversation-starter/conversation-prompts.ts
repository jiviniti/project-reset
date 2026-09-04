export const CONVERSATION_CONTENT_VERSION = 2 as const;

export type ConversationMode = "one" | "short" | "deep";
export type ConversationThemeId = "burnout" | "body" | "food" | "pace" | "influence" | "land" | "access" | "climate" | "connection" | "agency";
export type ConversationThemeChoice = ConversationThemeId | "across";
export type PromptPhase = "open" | "reflect" | "deepen" | "forward";

export type ConversationPrompt = {
  id: string;
  version: typeof CONVERSATION_CONTENT_VERSION;
  theme: ConversationThemeId;
  phase: PromptPhase;
  context: string;
  question: string;
  followUp: string;
};

export const CONVERSATION_MODES: Record<ConversationMode, { label: string; description: string; count: number }> = {
  one: { label: "One question", description: "A single place to begin", count: 1 },
  short: { label: "A short conversation", description: "Three questions with room to talk", count: 3 },
  deep: { label: "Go deeper", description: "Five questions that unfold gradually", count: 5 },
};

export const CONVERSATION_THEMES: Record<ConversationThemeId, { label: string; description: string; number: string }> = {
  burnout: { label: "Burnout beyond work", description: "Tiredness, depletion, guilt, and what goes unnamed", number: "01" },
  body: { label: "The body keeps speaking", description: "Stress, illness, limits, and the signals we live around", number: "02" },
  food: { label: "Food, memory, and care", description: "Culture, comfort, identity, and the stories at our tables", number: "03" },
  pace: { label: "The 24/7 life", description: "Speed, productivity, boundaries, and the pressure to stay on", number: "04" },
  influence: { label: "Who shapes our choices?", description: "Advertising, media, scrolling, and borrowed desires", number: "05" },
  land: { label: "Food, land, and labor", description: "Where food comes from and what remains out of sight", number: "06" },
  access: { label: "Choice and its limits", description: "Money, time, safety, access, and health equity", number: "07" },
  climate: { label: "Living with climate feelings", description: "Eco-anxiety, grief, hope, and an uncertain future", number: "08" },
  connection: { label: "Connection and isolation", description: "Care, community, loneliness, and being understood", number: "09" },
  agency: { label: "Change without perfection", description: "Resistance, possibility, and what we can do together", number: "10" },
};

const prompt = (id: string, theme: ConversationThemeId, phase: PromptPhase, context: string, question: string, followUp: string): ConversationPrompt =>
  ({ id, version: 2, theme, phase, context, question, followUp });

export const CONVERSATION_PROMPTS: readonly ConversationPrompt[] = [
  prompt("burnout-face", "burnout", "open", "The documentary looks at burnout as more than a workplace diagnosis.", "When you hear the word “burnout,” whose face comes to mind first? Is it yours?", "What makes that person come to mind?"),
  prompt("burnout-weather", "burnout", "open", "Exhaustion can be easier to describe through an image than a diagnosis.", "If your current energy were a weather pattern, what would the forecast say?", "Has that forecast changed recently?"),
  prompt("burnout-tired-depleted", "burnout", "reflect", "Not every kind of tiredness asks for the same response.", "What is the difference, for you, between being tired and being depleted?", "How do you know when you have crossed that line?"),
  prompt("burnout-always-on", "burnout", "deepen", "Work is only one place where people are expected to remain available and productive.", "Where in your life are you always “on”? Where, if anywhere, are you allowed to be off?", "Who or what makes being off feel possible?"),
  prompt("burnout-earned", "burnout", "deepen", "People sometimes compare their exhaustion with what they think they should be able to handle.", "Have you ever felt that you had not earned the right to feel burned out?", "Whose standard were you measuring yourself against?"),
  prompt("burnout-rest-without-guilt", "burnout", "forward", "Rest can carry judgments about ambition, worth, and responsibility.", "What would you have to believe about yourself in order to rest without guilt?", "What might help that belief feel more possible?"),

  prompt("body-first-signal", "body", "open", "Stress often reaches the body before we have words for it.", "What is the first signal your body sends when something is too much?", "What do you usually do with that signal?"),
  prompt("body-text-message", "body", "open", "The body can communicate through energy, pain, appetite, sleep, and mood.", "If your body could send you one text message today, what would it say?", "Would you answer it?"),
  prompt("body-real-limits", "body", "reflect", "Our actual limits are not always the limits we think we should have.", "How did you learn where your physical or emotional limits really are?", "What happens when you respect them?"),
  prompt("body-live-around", "body", "deepen", "People living with ongoing symptoms often build entire routines around them.", "Is there a signal from your body that you have learned to live around rather than listen to?", "What has made listening difficult?"),
  prompt("body-misunderstood-day", "body", "deepen", "Chronic illness can make an ordinary day cost more than other people see.", "What do people misunderstand about the energy an ordinary day can require?", "What kind of recognition or support would help?"),
  prompt("body-asking", "body", "forward", "Listening does not guarantee that every need can immediately be met.", "What has your health been asking for that has been difficult to give it?", "What is the smallest part of that request you could honor?"),

  prompt("food-first-meal", "food", "open", "Food is memory and relationship before it becomes a nutrition question.", "What is the first meal you can remember, and who made it?", "What feeling comes back with it?"),
  prompt("food-cared-for", "food", "open", "A meal can communicate safety, celebration, belonging, or love.", "What food tastes like being cared for?", "Who or what made it feel that way?"),
  prompt("food-culture-carry", "food", "reflect", "Families and cultures pass down practices as well as ingredients.", "What did your family or culture teach you about food that you still carry?", "Is there anything you have chosen to set down?"),
  prompt("food-fuel", "food", "deepen", "Speed and exhaustion can change our relationship with eating.", "Has food ever stopped feeling like a meal and started feeling only like fuel?", "What was happening in your life then?"),
  prompt("food-overwhelmed", "food", "deepen", "Food can soothe, connect, distract, restore, or simply get us through a difficult day.", "What do you reach for when you are overwhelmed, and what is it doing for you in that moment?", "What need might sit underneath that choice?"),
  prompt("food-table-difference", "food", "forward", "Eating differently from people we love can affect identity and belonging.", "When people at your table make different food choices, what helps everyone stay connected?", "What would a more generous food conversation sound like?"),

  prompt("pace-fastest", "pace", "open", "The pace of everyday life can feel natural even when someone else set it.", "What is the fastest part of your day, and who set that speed?", "What would change if it moved more slowly?"),
  prompt("pace-first-ten", "pace", "open", "The beginning of a day can reveal what is already asking for our attention.", "What do you do in the first ten minutes after you wake up?", "Did you choose that rhythm?"),
  prompt("pace-slack", "pace", "reflect", "Slack is the room a life has for interruption, care, and recovery.", "Where in your week is there any slack? What happens when it disappears?", "Who benefits when your time has no margin?"),
  prompt("pace-treadmill", "pace", "deepen", "The film uses the image of a treadmill for patterns that gradually deplete our sense of self.", "What is your version of that treadmill, and what keeps you on it?", "What would stepping off require?"),
  prompt("pace-saying-no", "pace", "deepen", "Boundaries become real when they change what we agree to carry.", "What do you keep saying yes to that you would like to stop saying yes to?", "What makes no feel costly?"),
  prompt("pace-own-speed", "pace", "forward", "Not everything meaningful can be done at maximum speed.", "What is one part of your life you would like to do at the pace it actually needs?", "What could protect that pace?"),

  prompt("influence-ads", "influence", "open", "Commercial messages become part of the background of daily life.", "How many advertisements do you think you have seen today, including the ones you stopped noticing?", "Which one do you remember, and why?"),
  prompt("influence-scroll", "influence", "open", "Digital spaces promise connection, information, relief, and escape.", "What do you scroll for, and what do you actually come away with?", "How often are those two things the same?"),
  prompt("influence-promised-feeling", "influence", "reflect", "Advertising often sells a feeling before it sells a product.", "What feeling do the messages aimed at you promise?", "What do they assume is missing from your life?"),
  prompt("influence-health-voice", "influence", "deepen", "Health decisions are shaped by people, platforms, brands, and institutions competing for trust.", "Whose voice is in your head when you make a quick decision about food or health?", "What gave that voice authority?"),
  prompt("influence-preferences", "influence", "deepen", "Repeated exposure can make a learned preference feel entirely personal.", "Which of your preferences feel genuinely like yours, and which might have been shaped for you?", "How could you tell the difference?"),
  prompt("influence-attention", "influence", "forward", "Attention is limited, and many systems are designed to capture it.", "What deserves more of your attention than it currently receives?", "What could you give less attention to in return?"),

  prompt("land-last-meal", "land", "open", "Meals connect us to places and people we may never see.", "Trace your last meal backwards. How far do you get before your knowledge runs out?", "What part of its journey would you most like to know?"),
  prompt("land-grandparents", "land", "open", "Food systems can change dramatically within a few generations.", "What did your grandparents eat, and where did it come from?", "What has changed between their table and yours?"),
  prompt("land-who-made", "land", "reflect", "Growing, harvesting, processing, transporting, and preparing food involve many kinds of labor.", "What do you know about who made the food you ate this week possible?", "How does not knowing sit with you?"),
  prompt("land-changed-landscape", "land", "deepen", "Changes in land use can reshape food, livelihoods, culture, and belonging.", "What has changed in the landscape where you or your family grew up?", "What was gained, and what may have been lost?"),
  prompt("land-distance", "land", "deepen", "Modern food systems can create distance between eating and the ground beneath it.", "When do you feel most connected to the land, water, or labor behind what you eat?", "What usually keeps that connection out of view?"),
  prompt("land-relationship", "land", "forward", "A relationship with land can exist in a city, a garden, a kitchen, or a community.", "What could a more conscious relationship with the sources of your food look like in the life you actually live?", "Who could help make it practical?"),

  prompt("access-nearby", "access", "open", "The choices available to us begin with what is physically nearby.", "What food and health resources are available within fifteen minutes of where you live?", "What is noticeably absent?"),
  prompt("access-price", "access", "open", "Price often makes a decision before preference gets a chance.", "When was the last time cost decided what you ate or how you cared for yourself?", "What option would you have preferred?"),
  prompt("access-assumed-resources", "access", "reflect", "Advice can quietly assume access to money, time, transport, safety, or a suitable kitchen.", "What health advice have you heard that assumed resources not everyone has?", "How could that advice acknowledge reality more honestly?"),
  prompt("access-options", "access", "deepen", "Personal responsibility has limits when environments distribute choices unequally.", "Who in your community has the fewest practical options for food, rest, or health?", "What would genuinely widen those options?"),
  prompt("access-privilege-choice", "access", "deepen", "People living close to one another can still have very different freedom to choose.", "What do you have the privilege of choosing that someone nearby may not?", "What responsibility, if any, comes with that freedom?"),
  prompt("access-support", "access", "forward", "A fairer system changes conditions rather than only asking individuals to try harder.", "What support would make a healthy choice more realistic for more people around you?", "Who has the power to help create it?"),

  prompt("climate-first-fright", "climate", "open", "Climate change is experienced through places, bodies, memories, and expectations for the future.", "Where were you the first time weather or environmental change genuinely frightened you?", "What made that moment feel different?"),
  prompt("climate-feeling", "climate", "open", "Climate feelings can include fear, anger, grief, guilt, numbness, love, and determination.", "What climate feeling visits you most often, and where does it go?", "Who can you share it with?"),
  prompt("climate-news", "climate", "reflect", "Information can prepare us to act, but constant exposure can also overwhelm us.", "What is the difference, for you, between news that informs you and news that numbs you?", "How do you recognize when you have had enough?"),
  prompt("climate-decisions", "climate", "deepen", "An uncertain climate can shape decisions about home, work, family, and the future.", "Has climate change influenced a major decision or expectation in your life?", "How much space have you had to talk about that?"),
  prompt("climate-2050", "climate", "deepen", "Images of the future come from experience, media, culture, and imagination.", "When you imagine 2050, what do you see first?", "Does that image feel like yours or something you were handed?"),
  prompt("climate-believable-hope", "climate", "forward", "Hope does not have to mean denying danger or uncertainty.", "What would hope have to look like for you to find it believable?", "Where have you already seen a small example of it?"),

  prompt("connection-who-feeds", "connection", "open", "Being fed can mean receiving food, attention, knowledge, steadiness, or care.", "Who feeds you, literally or otherwise?", "How do they know what you need?"),
  prompt("connection-yourself", "connection", "open", "Some relationships make it easier to stop performing and simply be present.", "Where do you feel most like yourself around other people?", "What makes that space different?"),
  prompt("connection-pandemic-loss", "connection", "reflect", "Some forms of connection disrupted during the pandemic never fully returned.", "What did you lose during the pandemic that has not come back?", "Do the people around you know you still miss it?"),
  prompt("connection-understood", "connection", "deepen", "Being supported begins with being understood on our own terms.", "What do you wish someone close to you understood about what you carry?", "What response would help rather than make it harder?"),
  prompt("connection-hidden-load", "connection", "deepen", "People around us may be carrying more than they feel able to reveal.", "Who around you may be carrying more than they let on?", "How could you make room without demanding disclosure?"),
  prompt("connection-community-strength", "connection", "forward", "Communities often create forms of care long before formal systems recognize them.", "What does your community already do well that no policy created?", "How could that strength be protected or shared?"),

  prompt("agency-changed-before", "agency", "open", "Past change can remind us that our present habits are not fixed forever.", "What have you already changed that you once thought you could not?", "What helped the change begin?"),
  prompt("agency-control", "agency", "open", "Agency includes recognizing both our influence and our limits.", "What is one thing you have some control over today, and one thing you do not?", "How do you tell them apart?"),
  prompt("agency-advice-gap", "agency", "reflect", "Knowing what we want to do is different from having the conditions to do it.", "What advice do you agree with and still find difficult to follow?", "What is actually in the way?"),
  prompt("agency-resistance", "agency", "deepen", "Being instructed to change can sometimes produce resistance instead of curiosity.", "When does being told to make a “better choice” make you dig in?", "What kind of invitation would feel more respectful?"),
  prompt("agency-five-years", "agency", "deepen", "A desired future can reveal which changes feel personally meaningful.", "What do you want to be true about how you live five years from now?", "Which parts depend on you, and which require wider change?"),
  prompt("agency-gentle-nudge", "agency", "forward", "The film invites gentle nudges rather than a demand for instant perfection.", "What is one personal or shared nudge that feels possible without pretending it solves everything?", "Who could make it easier to sustain?"),
] as const;

const MODE_PHASES: Record<Exclude<ConversationMode, "one">, readonly PromptPhase[]> = {
  short: ["open", "deepen", "forward"],
  deep: ["open", "open", "reflect", "deepen", "forward"],
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

function pick<T>(items: readonly T[], random: () => number) {
  return items[Math.floor(random() * items.length)];
}

export function getPrompt(promptId: string) {
  return CONVERSATION_PROMPTS.find((candidate) => candidate.id === promptId);
}

export function getThemeLabel(choice: ConversationThemeChoice) {
  return choice === "across" ? "Across the film" : CONVERSATION_THEMES[choice].label;
}

export function buildConversationSession(choice: ConversationThemeChoice, mode: ConversationMode, seed: number) {
  const random = seededRandom(seed);
  const pool = choice === "across" ? CONVERSATION_PROMPTS : CONVERSATION_PROMPTS.filter((candidate) => candidate.theme === choice);

  if (mode === "one") {
    const gentleOpeners = pool.filter((candidate) => candidate.phase === "open" || candidate.phase === "reflect");
    const selected = pick(gentleOpeners, random);
    if (!selected) throw new Error(`No conversation prompt available for ${choice}`);
    return [selected.id];
  }

  const used = new Set<string>();
  const usedThemes = new Set<ConversationThemeId>();
  return MODE_PHASES[mode].map((phase) => {
    let candidates = pool.filter((candidate) => candidate.phase === phase && !used.has(candidate.id));
    if (choice === "across") {
      const newThemeCandidates = candidates.filter((candidate) => !usedThemes.has(candidate.theme));
      if (newThemeCandidates.length) candidates = newThemeCandidates;
    }
    const selected = pick(candidates, random);
    if (!selected) throw new Error(`No ${phase} prompt available for ${choice}`);
    used.add(selected.id);
    usedThemes.add(selected.theme);
    return selected.id;
  });
}

export function findReplacementPrompt(currentPromptId: string, usedPromptIds: readonly string[], passedPromptIds: readonly string[], seed: number) {
  const current = getPrompt(currentPromptId);
  if (!current) return undefined;
  const unavailable = new Set([...usedPromptIds, ...passedPromptIds]);
  const candidates = CONVERSATION_PROMPTS.filter((candidate) => candidate.theme === current.theme && !unavailable.has(candidate.id));
  if (!candidates.length) return undefined;
  return pick(candidates, seededRandom(seed));
}
