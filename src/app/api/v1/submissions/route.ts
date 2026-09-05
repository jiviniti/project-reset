import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getServerEnv } from "@/lib/config/server-env";
import { isSubmissionRateLimited } from "@/lib/security/rate-limit";
import {
  assertJsonContentType,
  assertSafeRequestOrigin,
  readCappedJson,
  RequestGuardError,
} from "@/lib/security/request-guards";
import { submissionSchema } from "@/lib/validation/submission";
import { getScreeningConfig } from "@/services/submissions/screenings";
import { persistSubmission, SubmissionDatabaseError } from "@/services/submissions/submit";
import { resolveKinemaRewardAccess } from "@/services/rewards/kinema-access";

export const runtime = "nodejs";

function errorResponse(status: number, code: string, correlationId: string) {
  return NextResponse.json({ error: code, correlationId }, { status });
}

export async function POST(request: Request) {
  const correlationId = crypto.randomUUID();

  try {
    const env = getServerEnv();
    if (env.SUBMISSIONS_ENABLED !== "true") {
      return errorResponse(503, "submissions_disabled", correlationId);
    }
    if (await isSubmissionRateLimited(request)) {
      return errorResponse(429, "rate_limited", correlationId);
    }

    assertJsonContentType(request);
    assertSafeRequestOrigin(
      request,
      env.ALLOWED_APP_ORIGINS.split(",").map((origin) => origin.trim()),
    );
    const input = submissionSchema.parse(await readCappedJson(request));
    const screening = await getScreeningConfig(input.screeningSlug);
    if (!screening) {
      return errorResponse(404, "screening_not_found_or_inactive", correlationId);
    }
    if (screening.policyVersion !== input.consent.policyVersion) {
      return errorResponse(422, "policy_version_invalid", correlationId);
    }

    const result = await persistSubmission(input);
    const rewardAccess = resolveKinemaRewardAccess(screening.slug, result, env);
    return NextResponse.json(
      rewardAccess ? { ...result, rewardAccess } : result,
      { status: result.replayed ? 200 : 201 },
    );
  } catch (error) {
    if (error instanceof RequestGuardError) {
      return errorResponse(error.status, error.code, correlationId);
    }
    if (error instanceof ZodError) {
      return errorResponse(422, "validation_failed", correlationId);
    }
    if (error instanceof SubmissionDatabaseError) {
      const status = error.safeCode === "screening_not_found_or_inactive" ? 409 : 422;
      return errorResponse(status, error.safeCode, correlationId);
    }

    console.error("submission_failed", { correlationId, code: "internal_error" });
    return errorResponse(500, "internal_error", correlationId);
  }
}
