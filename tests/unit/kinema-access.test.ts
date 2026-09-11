import { describe, expect, it } from "vitest";
import type { ServerEnv } from "../../src/lib/config/server-env";
import { resolveKinemaRewardAccess } from "../../src/services/rewards/kinema-access";
import type { SubmissionResult } from "../../src/types/pathway";

const env: ServerEnv = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SECRET_KEY: "sb_secret_test",
  ALLOWED_APP_ORIGINS: "",
  SUBMISSIONS_ENABLED: "true",
  REWARD_PROVIDER: "kinema_manual",
  KINEMA_FILM_URL: "https://kinema.com/films/third-degree-burnout-a-survivors-guide-1mdwu9",
  KINEMA_TEST_CODE: "TEAM_REHEARSAL_CODE",
  KINEMA_CLIMATE_WEEK_NYC_2026_CODE: "CLIMATE_CODE",
  KINEMA_COLUMBIA_CLIMATE_SCHOOL_2026_CODE: "COLUMBIA_CODE",
};

const activeEvent: SubmissionResult = {
  submissionId: "b7de8ec9-842c-4663-88e0-9d3677df8709",
  participationId: "7093318a-7bb0-4de4-aee0-1ff0b5cd3605",
  rewardDeliveryId: "57bdf06d-b900-4726-88fa-8cf3b23684b7",
  status: "completed",
  replayed: false,
  entryPathway: "event",
  rewardType: "film_access",
  eventWindowStatus: "active_event",
  accessEndsAt: null,
};

describe("KINEMA manual reward access", () => {
  it("maps each approved event slug to its server-only code", () => {
    expect(resolveKinemaRewardAccess("preview-event", activeEvent, env)?.promoCode).toBe("TEAM_REHEARSAL_CODE");
    expect(resolveKinemaRewardAccess("climate-week-nyc-2026", activeEvent, env)?.promoCode).toBe("CLIMATE_CODE");
    expect(resolveKinemaRewardAccess("columbia-climate-school-2026", activeEvent, env)?.promoCode).toBe("COLUMBIA_CODE");
  });

  it("never exposes a production code for an unapproved screening slug", () => {
    expect(resolveKinemaRewardAccess("project-reset", activeEvent, env)).toBeUndefined();
    expect(resolveKinemaRewardAccess("lookalike-climate-week", activeEvent, env)).toBeUndefined();
  });

  it("fails closed when the rehearsal code is absent", () => {
    expect(resolveKinemaRewardAccess("preview-event", activeEvent, { ...env, KINEMA_TEST_CODE: undefined })).toBeUndefined();
  });

  it("does not expose access for trailer pathways or disabled delivery", () => {
    expect(resolveKinemaRewardAccess("climate-week-nyc-2026", { ...activeEvent, entryPathway: "non_event", rewardType: "trailer_access", eventWindowStatus: "event_expired" }, env)).toBeUndefined();
    expect(resolveKinemaRewardAccess("climate-week-nyc-2026", activeEvent, { ...env, REWARD_PROVIDER: "disabled" })).toBeUndefined();
  });

  it("fails closed when an eligible event is missing provider configuration", () => {
    expect(() => resolveKinemaRewardAccess("climate-week-nyc-2026", activeEvent, { ...env, KINEMA_FILM_URL: undefined })).toThrow("kinema_reward_not_configured");
  });

  it("uses the permanent private film URL for both approved events", () => {
    expect(resolveKinemaRewardAccess("climate-week-nyc-2026", activeEvent, env)?.filmUrl)
      .toBe("https://kinema.com/films/third-degree-burnout-a-survivors-guide-1mdwu9");
    expect(resolveKinemaRewardAccess("columbia-climate-school-2026", activeEvent, env)?.filmUrl)
      .toBe("https://kinema.com/films/third-degree-burnout-a-survivors-guide-1mdwu9");
  });
});
