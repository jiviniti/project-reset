import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/take-it-to-the-table");
});

test("starts with four featured themes and reveals the complete set", async ({ page }) => {
  await expect(page.getByRole("heading", { name: /Continue the conversation/i })).toBeVisible();
  await expect(page.getByText("Choose what feels relevant. You don’t need to have seen the film or have the answers.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Burnout beyond work/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Living with climate feelings/i })).toHaveCount(0);
  await page.getByRole("button", { name: "Show all 10 themes" }).click();
  await expect(page.getByRole("button", { name: /Living with climate feelings/i })).toBeVisible();
});

test("shows six browseable questions without collecting answers", async ({ page }) => {
  const apiRequests: string[] = [];
  page.on("request", (request) => { if (new URL(request.url()).pathname.startsWith("/api/")) apiRequests.push(request.url()); });
  await page.getByRole("button", { name: /Burnout beyond work/i }).click();
  await expect(page.getByRole("heading", { name: "Questions about Burnout beyond work" })).toBeFocused();
  await expect(page.locator("#question-library article")).toHaveCount(6);
  await expect(page.locator("input:not([readonly]), textarea")).toHaveCount(0);
  const firstCard = page.locator("#question-library article").first();
  await firstCard.getByRole("button", { name: "Go a little deeper" }).click();
  await expect(firstCard.getByText("Consider this too")).toBeVisible();
  expect(apiRequests).toEqual([]);
});

test("saves, removes and restores multiple questions across themes", async ({ page }) => {
  await page.getByRole("button", { name: /Food, memory, and care/i }).click();
  const foodCards = page.locator("#question-library article");
  await foodCards.nth(0).getByRole("button", { name: "Save this question." }).click();
  await foodCards.nth(1).getByRole("button", { name: "Save this question." }).click();
  await page.getByRole("button", { name: "Choose another theme" }).click();
  await page.getByRole("button", { name: /Connection and isolation/i }).click();
  await page.locator("#question-library article").nth(0).getByRole("button", { name: "Save this question." }).click();
  await expect(page.getByRole("button", { name: "3 questions saved" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "3 questions saved" })).toBeVisible();
  await page.getByRole("button", { name: "3 questions saved" }).click();
  await expect(page.locator("#saved-questions li")).toHaveCount(3);
  await page.locator("#saved-questions li").nth(1).getByRole("button", { name: "Remove" }).click();
  await expect(page.locator("#saved-questions li")).toHaveCount(2);
});

test("copies, downloads and clears the saved list", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (value: string) => sessionStorage.setItem("copied-questions", value) } });
  });
  await page.goto("/take-it-to-the-table?theme=food&question=food-first-meal");
  await page.getByRole("button", { name: "1 question saved" }).click();
  await page.getByRole("button", { name: "Copy my questions" }).click();
  const copied = await page.evaluate(() => sessionStorage.getItem("copied-questions"));
  expect(copied).toContain("1. Food, memory, and care");
  expect(copied).toContain("What is the first meal you can remember");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download a share card" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("project-reset-saved-questions.png");
  await page.getByRole("button", { name: "Clear saved questions" }).click();
  await page.getByRole("button", { name: "Yes, clear all" }).click();
  await expect(page.getByRole("button", { name: /question saved/ })).toHaveCount(0);
});

test("valid deep links add a question while invalid stored IDs are discarded", async ({ page }) => {
  await page.evaluate(() => localStorage.setItem("project-reset:conversation-saved:v1", JSON.stringify(["not-real", "food-first-meal"])));
  await page.goto("/take-it-to-the-table?theme=connection&question=connection-understood");
  await expect(page.getByRole("heading", { name: "Questions about Connection and isolation" })).toBeVisible();
  await expect(page.getByRole("button", { name: "2 questions saved" })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("project-reset:conversation-saved:v1") ?? "[]"))).toEqual(["food-first-meal", "connection-understood"]);
});

test("is noindex, uses legal safety copy and fits responsive viewports", async ({ page }) => {
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByText(/For educational purposes only; not therapy/)).toBeVisible();
  for (const width of [390, 430, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/take-it-to-the-table?theme=access");
    const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(sizes.scroll).toBeLessThanOrEqual(sizes.client);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/take-it-to-the-table?theme=access");
  const duration = await page.locator("article").first().evaluate((element) => parseFloat(getComputedStyle(element).transitionDuration));
  expect(duration).toBeLessThanOrEqual(0.00001);
});
