import { describe, expect, it } from "vitest";
import {
  buildConversationSession,
  CONVERSATION_PROMPTS,
  findReplacementPrompt,
  getPrompt,
  type ConversationStageId,
} from "@/features/conversation-starter/conversation-prompts";

describe("Take It to the Table session builder", () => {
  it.each([
    [15, 4, ["arrive", "name", "systems", "carry"]],
    [30, 5, ["arrive", "name", "understand", "systems", "carry"]],
    [60, 9, ["arrive", "name", "name", "understand", "understand", "systems", "systems", "carry", "carry"]],
  ] as const)("builds the %i-minute stage recipe", (duration, count, expectedStages) => {
    const ids = buildConversationSession(duration, 3817);
    expect(ids).toHaveLength(count);
    expect(new Set(ids).size).toBe(count);
    expect(ids.map((id) => getPrompt(id)?.stage)).toEqual(expectedStages);
  });

  it("is deterministic when given the same seed", () => {
    expect(buildConversationSession(60, 91)).toEqual(buildConversationSession(60, 91));
  });

  it("keeps every prompt typed, versioned, and fully written", () => {
    expect(CONVERSATION_PROMPTS).toHaveLength(20);
    const stageCounts = CONVERSATION_PROMPTS.reduce<Record<ConversationStageId, number>>(
      (counts, prompt) => ({ ...counts, [prompt.stage]: counts[prompt.stage] + 1 }),
      { arrive: 0, name: 0, understand: 0, systems: 0, carry: 0 },
    );
    expect(stageCounts).toEqual({ arrive: 4, name: 4, understand: 4, systems: 4, carry: 4 });
    for (const prompt of CONVERSATION_PROMPTS) {
      expect(prompt.version).toBe(1);
      expect(prompt.context.length).toBeGreaterThan(20);
      expect(prompt.question.endsWith("?")).toBe(true);
      expect(prompt.followUp.endsWith("?")).toBe(true);
    }
  });

  it("replaces a passed card only with an unused prompt from the same stage", () => {
    const session = buildConversationSession(30, 12);
    const current = getPrompt(session[1]);
    const replacement = findReplacementPrompt(session[1], session, [], 30, 99);
    expect(replacement).toBeDefined();
    expect(replacement?.stage).toBe(current?.stage);
    expect(session).not.toContain(replacement?.id);
  });

  it("does not serve a previously passed replacement again", () => {
    const session = buildConversationSession(30, 12);
    const first = findReplacementPrompt(session[1], session, [], 30, 99);
    expect(first).toBeDefined();
    const second = findReplacementPrompt(session[1], session, [first!.id], 30, 100);
    expect(second?.id).not.toBe(first?.id);
  });
});
