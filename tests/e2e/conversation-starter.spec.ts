import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/take-it-to-the-table");
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
});

async function startConversation(page: import("@playwright/test").Page, theme: string, mode: string) {
  await page.getByRole("button", { name: new RegExp(theme, "i") }).click();
  await expect(page.getByText("You chose", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: new RegExp(theme, "i") })).toBeVisible();
  await page.getByRole("button", { name: new RegExp(mode, "i") }).click();
}

test("lets participants choose a film theme and completes a short conversation without collecting responses", async ({ page }) => {
  const apiRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/")) apiRequests.push(request.url());
  });
  await expect(page.getByRole("heading", { name: /Take it to the table/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What feels worth talking about?" })).toBeVisible();
  await expect(page.getByText(/minutes/)).toHaveCount(0);
  await startConversation(page, "Burnout beyond work", "A short conversation");

  await expect(page.locator("p").filter({ hasText: /^Question 1 of 3/ })).toBeVisible();
  await page.getByRole("button", { name: "Explore this a little further" }).click();
  await expect(page.getByRole("button", { name: "Hide the follow-up" })).toBeVisible();

  const firstQuestion = await page.locator("article h1").textContent();
  await page.getByRole("button", { name: "Try another question" }).click();
  await expect(page.locator("article h1")).not.toHaveText(firstQuestion ?? "");

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator("p").filter({ hasText: /^Question 2 of 3/ })).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.locator("p").filter({ hasText: /^Question 1 of 3/ })).toBeVisible();

  for (let index = 0; index < 3; index += 1) {
    await page.getByRole("button", { name: index === 2 ? "Finish conversation" : "Continue" }).click();
  }

  await expect(page.getByRole("heading", { name: "Which question would you like to keep thinking about?" })).toBeVisible();
  await expect(page.locator("input:not([readonly]), textarea")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Invite someone to a conversation" })).toBeVisible();
  expect(apiRequests).toEqual([]);
});

test("restores a session after refresh and can restart without retaining it", async ({ page }) => {
  await startConversation(page, "Food, memory, and care", "Go deeper");
  await page.getByRole("button", { name: "Continue" }).click();
  const question = await page.locator("article h1").textContent();

  await page.reload();
  await expect(page.locator("p").filter({ hasText: /^Question 2 of 5/ })).toBeVisible();
  await expect(page.locator("article h1")).toHaveText(question ?? "");

  for (let index = 0; index < 4; index += 1) {
    await page.getByRole("button", { name: index === 3 ? "Finish conversation" : "Continue" }).click();
  }
  await page.getByRole("button", { name: "Explore another topic" }).click();
  await expect(page.getByRole("heading", { name: /Take it to the table/i })).toBeVisible();
  await expect(page.evaluate(() => sessionStorage.length)).resolves.toBe(0);
});

test("is unlinked from the existing participant journey and marked noindex", async ({ page }) => {
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await page.goto("/s/preview-screening");
  await expect(page.locator('a[href="/take-it-to-the-table"]')).toHaveCount(0);
});

test("copies only the generic conversation-tool link", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (value: string) => sessionStorage.setItem("copied-test-link", value) },
    });
  });
  await page.goto("/take-it-to-the-table");
  await startConversation(page, "Living with climate feelings", "One question");
  await page.getByRole("button", { name: "Finish conversation" }).click();
  await page.getByRole("button", { name: "Invite someone to a conversation" }).click();
  await expect(page.getByText("Link copied. Paste it into a message to invite someone.")).toBeVisible();
  await expect(page.evaluate(() => sessionStorage.getItem("copied-test-link"))).resolves.toBe(
    "http://localhost:3000/take-it-to-the-table",
  );
});

test("fits responsive viewports and respects reduced motion", async ({ page }) => {
  for (const width of [390, 430, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/take-it-to-the-table");
    const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(sizes.scroll).toBeLessThanOrEqual(sizes.client);
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/take-it-to-the-table");
  await startConversation(page, "Across the film", "Go deeper");
  await expect(page.locator("article")).toHaveCSS("animation-name", "none");
});

test("makes the topic-to-depth relationship explicit without a distant-page selection state", async ({ page }) => {
  await page.getByRole("button", { name: /Choice and its limits/i }).click();
  await expect(page.getByText("You chose", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Choice and its limits" })).toBeFocused();
  await expect(page.getByRole("button", { name: /One question/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Change topic/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What feels worth talking about?" })).toHaveCount(0);

  await page.getByRole("button", { name: /Change topic/i }).click();
  await expect(page.getByRole("heading", { name: "What feels worth talking about?" })).toBeVisible();
});
