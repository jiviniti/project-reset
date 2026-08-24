import { describe, expect, it } from "vitest";
import {
  assertJsonContentType,
  assertSafeRequestOrigin,
  MAX_SUBMISSION_BYTES,
  readCappedJson,
  RequestGuardError,
} from "../../src/lib/security/request-guards";

describe("request guards", () => {
  it("accepts same-origin JSON", () => {
    const request = new Request("https://reset.example/api/v1/submissions", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8", origin: "https://reset.example", "sec-fetch-site": "same-origin" },
      body: "{}",
    });
    expect(() => assertJsonContentType(request)).not.toThrow();
    expect(() => assertSafeRequestOrigin(request, [])).not.toThrow();
  });

  it("rejects a cross-site origin", () => {
    const request = new Request("https://reset.example/api/v1/submissions", {
      headers: { origin: "https://attacker.example", "sec-fetch-site": "cross-site" },
    });
    expect(() => assertSafeRequestOrigin(request, [])).toThrow(RequestGuardError);
  });

  it("rejects a stream over 32 KiB even without content-length", async () => {
    const request = new Request("https://reset.example/api/v1/submissions", {
      method: "POST",
      body: "x".repeat(MAX_SUBMISSION_BYTES + 1),
    });
    await expect(readCappedJson(request)).rejects.toMatchObject({ code: "request_too_large" });
  });

  it("parses a bounded JSON body", async () => {
    const request = new Request("https://reset.example/api/v1/submissions", { method: "POST", body: JSON.stringify({ ok: true }) });
    await expect(readCappedJson(request)).resolves.toEqual({ ok: true });
  });
});
