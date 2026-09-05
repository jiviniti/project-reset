import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve("supabase/migrations/202608240001_initial_schema.sql"), "utf8").toLowerCase();
const submissionFix = readFileSync(
  resolve("supabase/migrations/202608240002_fix_submission_email_variable.sql"),
  "utf8",
).toLowerCase();
const aggregateMigration = readFileSync(
  resolve("supabase/migrations/202608250003_aggregate_model.sql"),
  "utf8",
).toLowerCase();
const aggregateSubmissionHook = readFileSync(
  resolve("supabase/migrations/202608250004_submission_aggregate_hook.sql"),
  "utf8",
).toLowerCase();
const revisionSafeUpdateMigration = readFileSync(
  resolve("supabase/migrations/202608250005_fix_revision_safe_update.sql"),
  "utf8",
).toLowerCase();
const questionnaireV2Migration = readFileSync(
  resolve("supabase/migrations/202608310001_questionnaire_v2_brand_polish.sql"),
  "utf8",
).toLowerCase();
const questionnaireV3Migration = readFileSync(
  resolve("supabase/migrations/202609050001_questionnaire_v3_commitment.sql"),
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

  it("keeps aggregate functions invoker-only and browser mutation inaccessible", () => {
    expect(aggregateMigration).toContain("create schema if not exists aggregate");
    expect(aggregateMigration).toContain("security invoker");
    expect(aggregateMigration).not.toContain("security definer");
    expect(aggregateMigration).toContain("revoke all on schema aggregate from public, anon, authenticated");
    expect(aggregateMigration).toContain("revoke execute on function api.get_public_aggregates_v1()");
    expect(aggregateMigration).toContain("grant execute on function api.get_public_aggregates_v1() to service_role");
  });

  it("exposes only a read-only PII-free revision resource to browser roles", () => {
    expect(aggregateMigration).toContain("create table if not exists public.aggregate_revision");
    expect(aggregateMigration).toContain("grant select on table public.aggregate_revision to anon, authenticated");
    expect(aggregateMigration).toContain("alter publication supabase_realtime add table public.aggregate_revision");
    expect(aggregateMigration).toContain("schemaname = 'private' or schemaname = 'aggregate'");
  });

  it("targets the singleton revision row explicitly for API-safe updates", () => {
    expect(revisionSafeUpdateMigration).toContain("aggregate_revision_singleton_idx");
    expect(revisionSafeUpdateMigration).toMatch(
      /update public\.aggregate_revision[\s\S]*?where revision_row\.revision/,
    );
    expect(revisionSafeUpdateMigration).toContain("security invoker");
    expect(revisionSafeUpdateMigration).toContain(
      "revoke execute on function aggregate.bump_revision_v1() from public, anon, authenticated",
    );
  });

  it("updates aggregates inside the new-submission transaction only", () => {
    expect(aggregateSubmissionHook).toContain(
      "perform aggregate.apply_observed_submission_v1(created_response_id, screening.id)",
    );
    const replayReturn = aggregateSubmissionHook.indexOf("'replayed', true");
    const aggregateUpdate = aggregateSubmissionHook.indexOf("aggregate.apply_observed_submission_v1");
    expect(replayReturn).toBeGreaterThan(-1);
    expect(aggregateUpdate).toBeGreaterThan(replayReturn);
    expect(aggregateSubmissionHook).toContain("security invoker");
    expect(aggregateSubmissionHook).not.toContain("security definer");
  });

  it("publishes questionnaire v2 without weakening the existing security boundary", () => {
    expect(questionnaireV2Migration).toContain("values ('reset-v1', 2");
    expect(questionnaireV2Migration).toContain("'less_social_media', 'less social media'");
    expect(questionnaireV2Migration).toContain("'in_person_meetings', 'in-person meetings'");
    expect(questionnaireV2Migration).toContain("metric_key = 'fruit_veg'");
    expect(questionnaireV2Migration).toContain("metadata ->> 'active'");
    expect(questionnaireV2Migration).toContain("security invoker");
    expect(questionnaireV2Migration).not.toContain("security definer");
    expect(questionnaireV2Migration).toContain("revoke execute on function api.get_screening_v1(text) from public, anon, authenticated");
  });

  it("publishes a private questionnaire v3 commitment without adding a public metric", () => {
    expect(questionnaireV3Migration).toContain("values ('reset-v1', 3");
    expect(questionnaireV3Migration).toContain("'today_commitment'");
    expect(questionnaireV3Migration).toContain("'visibility', 'private'");
    expect(questionnaireV3Migration).not.toContain("insert into aggregate.metric_definitions");
    expect(questionnaireV3Migration).toContain("questionnaire_version_id = source_version.id");
  });

  it("derives cumulative observed values from screening scopes and seeded values from one baseline", () => {
    expect(aggregateMigration).toContain("scope.scope_type = 'screening'");
    expect(aggregateMigration).toContain("scope.scope_type = 'seeded_baseline'");
    expect(aggregateMigration).toContain("aggregate_one_seeded_baseline_idx");
    expect(aggregateMigration).toContain("scope_type = 'cohort' and screening_id is null");
  });
});
