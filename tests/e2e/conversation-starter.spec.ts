import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/take-it-to-the-table");
});

test("starts with four featured themes and reveals the complete set", async ({ page }) => {
  await expect(page.getByRole("heading", { name: /Take it to the table/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Burnout beyond work/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Food, memory, and care/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Choice and its limits/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Connection and isolation/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Living with climate feelings/i })).toHaveCount(0);

  await page.getByRole("button", { name: "Show all 10 themes" }).click();
  await expect(page.getByRole("button", { name: /Living with climate feelings/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Show the four featured themes" })).toBeVisible();
});

test("shows all six questions in a selected theme without collecting answers", async ({ page }) => {
  const apiRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/")) apiRequests.push(request.url());
  });

  await page.getByRole("button", { name: /Burnout beyond work/i }).click();
  await expect(page.getByRole("heading", { name: "Questions about Burnout beyond work" })).toBeFocused();
  await expect(page.locator("article")).toHaveCount(6);
  await expect(page.locator("input:not([readonly]), textarea")).toHaveCount(0);
  await expect(page.getByText(/Question 1 of/)).toHaveCount(0);

  const firstCard = page.locator("article").first();
  await firstCard.getByRole("button", { name: "Go a little deeper" }).click();
  await expect(firstCard.getByText("Consider this too")).toBeVisible();
  await firstCard.getByRole("button", { name: "Close the deeper prompt" }).click();
  await expect(firstCard.getByText("Consider this too")).toHaveCount(0);
  expect(apiRequests).toEqual([]);
});

test("carries and shares an exact question using only stable URL identifiers", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (value: string) => sessionStorage.setItem("copied-test-link", value) },
    });
  });
  await page.goto("/take-it-to-the-table");
  await page.getByRole("button", { name: /Food, memory, and care/i }).click();
  const firstCard = page.locator("article").first();
  await firstCard.getByRole("button", { name: "Carry this question forward" }).click();
  await expect(page.getByRole("heading", { name: "You found a question worth keeping open." })).toBeVisible();
  await page.getByRole("button", { name: "Share this conversation" }).click();
  await expect(page.getByText("Link copied. Paste it into a message to invite someone.")).toBeVisible();

  const copied = await page.evaluate(() => sessionStorage.getItem("copied-test-link"));
  expect(copied).toContain("/take-it-to-the-table?theme=food&question=food-first-meal");
  expect(copied).not.toContain("answer=");
});

test("restores a valid theme and question from a deep link", async ({ page }) => {
  await page.goto("/take-it-to-the-table?theme=connection&question=connection-understood");
  await expect(page.getByRole("heading", { name: "Questions about Connection and isolation" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "You found a question worth keeping open." })).toBeVisible();
  await expect(page.getByRole("blockquote")).toHaveText("What do you wish someone close to you understood about what you carry?");
});

test("offers an explicitly described mixed collection", async ({ page }) => {
  await page.getByRole("button", { name: /Not sure where to begin/ }).click();
  await expect(page.getByRole("heading", { name: "Questions about Across the film" })).toBeVisible();
  await expect(page.locator("article")).toHaveCount(6);
});

test("is noindex during review and fits responsive viewports", async ({ page }) => {
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  for (const width of [390, 430, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/take-it-to-the-table?theme=access");
    const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(sizes.scroll).toBeLessThanOrEqual(sizes.client);
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/take-it-to-the-table?theme=access");
  await page.locator("article").first().getByRole("button", { name: "Carry this question forward" }).click();
  const reducedDuration = await page.locator("article").first().evaluate((element) => parseFloat(getComputedStyle(element).transitionDuration));
  expect(reducedDuration).toBeLessThanOrEqual(0.00001);
});
