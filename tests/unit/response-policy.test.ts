import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import { proxy } from "../../src/proxy";
import { buildContentSecurityPolicy } from "../../src/lib/security/response-policy";

describe("browser response policy", () => {
  it("builds a strict production CSP with the Supabase HTTPS and WSS origins", () => {
    const policy = buildContentSecurityPolicy("test-nonce", "production", "https://example.supabase.co");
    expect(policy).toContain("script-src 'self' 'nonce-test-nonce' 'strict-dynamic'");
    expect(policy).not.toContain("'unsafe-eval'");
    expect(policy).toContain("connect-src 'self' https://example.supabase.co wss://example.supabase.co");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
  });

  it("permits eval and local dev connections only in development", () => {
    const policy = buildContentSecurityPolicy("dev-nonce", "development");
    expect(policy).toContain("'unsafe-eval'");
    expect(policy).toContain("http://localhost:*");
    expect(policy).toContain("ws://localhost:*");
  });

  it("generates a different nonce for every HTML response", () => {
    const request = new NextRequest("https://reset.thirddegreeburnout.com/");
    const first = proxy(request).headers.get("content-security-policy");
    const second = proxy(request).headers.get("content-security-policy");
    expect(first).toContain("'strict-dynamic'");
    expect(first).not.toBe(second);
  });

  it("configures the global hardening headers", async () => {
    const entries = await nextConfig.headers!();
    const headers = new Map(entries[0].headers.map(({ key, value }) => [key, value]));
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("Permissions-Policy")).toBe("camera=(), microphone=(), geolocation=()");
  });
});
