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
  await page.getByLabel("First name").fill("Nivi");
  await page.getByLabel("Email").fill("nivi@example.org");
  await page.getByLabel(/I understand that my responses/).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Exhausted" }).click();
  await page.getByRole("button", { name: /Continue · 1 selected/ }).click();
  await page.getByRole("button", { name: /Restore/ }).click();
  await page.getByRole("button", { name: "Sleep", exact: true }).click();
  await page.getByRole("button", { name: /Finish · 1 practices/ }).click();
  await expect(page.getByRole("heading", { name: "Thank you." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Email delivery is being configured." })).toBeVisible();
});
