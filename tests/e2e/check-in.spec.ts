import { expect, test } from "@playwright/test";

test("completes the preview check-in and reaches the persisted success state", async ({ page }) => {
  await page.route("**/api/v1/submissions", async (route) => {
    const request = route.request();
    const payload = request.postDataJSON();
    expect(payload.screeningSlug).toBe("preview-screening");
    expect(payload.consent.dataUseAccepted).toBe(true);
    expect(payload.communication.futureCommunicationsAllowed).toBe(false);
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ submissionId: crypto.randomUUID(), participationId: crypto.randomUUID(), status: "completed", replayed: false }),
    });
  });

  await page.goto("/s/preview-screening");
  await page.getByRole("button", { name: "Contribute your RESET" }).click();
  await page.getByRole("button", { name: "Exhausted" }).click();
  await page.getByRole("button", { name: /Continue · 1 selected/ }).click();
  await page.getByRole("button", { name: /Restore/ }).click();
  await page.getByRole("button", { name: "Sleep", exact: true }).click();
  await page.getByRole("button", { name: /Continue · 1 practices/ }).click();
  await page.getByLabel("First name").fill("Nivi");
  await page.getByLabel("Email").fill("nivi@example.org");
  await page.getByLabel(/I understand that my responses/).check();
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Thank you." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Email delivery is being configured." })).toBeVisible();
});

test("renders the cumulative community bubbles from the safe endpoint", async ({ page }) => {
  await page.route("**/api/v1/aggregates", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
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
      }),
    });
  });

  await page.goto("/s/preview-screening");
  await page.getByRole("button", { name: "See what the community has shared" }).click();
  await expect(page.getByText("2", { exact: true })).toBeVisible();
  await expect(page.getByLabel(/Exhausted: 95 combined/)).toBeVisible();
  await expect(page.locator("[data-revision='4']")).toBeVisible();
  await expect(page.getByText(/illustrative prototype baseline of 4,283 entries/)).toBeVisible();
});
