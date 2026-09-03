import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/take-it-to-the-table");
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
});

test("runs a complete 15-minute conversation without collecting responses", async ({ page }) => {
  const apiRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/")) apiRequests.push(request.url());
  });
  await expect(page.getByRole("heading", { name: /Take it to the table/i })).toBeVisible();
  await page.getByRole("button", { name: /15 minutes/i }).click();

  await expect(page.getByText("Question 1 of 4.")).toBeVisible();
  await page.getByRole("button", { name: "Go a little deeper" }).click();
  await expect(page.getByRole("button", { name: "Close the follow-up" })).toBeVisible();

  const firstQuestion = await page.locator("article h1").textContent();
  await page.getByRole("button", { name: /Pass · another question/i }).click();
  await expect(page.locator("article h1")).not.toHaveText(firstQuestion ?? "");

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Question 2 of 4.")).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByText("Question 1 of 4.")).toBeVisible();

  for (let index = 0; index < 4; index += 1) {
    await page.getByRole("button", { name: index === 3 ? "Finish conversation" : "Continue" }).click();
  }

  await expect(page.getByRole("heading", { name: "Which question will you carry with you?" })).toBeVisible();
  await expect(page.locator("input:not([readonly]), textarea")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Copy link to this tool" })).toBeVisible();
  expect(apiRequests).toEqual([]);
});

test("restores a session after refresh and can restart without retaining it", async ({ page }) => {
  await page.getByRole("button", { name: /30 minutes/i }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  const question = await page.locator("article h1").textContent();

  await page.reload();
  await expect(page.getByText("Question 2 of 5.")).toBeVisible();
  await expect(page.locator("article h1")).toHaveText(question ?? "");

  for (let index = 0; index < 4; index += 1) {
    await page.getByRole("button", { name: index === 3 ? "Finish conversation" : "Continue" }).click();
  }
  await page.getByRole("button", { name: "Start another conversation" }).click();
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
  await page.getByRole("button", { name: /15 minutes/i }).click();
  for (let index = 0; index < 4; index += 1) {
    await page.getByRole("button", { name: index === 3 ? "Finish conversation" : "Continue" }).click();
  }
  await page.getByRole("button", { name: "Copy link to this tool" }).click();
  await expect(page.getByText("Link copied. Invite someone to the table.")).toBeVisible();
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
  await page.getByRole("button", { name: /60 minutes/i }).click();
  await expect(page.locator("article")).toHaveCSS("animation-name", "none");
});
