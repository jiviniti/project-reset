import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const aggregateSnapshot = {
  apiVersion: "1",
  snapshotVersion: 1,
  revision: 4,
  generatedAt: "2026-08-25T12:00:00+00:00",
  scope: "cumulative",
  suppression: { minimumObservedCellSize: 5, applied: false },
  totals: { seeded: 4283, observed: 2, combined: 4285 },
  metrics: {
    emotions: [{ key: "exhausted", label: "Exhausted", seeded: 94, observed: 1, combined: 95, suppressed: false }],
    pathways: [{ key: "restore", label: "Restore", seeded: 71, observed: 1, combined: 72, suppressed: false }],
    practices: [{ key: "sleep", label: "Sleeping", seeded: 82, observed: 1, combined: 83, suppressed: false }],
  },
};

async function completeMinimalCheckIn(page: Page, slug = "preview-screening") {
  await page.goto(`/s/${slug}`);
  await page.getByRole("button", { name: "Contribute your RESET" }).click();
  await page.getByRole("button", { name: /Continue · 0 selected/ }).click();
  await page.getByRole("button", { name: /Continue · 0 selected/ }).click();
  await page.getByLabel("Name / initials (required)").fill("Guest");
  await page.getByLabel("Email (required)").fill("guest@example.org");
  await page.getByLabel(/I understand that my responses/).check();
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(page.getByRole("heading", { name: "My RESET card", exact: true })).toBeVisible();
}

function mockCompletedSubmission(page: Page) {
  return page.route("**/api/v1/submissions", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ submissionId: crypto.randomUUID(), participationId: crypto.randomUUID(), rewardDeliveryId: crypto.randomUUID(), status: "completed", replayed: false, entryPathway: "non_event", rewardType: "trailer_access", eventWindowStatus: "non_event", accessEndsAt: null }),
    });
  });
}

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/aggregates", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(aggregateSnapshot),
    });
  });
});

test("completes the preview check-in and reaches the persisted success state", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "canShare", { configurable: true, value: () => true });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (payload: ShareData) => {
        (window as typeof window & { __sharePayload?: unknown }).__sharePayload = {
          text: payload.text,
          hasUrlField: "url" in payload,
          fileCount: payload.files?.length ?? 0,
          fileName: payload.files?.[0]?.name,
          fileType: payload.files?.[0]?.type,
        };
      },
    });
  });
  await page.route("**/api/v1/submissions", async (route) => {
    const request = route.request();
    const payload = request.postDataJSON();
    expect(payload.screeningSlug).toBe("preview-event");
    expect(payload.consent.dataUseAccepted).toBe(true);
    expect(payload.communication.futureCommunicationsAllowed).toBe(false);
    expect(payload.answers.find((answer: { questionKey: string }) => answer.questionKey === "burnout_custom_tags")?.text).toBe("Doomscrolling   at 2 a.m.");
    expect(payload.answers.find((answer: { questionKey: string }) => answer.questionKey === "reset_custom_tags")?.text).toBe("Making ceramics");
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ submissionId: crypto.randomUUID(), participationId: crypto.randomUUID(), rewardDeliveryId: crypto.randomUUID(), status: "completed", replayed: false, entryPathway: "event", rewardType: "film_access", eventWindowStatus: "active_event", accessEndsAt: "2026-10-07T23:59:59.000Z" }),
    });
  });

  await page.goto("/s/preview-event");
  await page.getByRole("button", { name: "Contribute your RESET" }).click();
  await page.getByRole("button", { name: "Exhausted" }).click();
  await page.getByLabel("Add a burnout tag").fill("  Doomscrolling   at 2 a.m.  ");
  await page.getByRole("button", { name: /Add “Doomscrolling/ }).click();
  await page.getByRole("button", { name: /Continue · 2 selected/ }).click();
  await page.getByRole("button", { name: /Restore/ }).click();
  await expect(page.getByRole("button", { name: "Less social media", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sleeping", exact: true }).click();
  await page.getByLabel("Add a RESET tag").fill("Making ceramics");
  await page.getByRole("button", { name: /Add “Making ceramics”/ }).click();
  await page.getByRole("button", { name: /Continue · 2 selected/ }).click();
  await page.getByLabel("Name / initials (required)").fill("María-José-Alexandria");
  await page.getByLabel("Email (required)").fill("nivi@example.org");
  await expect(page.getByText("(Required)", { exact: true })).toBeVisible();
  await expect(page.getByText("(Optional)", { exact: true })).toBeVisible();
  await page.getByLabel(/I understand that my responses/).check();
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Thank you—your RESET has been added to the picture." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Film access is being prepared." })).toBeVisible();
  await expect(page.getByText("The burnout landscape", { exact: true })).toBeVisible();
  await expect(page.getByText("The community RESET map", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "My RESET card", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Every answer changes the picture." })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "The picture in numbers." })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Where we begin again." })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Take the Check-In" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Contribute your RESET/ })).toHaveCount(0);
  const sequence = await page.locator(".dashboard--post-submission .dashboard__section--dark, .dashboard--post-submission .dashboard__section--cream, .success__reward, .success__card-target").evaluateAll((elements) => elements.map((element) => element.className));
  expect(sequence).toEqual([
    "dashboard__section dashboard__section--dark",
    "dashboard__section dashboard__section--cream",
    "success__reward",
    "success__card-target",
  ]);
  await expect(page.locator("canvas").evaluate((canvas: HTMLCanvasElement) => [canvas.width, canvas.height])).resolves.toEqual([1080, 1350]);
  await page.locator("canvas").screenshot({ path: testInfo.outputPath("share-card.png") });
  await expect(page.getByRole("button", { name: "Save card to device" })).toBeVisible();
  await page.getByRole("button", { name: "Share with your network" }).click();
  await expect.poll(() => page.evaluate(() => (window as typeof window & { __sharePayload?: unknown }).__sharePayload)).toEqual({
    text: expect.stringContaining("Third Degree Burnout"),
    hasUrlField: false,
    fileCount: 1,
    fileName: "my-project-reset-card.png",
    fileType: "image/png",
  });
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save card to device" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("my-project-reset-card.png");
  await expect(page.getByText("Your card has downloaded.")).toBeVisible();
});

test("keeps the PNG download available when native file sharing is unsupported", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
  });
  await mockCompletedSubmission(page);
  await completeMinimalCheckIn(page);
  await page.getByRole("button", { name: "Share with your network" }).click();
  await expect(page.getByText("Sharing isn’t available here — download your card to post it.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save card to device" })).toBeVisible();
});

test("treats native share cancellation as non-destructive", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "canShare", { configurable: true, value: () => true });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async () => { throw new DOMException("cancelled", "AbortError"); },
    });
  });
  await mockCompletedSubmission(page);
  await completeMinimalCheckIn(page);
  await page.getByRole("button", { name: "Share with your network" }).click();
  await expect(page.getByText("Sharing cancelled. Your card is still ready to download.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save card to device" })).toBeVisible();
});

test("an expired event link becomes a trailer check-in", async ({ page }) => {
  await page.route("**/api/v1/submissions", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ submissionId: crypto.randomUUID(), participationId: crypto.randomUUID(), rewardDeliveryId: crypto.randomUUID(), status: "completed", replayed: false, entryPathway: "non_event", rewardType: "trailer_access", eventWindowStatus: "event_expired", accessEndsAt: null }),
    });
  });

  await page.goto("/s/preview-expired-event");
  await expect(page.getByText(/film-access window has ended/i)).toBeVisible();
  await expect(page.getByText(/trailer access after check-in/i)).toBeVisible();
  await page.getByRole("button", { name: "Contribute your RESET" }).click();
  await page.getByRole("button", { name: /Continue · 0 selected/ }).click();
  await page.getByRole("button", { name: /Continue · 0 selected/ }).click();
  await expect(page.getByRole("heading", { name: "Complete your check-in" })).toBeVisible();
  await page.getByLabel("Name / initials (required)").fill("Guest");
  await page.getByLabel("Email (required)").fill("guest@example.org");
  await page.getByLabel(/I understand that my responses/).check();
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Watch the trailer." })).toBeVisible();
  await expect(page.getByText(/event’s film-access window has ended/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /Watch the Trailer/ })).toHaveAttribute("href", "https://www.thirddegreeburnout.com/");
});

test("renders the cumulative community word map from the safe endpoint", async ({ page }) => {
  await page.goto("/s/preview-screening");
  await page.getByRole("button", { name: "Explore the Learning Lab" }).click();
  await expect(page.getByText(/observed check-ins added so far/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Take the Check-In" })).toBeVisible();
  await expect(page.getByLabel(/Exhausted: 95 combined/)).toBeVisible();
  await expect(page.locator("[data-revision='4']")).toBeVisible();
  await expect(page.getByText(/4,283 illustrative demo entries from the approved prototype/)).toBeVisible();
  await expect(page.getByText(/Free text, custom tags, participant identifiers, and demographics are never shown here/)).toBeVisible();
  const interfaceFont = await page.getByRole("heading", { name: "Every answer changes the picture." }).evaluate((element) => getComputedStyle(element).fontFamily.toLowerCase());
  const cloudFont = await page.getByLabel(/Exhausted: 95 combined/).evaluate((element) => ({ family: getComputedStyle(element).fontFamily.toLowerCase(), style: getComputedStyle(element).fontStyle }));
  expect(interfaceFont).toContain("poppins");
  expect(cloudFont.family.replaceAll("_", "")).toContain("ebgaramond");
  await page.getByRole("button", { name: "Take the Check-In" }).click();
  await expect(page.getByRole("heading", { name: "How does burnout show up for you?" })).toBeVisible();
});

test("shows the approved v2 practice language and hides the retired option", async ({ page }) => {
  await page.goto("/s/preview-screening");
  await page.getByRole("button", { name: "Contribute your RESET" }).click();
  await expect(page.getByRole("button", { name: "+ more ways it shows up" })).toBeVisible();
  await page.getByRole("button", { name: /Continue · 0 selected/ }).click();
  for (const pathway of ["Nourish", "Restore", "Move", "Connect", "Rebalance"]) {
    await page.getByRole("button", { name: new RegExp(`^${pathway}`) }).click();
  }
  for (const label of [
    "More plant-based foods", "More plant protein", "Home cooking", "Less ultra-processed foods",
    "Sleeping", "Less social media", "Strength training", "Dancing", "In-person meetings",
    "Setting boundaries", "Finding purpose",
  ]) {
    await expect(page.getByRole("button", { name: label, exact: true })).toBeVisible();
  }
  await expect(page.getByRole("button", { name: "Fruit & veg", exact: true })).toHaveCount(0);
});

test("publishes branded social metadata and a generic image", async ({ page, request }) => {
  await page.goto("/s/preview-screening");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "Project RESET · How do you reset?");
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  const imageUrl = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(imageUrl).toBeTruthy();
  const response = await request.get(new URL(imageUrl!, page.url()).toString());
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("image/png");
});
