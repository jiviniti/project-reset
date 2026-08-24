import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve("supabase/migrations/202608240001_initial_schema.sql"), "utf8").toLowerCase();

describe("database security migration", () => {
  it("uses only invoker functions", () => {
    expect(migration).toContain("security invoker");
    expect(migration).not.toContain("security definer");
  });

  it("revokes browser execution and grants server execution", () => {
    expect(migration).toContain("revoke execute on function api.submit_participation_v1(jsonb)");
    expect(migration).toContain("from public, anon, authenticated");
    expect(migration).toContain("grant execute on function api.submit_participation_v1(jsonb) to service_role");
  });

  it("enables RLS and documents the email identity assumption", () => {
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("one trim-and-lowercase normalized email corresponds to one participant across screenings");
  });
});
