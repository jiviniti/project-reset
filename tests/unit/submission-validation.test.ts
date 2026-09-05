import { describe, expect, it } from "vitest";
import { normalizeEmail, submissionResultSchema, submissionSchema } from "../../src/lib/validation/submission";

const validPayload = {
  apiVersion: "1",
  idempotencyKey: "b7de8ec9-842c-4663-88e0-9d3677df8709",
  screeningSlug: "preview-screening",
  participant: { firstName: "Nivi", email: "nivi@example.org" },
  demographics: {},
  consent: { dataUseAccepted: true, policyVersion: "reset_data_use_v1" },
  communication: { futureCommunicationsAllowed: false },
  answers: [{ questionKey: "burnout_signs", optionKeys: ["exhausted"] }],
};

describe("submission validation", () => {
  it("accepts the versioned payload", () => {
    expect(submissionSchema.parse(validPayload).participant.email).toBe("nivi@example.org");
  });

  it("requires explicit data-use acceptance", () => {
    expect(() => submissionSchema.parse({ ...validPayload, consent: { ...validPayload.consent, dataUseAccepted: false } })).toThrow();
  });

  it("requires name and a valid email", () => {
    expect(() => submissionSchema.parse({ ...validPayload, participant: { firstName: "", email: "invalid" } })).toThrow();
  });

  it("permits exactly one answer representation", () => {
    expect(() => submissionSchema.parse({ ...validPayload, answers: [{ questionKey: "burnout_signs", optionKeys: [], text: "both" }] })).toThrow();
  });

  it("limits the private commitment response to 500 characters", () => {
    expect(() => submissionSchema.parse({
      ...validPayload,
      answers: [{ questionKey: "today_commitment", text: "x".repeat(501) }],
    })).toThrow();
  });
});

describe("email normalization", () => {
  it("only trims and lowercases", () => {
    expect(normalizeEmail("  First.Last+RESET@Gmail.COM ")).toBe("first.last+reset@gmail.com");
  });
});

describe("submission result validation", () => {
  const baseResult = {
    submissionId: "b7de8ec9-842c-4663-88e0-9d3677df8709",
    participationId: "7093318a-7bb0-4de4-aee0-1ff0b5cd3605",
    status: "completed" as const,
    replayed: false,
  };

  it("keeps legacy server responses compatible during migration rollout", () => {
    expect(submissionResultSchema.parse(baseResult)).toMatchObject({
      entryPathway: "event",
      rewardType: "film_access",
      eventWindowStatus: "active_event",
    });
  });

  it("accepts an expired event resolved to trailer access", () => {
    expect(submissionResultSchema.parse({
      ...baseResult,
      entryPathway: "non_event",
      rewardType: "trailer_access",
      eventWindowStatus: "event_expired",
      accessEndsAt: null,
    }).rewardType).toBe("trailer_access");
  });

  it("accepts an allowlisted KINEMA access payload", () => {
    const parsed = submissionResultSchema.parse({
      ...baseResult,
      rewardAccess: {
        provider: "kinema",
        filmUrl: "https://kinema.com/films/private-film",
        promoCode: "EVENT_CODE",
        accountRequired: true,
        startWithinDays: 30,
        finishWithinHours: 48,
      },
    });
    expect(parsed.rewardAccess?.promoCode).toBe("EVENT_CODE");
  });
});
