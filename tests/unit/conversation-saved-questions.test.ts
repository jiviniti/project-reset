import { describe, expect, it } from "vitest";
import { savedQuestionsText, validatedPromptIds } from "@/features/conversation-starter/conversation-starter";

describe("conversation saved questions", () => {
  it("keeps valid IDs in selection order and removes duplicates", () => {
    expect(validatedPromptIds(["food-first-meal", "invalid", "connection-understood", "food-first-meal", 12])).toEqual([
      "food-first-meal",
      "connection-understood",
    ]);
  });

  it("formats a numbered plain-text list without participant data", () => {
    const text = savedQuestionsText(["food-first-meal", "connection-understood"]);
    expect(text).toContain("1. Food, memory, and care");
    expect(text).toContain("2. Connection and isolation");
    expect(text).toContain("What is the first meal you can remember");
    expect(text).not.toContain("email");
  });
});
