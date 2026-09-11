import "server-only";
import { hasServerDatabaseConfig } from "@/lib/config/server-env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { automatedTestScreenings } from "@/features/check-in/production-test-config";
import type { ScreeningConfig } from "@/types/screening";

const RETIRED_PREVIEW_SLUGS = new Set([
  "preview-screening",
  "preview-event",
  "preview-expired-event",
]);

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
  if (RETIRED_PREVIEW_SLUGS.has(slug)) return null;

  if (process.env.E2E_USE_TEST_FIXTURE === "true") {
    return automatedTestScreenings[slug] ?? null;
  }
  if (!hasServerDatabaseConfig()) {
    return null;
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.rpc("get_screening_v1", { screening_slug: slug });
  if (error) throw new Error("screening_lookup_failed");
  return data ? normalizeScreeningConfig(data as ScreeningConfig) : null;
}
