import "server-only";
import { hasServerDatabaseConfig } from "@/lib/config/server-env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  PREVIEW_EVENT_SCREENING_SLUG,
  PREVIEW_EXPIRED_EVENT_SCREENING_SLUG,
  PREVIEW_SCREENING_SLUG,
  previewEventScreeningConfig,
  previewExpiredEventScreeningConfig,
  previewScreeningConfig,
} from "@/features/check-in/preview-config";
import type { ScreeningConfig } from "@/types/screening";

function normalizeScreeningConfig(data: ScreeningConfig): ScreeningConfig {
  return {
    ...data,
    entryPathway: data.entryPathway ?? "event",
    rewardType: data.rewardType ?? "film_access",
    eventWindowStatus: data.eventWindowStatus ?? "active_event",
    accessEndsAt: data.accessEndsAt ?? null,
    checkInOpensAt: data.checkInOpensAt ?? null,
    checkInClosesAt: data.checkInClosesAt ?? null,
  };
}

export async function getScreeningConfig(slug: string): Promise<ScreeningConfig | null> {
  if (process.env.E2E_USE_PREVIEW_FIXTURE === "true") {
    return {
      [PREVIEW_SCREENING_SLUG]: previewScreeningConfig,
      [PREVIEW_EVENT_SCREENING_SLUG]: previewEventScreeningConfig,
      [PREVIEW_EXPIRED_EVENT_SCREENING_SLUG]: previewExpiredEventScreeningConfig,
    }[slug] ?? null;
  }
  if (!hasServerDatabaseConfig()) {
    return process.env.NODE_ENV !== "production" && slug === PREVIEW_SCREENING_SLUG
      ? previewScreeningConfig
      : null;
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.rpc("get_screening_v1", { screening_slug: slug });
  if (error) throw new Error("screening_lookup_failed");
  return data ? normalizeScreeningConfig(data as ScreeningConfig) : null;
}
