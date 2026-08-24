import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SECRET_KEY: z.string().startsWith("sb_secret_"),
  ALLOWED_APP_ORIGINS: z.string().default(""),
  SUBMISSIONS_ENABLED: z.enum(["true", "false"]).default("false"),
  REWARD_PROVIDER: z.literal("disabled").default("disabled"),
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
    DATASET_ENV: process.env.DATASET_ENV,
  });
}

export function hasServerDatabaseConfig(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}
