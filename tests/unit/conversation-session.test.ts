import { describe, expect, it } from "vitest";
import {
  buildConversationSession,
  CONVERSATION_PROMPTS,
  CONVERSATION_THEMES,
  findReplacementPrompt,
  getPrompt,
  type ConversationThemeId,
} from "@/features/conversation-starter/conversation-prompts";

describe("Take It to the Table session builder", () => {
  it.each([
    ["one", 1],
    ["short", 3],
    ["deep", 5],
  ] as const)("builds the %s conversation recipe", (mode, count) => {
    const ids = buildConversationSession("burnout", mode, 3817);
    expect(ids).toHaveLength(count);
    expect(new Set(ids).size).toBe(count);
    expect(ids.every((id) => getPrompt(id)?.theme === "burnout")).toBe(true);
  });

  it("orders a short conversation from opening to depth to a forward question", () => {
    const ids = buildConversationSession("food", "short", 12);
    expect(ids.map((id) => getPrompt(id)?.phase)).toEqual(["open", "deepen", "forward"]);
  });

  it("draws across different film themes without repetition", () => {
    const ids = buildConversationSession("across", "deep", 91);
    expect(new Set(ids).size).toBe(5);
    expect(new Set(ids.map((id) => getPrompt(id)?.theme)).size).toBe(5);
  });

  it("is deterministic when given the same choices and seed", () => {
    expect(buildConversationSession("across", "deep", 91)).toEqual(buildConversationSession("across", "deep", 91));
  });

  it("keeps a substantial, balanced, versioned film-theme bank", () => {
    expect(CONVERSATION_PROMPTS).toHaveLength(60);
    const themeIds = Object.keys(CONVERSATION_THEMES) as ConversationThemeId[];
    for (const themeId of themeIds) {
      const prompts = CONVERSATION_PROMPTS.filter((candidate) => candidate.theme === themeId);
      expect(prompts).toHaveLength(6);
      expect(prompts.filter((candidate) => candidate.phase === "open")).toHaveLength(2);
      expect(prompts.some((candidate) => candidate.phase === "forward")).toBe(true);
    }
    for (const item of CONVERSATION_PROMPTS) {
      expect(item.version).toBe(2);
      expect(item.context.length).toBeGreaterThan(20);
      expect(item.question.endsWith("?")).toBe(true);
      expect(item.followUp.endsWith("?")).toBe(true);
    }
  });

  it("replaces a passed card only with an unused prompt from its chosen theme", () => {
    const session = buildConversationSession("climate", "deep", 12);
    const current = getPrompt(session[1]);
    const replacement = findReplacementPrompt(session[1], session, [], 99);
    expect(replacement).toBeDefined();
    expect(replacement?.theme).toBe(current?.theme);
    expect(session).not.toContain(replacement?.id);
  });

  it("does not serve a previously passed replacement again", () => {
    const session = buildConversationSession("connection", "short", 12);
    const first = findReplacementPrompt(session[1], session, [], 99);
    expect(first).toBeDefined();
    const second = findReplacementPrompt(session[1], session, [first!.id], 100);
    expect(second?.id).not.toBe(first?.id);
  });
});
