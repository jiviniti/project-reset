import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rateLimited: false,
}));

vi.mock("@/lib/config/server-env", () => ({
  getServerEnv: () => ({
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SECRET_KEY: "sb_secret_test",
    ALLOWED_APP_ORIGINS: "",
    SUBMISSIONS_ENABLED: "true",
    REWARD_PROVIDER: "disabled",
    DATASET_ENV: "preview",
  }),
}));

vi.mock("@/lib/security/rate-limit", () => ({
  isSubmissionRateLimited: async () => mocks.rateLimited,
}));

vi.mock("@/services/submissions/screenings", () => ({
  getScreeningConfig: vi.fn(),
}));

vi.mock("@/services/submissions/submit", () => ({
  persistSubmission: vi.fn(),
  SubmissionDatabaseError: class SubmissionDatabaseError extends Error {},
}));

vi.mock("@/services/rewards/kinema-access", () => ({
  resolveKinemaRewardAccess: vi.fn(),
}));

import { POST } from "../../src/app/api/v1/submissions/route";

function submissionRequest(body: BodyInit, headers: Record<string, string> = {}) {
  return new Request("https://reset.example/api/v1/submissions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://reset.example",
      "sec-fetch-site": "same-origin",
      ...headers,
    },
    body,
  });
}

describe("submission route security failures", () => {
  beforeEach(() => {
    mocks.rateLimited = false;
  });

  it("returns 429 before parsing a rate-limited request", async () => {
    mocks.rateLimited = true;
    const response = await POST(submissionRequest("not-json"));
    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({ error: "rate_limited" });
  });

  it("rejects cross-origin requests", async () => {
    const response = await POST(submissionRequest("{}", {
      origin: "https://attacker.example",
      "sec-fetch-site": "cross-site",
    }));
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ error: "origin_rejected" });
  });

  it("rejects malformed JSON", async () => {
    const response = await POST(submissionRequest('{"unfinished":'));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: "invalid_json" });
  });

  it("rejects oversized bodies", async () => {
    const response = await POST(submissionRequest("{}", { "content-length": "32769" }));
    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({ error: "request_too_large" });
  });
});
