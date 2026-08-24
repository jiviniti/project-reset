import { describe, expect, it } from "vitest";
import { normalizeEmail, submissionSchema } from "../../src/lib/validation/submission";

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
});

describe("email normalization", () => {
  it("only trims and lowercases", () => {
    expect(normalizeEmail("  First.Last+RESET@Gmail.COM ")).toBe("first.last+reset@gmail.com");
  });
});
