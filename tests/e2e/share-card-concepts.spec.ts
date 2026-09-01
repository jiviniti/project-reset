import { expect, test } from "@playwright/test";

test("renders every share-card direction at production dimensions", async ({ page }) => {
  await page.goto("/share-card-concepts");

  const canvases = page.locator("canvas[data-rendered='true']");
  await expect(canvases).toHaveCount(11);
  const conceptNames = await page.locator("article h2").allTextContents();
  expect(conceptNames.slice(0, 2)).toEqual(["Personal Scrapbook", "Poster Grid"]);

  const dimensions = await canvases.evaluateAll((elements) =>
    elements.map((element) => {
      const canvas = element as HTMLCanvasElement;
      return { height: canvas.height, width: canvas.width };
    }),
  );

  expect(dimensions).toEqual(Array.from({ length: 11 }, () => ({ height: 1350, width: 1080 })));
  await expect(page.getByRole("button", { name: "Download PNG" })).toHaveCount(11);

  const firstCanvas = canvases.first();
  const initialImage = await firstCanvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL("image/png"));

  await page.getByRole("button", { name: "Long name", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Name or initials" })).toHaveValue("Alexandria-Montgomery");
  await expect.poll(() => firstCanvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL("image/png"))).not.toBe(initialImage);

  await page.getByRole("button", { name: "Long entries", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Practice 3" })).toHaveValue("Making uninterrupted time for creative work");
  const longEntryExports = await canvases.evaluateAll((elements) =>
    elements.map((element) => (element as HTMLCanvasElement).toDataURL("image/png")),
  );
  expect(longEntryExports.every((image) => image.startsWith("data:image/png;base64,"))).toBe(true);

  await page.getByRole("button", { name: "Minimal", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Name or initials" })).toHaveValue("");
  await expect(page.getByRole("button", { pressed: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Nourish", exact: true }).click();
  await page.getByRole("button", { name: "Move", exact: true }).click();
  await page.getByRole("button", { name: "Restore", exact: true }).click();
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await page.getByRole("button", { name: "Rebalance", exact: true }).click();
  await expect(page.getByRole("button", { pressed: true })).toHaveCount(5);

  await page.getByRole("button", { name: "1 pathway", exact: true }).click();
  await expect(page.getByRole("button", { pressed: true })).toHaveCount(1);
  await page.getByRole("button", { name: "1 pathway + 1 practice", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Practice 1" })).toHaveValue("More plant protein");
  await expect(page.getByRole("textbox", { name: "Practice 2" })).toHaveValue("");
  await expect(page.getByRole("textbox", { name: "Practice 3" })).toHaveValue("");
  await page.getByRole("button", { name: "All 5 pathways", exact: true }).click();
  await expect(page.getByRole("button", { pressed: true })).toHaveCount(5);
});
