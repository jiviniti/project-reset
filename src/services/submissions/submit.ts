import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SubmissionPayload } from "@/lib/validation/submission";

export type SubmissionResult = {
  submissionId: string;
  participationId: string;
  status: "completed";
  replayed: boolean;
};

export class SubmissionDatabaseError extends Error {
  constructor(public readonly safeCode: string) {
    super(safeCode);
  }
}

export async function persistSubmission(payload: SubmissionPayload): Promise<SubmissionResult> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.rpc("submit_participation_v1", { payload });
  if (error) {
    const knownCode = [
      "screening_not_found_or_inactive",
      "policy_version_invalid",
      "question_invalid",
      "option_invalid",
      "answer_type_invalid",
      "practice_pathway_mismatch",
    ].find((code) => error.message.includes(code));
    throw new SubmissionDatabaseError(knownCode ?? "submission_database_error");
  }
  return data as SubmissionResult;
}
