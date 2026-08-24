import "server-only";
import { hasServerDatabaseConfig } from "@/lib/config/server-env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PREVIEW_SCREENING_SLUG, previewScreeningConfig } from "@/features/check-in/preview-config";
import type { ScreeningConfig } from "@/types/screening";

export async function getScreeningConfig(slug: string): Promise<ScreeningConfig | null> {
  if (process.env.E2E_USE_PREVIEW_FIXTURE === "true") {
    return slug === PREVIEW_SCREENING_SLUG ? previewScreeningConfig : null;
  }
  if (!hasServerDatabaseConfig()) {
    return process.env.NODE_ENV !== "production" && slug === PREVIEW_SCREENING_SLUG
      ? previewScreeningConfig
      : null;
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.rpc("get_screening_v1", { screening_slug: slug });
  if (error) throw new Error("screening_lookup_failed");
  return (data as ScreeningConfig | null) ?? null;
}
