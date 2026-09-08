import type { ServerEnv } from "@/lib/config/server-env";
import type { KinemaRewardAccess, SubmissionResult } from "@/types/pathway";

export const CLIMATE_WEEK_SCREENING_SLUG = "climate-week-nyc-2026";
export const COLUMBIA_SCREENING_SLUG = "columbia-climate-school-2026";
export const PREVIEW_EVENT_SCREENING_SLUG = "preview-event";

const PLACEHOLDER_PREVIEW_KINEMA_ACCESS: KinemaRewardAccess = {
  provider: "kinema",
  filmUrl: "https://kinema.com/",
  promoCode: "DEMO_CODE_NOT_VALID",
  accountRequired: true,
  startWithinDays: 30,
  finishWithinHours: 48,
};

function previewKinemaAccess(env: ServerEnv): KinemaRewardAccess {
  if (!env.KINEMA_TEST_CODE) return PLACEHOLDER_PREVIEW_KINEMA_ACCESS;
  if (!env.KINEMA_FILM_URL) throw new Error("kinema_test_reward_not_configured");

  return {
    ...PLACEHOLDER_PREVIEW_KINEMA_ACCESS,
    filmUrl: env.KINEMA_FILM_URL,
    promoCode: env.KINEMA_TEST_CODE,
  };
}

function codeForScreening(slug: string, env: ServerEnv) {
  if (slug === CLIMATE_WEEK_SCREENING_SLUG) return env.KINEMA_CLIMATE_WEEK_NYC_2026_CODE;
  if (slug === COLUMBIA_SCREENING_SLUG) return env.KINEMA_COLUMBIA_CLIMATE_SCHOOL_2026_CODE;
  return undefined;
}

export function resolveKinemaRewardAccess(
  screeningSlug: string,
  result: SubmissionResult,
  env: ServerEnv,
): KinemaRewardAccess | undefined {
  if (env.REWARD_PROVIDER !== "kinema_manual" || result.rewardType !== "film_access" || result.eventWindowStatus !== "active_event") {
    return undefined;
  }

  // The preview route uses harmless placeholders by default. A temporary,
  // server-only test code can opt the same journey into controlled team tests.
  if (screeningSlug === PREVIEW_EVENT_SCREENING_SLUG) {
    return env.DATASET_ENV === "preview" ? previewKinemaAccess(env) : undefined;
  }

  const promoCode = codeForScreening(screeningSlug, env);
  if (!env.KINEMA_FILM_URL || !promoCode) throw new Error("kinema_reward_not_configured");

  return {
    provider: "kinema",
    filmUrl: env.KINEMA_FILM_URL,
    promoCode,
    accountRequired: true,
    startWithinDays: 30,
    finishWithinHours: 48,
  };
}
