import { expect, test } from "@playwright/test";

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
    practices: [{ key: "sleep", label: "Sleep", seeded: 82, observed: 1, combined: 83, suppressed: false }],
  },
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/aggregates", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(aggregateSnapshot),
    });
  });
});

test("completes the preview check-in and reaches the persisted success state", async ({ page }) => {
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
  await page.getByRole("button", { name: "Sleep", exact: true }).click();
  await page.getByLabel("Add a RESET tag").fill("Making ceramics");
  await page.getByRole("button", { name: /Add “Making ceramics”/ }).click();
  await page.getByRole("button", { name: /Continue · 2 selected/ }).click();
  await page.getByLabel("Name / initials (required)").fill("María-José-Alexandria");
  await page.getByLabel("Email (required)").fill("nivi@example.org");
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
  await page.getByRole("button", { name: "Take the Check-In" }).click();
  await expect(page.getByRole("heading", { name: "How does burnout show up for you?" })).toBeVisible();
});
