import { expect, test } from "./fixtures";

const HOSTILE_COMMITMENT = `Call a friend <img src=x onerror="window.__xss=true">'; drop table participants; --`;

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

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/aggregates", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(aggregateSnapshot),
    });
  });
});

test("opens the general check-in directly from the site root", async ({ page }) => {
  const response = await page.goto("/");

  await expect(page).toHaveURL(/\/$/);
  expect(response?.headers()["content-security-policy"]).toContain("'strict-dynamic'");
  expect(response?.headers()["x-frame-options"]).toBe("DENY");
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  await expect(page.getByRole("heading", { name: "How do you reset?" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start your RESET" })).toBeVisible();
  await expect(page.getByText("Every screening has its own RESET link.")).toHaveCount(0);
});

test("submits the site root against the canonical project-reset screening", async ({ page }) => {
  await page.route("**/api/v1/submissions", async (route) => {
    const payload = route.request().postDataJSON();
    expect(payload.screeningSlug).toBe("project-reset");
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        submissionId: crypto.randomUUID(),
        participationId: crypto.randomUUID(),
        rewardDeliveryId: crypto.randomUUID(),
        status: "completed",
        replayed: false,
        entryPathway: "non_event",
        rewardType: "trailer_access",
        eventWindowStatus: "non_event",
        accessEndsAt: null,
      }),
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Start your RESET" }).click();
  await page.getByRole("button", { name: /Continue · 0 selected/ }).click();
  await page.getByRole("button", { name: /Continue · 0 selected/ }).click();
  await page.getByLabel("Name or initials").fill("Guest");
  await page.getByLabel("Email (required)").fill("guest@example.org");
  await page.getByLabel(/I understand that my responses/).check();
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Watch the trailer." })).toBeVisible();
});

test("completes a production event check-in and keeps film access recoverable", async ({ page }) => {
  await page.addInitScript(() => {
    (window as typeof window & { __xss?: boolean }).__xss = false;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (value: string) => { (window as typeof window & { __copied?: string }).__copied = value; } },
    });
  });
  await page.route("**/api/v1/submissions", async (route) => {
    const request = route.request();
    const payload = request.postDataJSON();
    expect(payload.screeningSlug).toBe("climate-week-nyc-2026");
    expect(payload.consent.dataUseAccepted).toBe(true);
    expect(payload.communication.futureCommunicationsAllowed).toBe(false);
    expect(payload.answers.find((answer: { questionKey: string }) => answer.questionKey === "burnout_custom_tags")?.text).toBe("Doomscrolling   at 2 a.m.");
    expect(payload.answers.find((answer: { questionKey: string }) => answer.questionKey === "burnout_note")).toBeUndefined();
    expect(payload.answers.find((answer: { questionKey: string }) => answer.questionKey === "reset_custom_tags")?.text).toBe("Making ceramics");
    expect(payload.answers.find((answer: { questionKey: string }) => answer.questionKey === "today_commitment")?.text).toBe(HOSTILE_COMMITMENT);
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ submissionId: crypto.randomUUID(), participationId: crypto.randomUUID(), rewardDeliveryId: crypto.randomUUID(), status: "completed", replayed: false, entryPathway: "event", rewardType: "film_access", eventWindowStatus: "active_event", accessEndsAt: "2026-10-07T04:00:00.000Z", rewardAccess: { provider: "kinema", filmUrl: "https://kinema.com/films/third-degree-burnout-a-survivors-guide-1mdwu9", promoCode: "EVENT_CODE", accountRequired: true, startWithinDays: 30, finishWithinHours: 48 } }),
    });
  });

  await page.goto("/s/climate-week-nyc-2026");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "How do you reset?" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Support the project" })).toHaveAttribute("href", "https://thirddegreeburnout.com/fueltheimpact");
  await expect(page.locator("h1 .branded-reset b")).toHaveCSS("color", "rgb(250, 135, 87)");
  await expect(page.getByRole("button", { name: "Start your RESET" }).locator(".branded-reset b")).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(page.getByText("About 90 seconds · Public results are anonymous · Film access follows")).toBeVisible();
  await page.getByRole("button", { name: "Start your RESET" }).click();
  await page.getByRole("button", { name: "Exhausted" }).click();
  await expect(page.getByLabel("Add a burnout tag")).toHaveCount(0);
  await page.getByRole("button", { name: /Something else.*Add your own/ }).click();
  await page.getByLabel("Add a burnout tag").fill("  Doomscrolling   at 2 a.m.  ");
  await page.getByRole("button", { name: /Add “Doomscrolling/ }).click();
  await page.getByRole("button", { name: /Continue · 2 selected/ }).click();
  await page.getByRole("button", { name: /Restore/ }).click();
  await expect(page.getByRole("button", { name: "Less social media", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sleeping", exact: true }).click();
  await expect(page.getByLabel("Add a RESET tag")).toHaveCount(0);
  await page.getByRole("button", { name: /Something else.*Add your own/ }).click();
  await page.getByLabel("Add a RESET tag").fill("Making ceramics");
  await page.getByRole("button", { name: /Add “Making ceramics”/ }).click();
  await page.getByRole("button", { name: /Continue · 2 selected/ }).click();
  await page.getByLabel("Name or initials").fill("María-José-Alexandria");
  await page.getByLabel("Email (required)").fill("nivi@example.org");
  await page.getByLabel(/What is one thing you will do today/).fill(HOSTILE_COMMITMENT);
  await expect(page.getByText("(Required)", { exact: true })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "(Required) I understand that my responses will be securely stored and may be used for Project RESET research. Anything shared publicly will be de-identified or combined with other responses.", exact: true })).toBeVisible();
  await expect(page.getByText("Optional:", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Support the project" })).toHaveAttribute("href", "https://thirddegreeburnout.com/fueltheimpact");
  await page.getByLabel(/I understand that my responses/).check();
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  const savingButton = page.getByRole("button", { name: /Saving your RESET/ });
  await expect(savingButton).toBeVisible();
  await expect(savingButton.locator(".branded-reset b")).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(page.getByRole("heading", { name: "Thank you. Your RESET has been added to the picture." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your film access" })).toBeVisible();
  await expect(page.getByText("Your film code awaits below.", { exact: true })).toBeVisible();
  await expect(page.getByText("Your code and private film link belong together. Copy the details or take a screenshot before opening KINEMA.", { exact: true })).toBeVisible();
  await expect(page.locator(".reward-steps li")).toHaveText([
    "Copy or screenshot your code and private film link",
    "Open the private film page and select the purple rental button",
    "Sign in or create a KINEMA account. If KINEMA takes you elsewhere after sign-up, return to the private film page",
    "At checkout, select Promo Code, enter your code, confirm the total is $0, and complete the rental",
  ]);
  await expect(page.getByText("Keep your access close", { exact: true })).toBeVisible();
  await expect(page.getByText(/Redeem this code by/)).toBeVisible();
  await expect(page.getByText(/Project RESET does not email this code/)).toBeVisible();
  await expect(page.getByText("KINEMA opens in a new tab. Keep this RESET page open so you can return and continue the conversation.", { exact: true })).toBeVisible();
  await expect(page.getByText(/30 days to begin watching and 48 hours to finish/)).toBeVisible();
  await expect(page.getByRole("link", { name: "https://kinema.com/films/third-degree-burnout-a-survivors-guide-1mdwu9" })).toBeVisible();
  await expect(page.getByText(HOSTILE_COMMITMENT)).toBeVisible();
  expect(await page.evaluate(() => (window as typeof window & { __xss?: boolean }).__xss)).toBe(false);
  await expect(page.locator("img[onerror]")).toHaveCount(0);
  await expect(page.getByText("The burnout landscape", { exact: true })).toBeVisible();
  await expect(page.getByText("The community RESET map", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Continue the conversation.", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Every answer changes the picture." })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "The picture in numbers." })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Where we begin again." })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Take the Check-In" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Start your RESET/ })).toHaveCount(0);
  const sequence = await page.locator(".dashboard--post-submission .dashboard__section--dark, .dashboard--post-submission .dashboard__section--light, .success__reward, .success__conversation").evaluateAll((elements) => elements.map((element) => element.className));
  expect(sequence).toEqual([
    "dashboard__section dashboard__section--dark",
    "dashboard__section dashboard__section--light",
    "success__reward",
    "success__conversation",
  ]);
  await expect(page.locator(".success > .pathway-strip")).toHaveCount(1);
  await page.getByRole("button", { name: "Copy code" }).click();
  await expect.poll(() => page.evaluate(() => (window as typeof window & { __copied?: string }).__copied)).toBe("EVENT_CODE");
  await page.getByRole("button", { name: "Copy my access details" }).click();
  await expect.poll(() => page.evaluate(() => (window as typeof window & { __copied?: string }).__copied)).toContain("confirm the total is $0");
  await expect.poll(() => page.evaluate(() => (window as typeof window & { __copied?: string }).__copied)).toContain("Redeem by:");
  await expect(page.getByRole("link", { name: /Open the private film page/ })).toHaveAttribute("href", "https://kinema.com/films/third-degree-burnout-a-survivors-guide-1mdwu9");
  await expect(page.getByRole("link", { name: /Open the private film page/ })).toHaveAttribute("target", "_blank");
  await expect(page.getByRole("link", { name: /Open the private film page/ })).toHaveAttribute("rel", "noopener noreferrer");
  await expect(page.getByRole("link", { name: /Start a conversation/ })).toHaveAttribute("href", "/start-a-conversation");
  await expect(page.getByRole("link", { name: /Start a conversation/ })).toHaveAttribute("target", "_blank");
  await expect(page.getByRole("link", { name: /Start a conversation/ })).toHaveAttribute("rel", "noopener noreferrer");
  await expect(page.getByRole("link", { name: "Support the project" })).toHaveAttribute("href", "https://thirddegreeburnout.com/fueltheimpact");
  const mobileWidths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(mobileWidths.scroll).toBeLessThanOrEqual(mobileWidths.client);
  await page.setViewportSize({ width: 430, height: 932 });
  const largeMobileWidths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(largeMobileWidths.scroll).toBeLessThanOrEqual(largeMobileWidths.client);
});

test("an upcoming event link remains a trailer check-in before opening", async ({ page }) => {
  await page.route("**/api/v1/submissions", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ submissionId: crypto.randomUUID(), participationId: crypto.randomUUID(), rewardDeliveryId: crypto.randomUUID(), status: "completed", replayed: false, entryPathway: "event", rewardType: "trailer_access", eventWindowStatus: "event_not_started", accessEndsAt: null }),
    });
  });

  await page.goto("/s/columbia-climate-school-2026");
  await expect(page.getByText("About 90 seconds · Public results are anonymous · Trailer access follows")).toBeVisible();
  await expect(page.getByText(/film access for this event is not active yet/i)).toBeVisible();
  await page.getByRole("button", { name: "Start your RESET" }).click();
  await page.getByRole("button", { name: /Continue · 0 selected/ }).click();
  await page.getByRole("button", { name: /Continue · 0 selected/ }).click();
  await expect(page.getByRole("heading", { name: "Complete your check-in" })).toBeVisible();
  await page.getByLabel("Name or initials").fill("Guest");
  await page.getByLabel("Email (required)").fill("guest@example.org");
  await page.getByLabel(/I understand that my responses/).check();
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Watch the trailer." })).toBeVisible();
  await expect(page.getByRole("link", { name: /Watch the Trailer/ })).toHaveAttribute("href", "https://www.thirddegreeburnout.com/");
});

test("renders the cumulative community word map from the safe endpoint", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explore the Learning Lab" }).click();
  await expect(page.getByText(/observed check-ins added so far/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Take the Check-In" })).toBeVisible();
  await expect(page.getByLabel(/Exhausted: 1 check-in/)).toBeVisible();
  await expect(page.locator("[data-revision='4']")).toBeVisible();
  await expect(page.getByText("check-ins shared", { exact: true })).toBeVisible();
  await expect(page.getByText(/\b(?:illustrative|demo|preview)\b/i)).toHaveCount(0);
  const interfaceFont = await page.getByRole("heading", { name: "Every answer changes the picture." }).evaluate((element) => getComputedStyle(element).fontFamily.toLowerCase());
  const cloudFont = await page.getByLabel(/Exhausted: 1 check-in/).evaluate((element) => ({ family: getComputedStyle(element).fontFamily.toLowerCase(), style: getComputedStyle(element).fontStyle }));
  expect(interfaceFont).toContain("poppins");
  expect(cloudFont.family.replaceAll("_", "")).toContain("ebgaramond");
  await page.getByRole("button", { name: "Take the Check-In" }).click();
  await expect(page.getByRole("heading", { name: "How does burnout show up for you?" })).toBeVisible();
});

test("shows the approved v2 practice language and hides the retired option", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start your RESET" }).click();
  await expect(page.getByRole("button", { name: "Show more options" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Compassion fatigue", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Show more options" }).click();
  await expect(page.getByRole("button", { name: "Compassion fatigue", exact: true })).toBeVisible();
  await expect(page.getByLabel("Add a burnout tag")).toHaveCount(0);
  await page.getByRole("button", { name: /Something else.*Add your own/ }).click();
  await expect(page.getByLabel("Add a burnout tag")).toBeVisible();
  await page.getByRole("button", { name: /Something else.*Close/ }).click();
  await expect(page.getByLabel("Add a burnout tag")).toHaveCount(0);
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
  for (const pathway of ["Nourish", "Restore", "Move", "Connect", "Rebalance"]) {
    await expect(page.getByRole("button", { name: new RegExp(`^${pathway}`) })).toHaveAttribute("aria-pressed", "true");
  }
  await expect(page.getByText("Nourish: what helps?", { exact: true })).toBeVisible();
  await expect(page.getByText("food, water, nature.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Fruit & veg", exact: true })).toHaveCount(0);
});

test("publishes branded social metadata and a generic image", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "Project RESET · How do you reset?");
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  const imageUrl = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(imageUrl).toBeTruthy();
  const response = await request.get(new URL(imageUrl!, page.url()).toString());
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("image/png");
});

test("shows intentional Learning Lab empty states", async ({ page }) => {
  await page.route("**/api/v1/aggregates", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ...aggregateSnapshot,
        totals: { seeded: 4283, observed: 0, combined: 4283 },
        metrics: {
          emotions: aggregateSnapshot.metrics.emotions.map((metric) => ({ ...metric, observed: 0, combined: metric.seeded })),
          pathways: aggregateSnapshot.metrics.pathways.map((metric) => ({ ...metric, observed: 0, combined: metric.seeded })),
          practices: aggregateSnapshot.metrics.practices.map((metric) => ({ ...metric, observed: 0, combined: metric.seeded })),
        },
      }),
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Explore the Learning Lab" }).click();
  await expect(page.getByText("The picture starts with what we choose to share.", { exact: true })).toBeVisible();
  await expect(page.getByText("Every RESET shared here will help this map grow.", { exact: true })).toBeVisible();
  await expect(page.getByText(/\b(?:illustrative|demo|preview)\b/i)).toHaveCount(0);
});

test("retires preview and concept routes", async ({ page }) => {
  for (const path of [
    "/s/preview-screening",
    "/s/preview-event",
    "/s/preview-expired-event",
    "/share-card-concepts",
  ]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(404);
  }
});
