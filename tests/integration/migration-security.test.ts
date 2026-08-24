import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve("supabase/migrations/202608240001_initial_schema.sql"), "utf8").toLowerCase();
const submissionFix = readFileSync(
  resolve("supabase/migrations/202608240002_fix_submission_email_variable.sql"),
  "utf8",
).toLowerCase();

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

  it("keeps the normalized email variable distinct from its database column", () => {
    expect(submissionFix).toContain("participant_normalized_email text");
    expect(submissionFix).toContain("values (first_name, email, participant_normalized_email)");
    expect(submissionFix).toContain("security invoker");
    expect(submissionFix).not.toContain("security definer");
  });

  it("keeps the created response variable distinct from response_id columns", () => {
    expect(submissionFix).toContain("created_response_id uuid");
    expect(submissionFix).toContain("where selected.response_id = created_response_id");
  });
});
