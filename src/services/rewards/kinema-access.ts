import type { ServerEnv } from "@/lib/config/server-env";
import type { KinemaRewardAccess, SubmissionResult } from "@/types/pathway";

export const CLIMATE_WEEK_SCREENING_SLUG = "climate-week-nyc-2026";
export const COLUMBIA_SCREENING_SLUG = "columbia-climate-school-2026";

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
