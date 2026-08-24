import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/config/server-env";

export function createServerSupabaseClient() {
  const env = getServerEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    db: { schema: "api" },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
