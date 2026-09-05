import { describe, expect, it } from "vitest";
import {
  CONVERSATION_PROMPTS,
  CONVERSATION_THEMES,
  getPrompt,
  getThemeLabel,
  type ConversationThemeId,
} from "@/features/conversation-starter/conversation-prompts";

describe("Take It to the Table prompt bank", () => {
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

  it("resolves stable prompt and theme identifiers", () => {
    expect(getPrompt("connection-understood")?.theme).toBe("connection");
    expect(getThemeLabel("connection")).toBe("Connection and isolation");
    expect(getThemeLabel("across")).toBe("Across the film");
  });
});
