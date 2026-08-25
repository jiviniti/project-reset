import { expect, test } from "@playwright/test";

test("completes the preview check-in and reaches the persisted success state", async ({ page }) => {
  await page.route("**/api/v1/submissions", async (route) => {
    const request = route.request();
    const payload = request.postDataJSON();
    expect(payload.screeningSlug).toBe("preview-screening");
    expect(payload.consent.dataUseAccepted).toBe(true);
    expect(payload.communication.futureCommunicationsAllowed).toBe(false);
    expect(payload.answers.find((answer: { questionKey: string }) => answer.questionKey === "burnout_custom_tags")?.text).toBe("Doomscrolling   at 2 a.m.");
    expect(payload.answers.find((answer: { questionKey: string }) => answer.questionKey === "reset_custom_tags")?.text).toBe("Making ceramics");
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ submissionId: crypto.randomUUID(), participationId: crypto.randomUUID(), status: "completed", replayed: false }),
    });
  });

  await page.goto("/s/preview-screening");
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
  await page.getByLabel("First name").fill("María-José-Alexandria");
  await page.getByLabel("Email").fill("nivi@example.org");
  await page.getByLabel(/I understand that my responses/).check();
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Thank you." })).toBeVisible();
  await expect(page.getByText("Step 04 of 04")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Email delivery is being configured." })).toBeVisible();
  await expect(page.locator("canvas").evaluate((canvas: HTMLCanvasElement) => [canvas.width, canvas.height])).resolves.toEqual([1080, 1350]);
});

test("renders the cumulative community word map from the safe endpoint", async ({ page }) => {
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
  await page.getByRole("button", { name: "Explore the Learning Lab" }).click();
  await expect(page.getByText("2", { exact: true })).toBeVisible();
  await expect(page.getByLabel(/Exhausted: 95 combined/)).toBeVisible();
  await expect(page.locator("[data-revision='4']")).toBeVisible();
  await expect(page.getByText(/4,283 illustrative demo entries from the approved prototype/)).toBeVisible();
  await expect(page.getByText(/Free text, custom tags, participant identifiers, and demographics are never shown here/)).toBeVisible();
});
