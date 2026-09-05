import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SECRET_KEY: z.string().startsWith("sb_secret_"),
  ALLOWED_APP_ORIGINS: z.string().default(""),
  SUBMISSIONS_ENABLED: z.enum(["true", "false"]).default("false"),
  REWARD_PROVIDER: z.enum(["disabled", "kinema_manual"]).default("disabled"),
  KINEMA_FILM_URL: z.string().url().optional(),
  KINEMA_CLIMATE_WEEK_NYC_2026_CODE: z.string().trim().min(1).optional(),
  KINEMA_COLUMBIA_CLIMATE_SCHOOL_2026_CODE: z.string().trim().min(1).optional(),
  DATASET_ENV: z.enum(["preview", "production"]).default("preview"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    ALLOWED_APP_ORIGINS: process.env.ALLOWED_APP_ORIGINS,
    SUBMISSIONS_ENABLED: process.env.SUBMISSIONS_ENABLED,
    REWARD_PROVIDER: process.env.REWARD_PROVIDER,
    KINEMA_FILM_URL: process.env.KINEMA_FILM_URL,
    KINEMA_CLIMATE_WEEK_NYC_2026_CODE: process.env.KINEMA_CLIMATE_WEEK_NYC_2026_CODE,
    KINEMA_COLUMBIA_CLIMATE_SCHOOL_2026_CODE: process.env.KINEMA_COLUMBIA_CLIMATE_SCHOOL_2026_CODE,
    DATASET_ENV: process.env.DATASET_ENV,
  });
}

export function hasServerDatabaseConfig(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}
