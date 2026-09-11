import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  getScreeningConfig,
  isTeamRehearsalAvailable,
  TEAM_REHEARSAL_CLOSES_AT,
} from "../../src/services/submissions/screenings";

const originalFixture = process.env.E2E_USE_TEST_FIXTURE;
const originalTestCode = process.env.KINEMA_TEST_CODE;

afterEach(() => {
  if (originalFixture === undefined) delete process.env.E2E_USE_TEST_FIXTURE;
  else process.env.E2E_USE_TEST_FIXTURE = originalFixture;
  if (originalTestCode === undefined) delete process.env.KINEMA_TEST_CODE;
  else process.env.KINEMA_TEST_CODE = originalTestCode;
});

describe("screening route availability", () => {
  it("fails the rehearsal route closed when its server-only code is absent", async () => {
    process.env.E2E_USE_TEST_FIXTURE = "true";
    delete process.env.KINEMA_TEST_CODE;
    await expect(getScreeningConfig("preview-event")).resolves.toBeNull();
  });

  it("serves the production-language rehearsal fixture when its code exists", async () => {
    process.env.E2E_USE_TEST_FIXTURE = "true";
    process.env.KINEMA_TEST_CODE = "TEAM_REHEARSAL_CODE";
    await expect(getScreeningConfig("preview-event")).resolves.toMatchObject({
      slug: "preview-event",
      name: "Project RESET Learning Lab",
      eventWindowStatus: "active_event",
      checkInClosesAt: "2026-09-22T04:00:00.000Z",
    });
  });

  it("closes the rehearsal route exactly at the New York cutoff", () => {
    process.env.KINEMA_TEST_CODE = "TEAM_REHEARSAL_CODE";
    expect(isTeamRehearsalAvailable(TEAM_REHEARSAL_CLOSES_AT - 1)).toBe(true);
    expect(isTeamRehearsalAvailable(TEAM_REHEARSAL_CLOSES_AT)).toBe(false);
  });

  it("keeps the other former preview routes retired", async () => {
    process.env.E2E_USE_TEST_FIXTURE = "true";
    process.env.KINEMA_TEST_CODE = "TEAM_REHEARSAL_CODE";
    await expect(getScreeningConfig("preview-screening")).resolves.toBeNull();
    await expect(getScreeningConfig("preview-expired-event")).resolves.toBeNull();
  });
});
