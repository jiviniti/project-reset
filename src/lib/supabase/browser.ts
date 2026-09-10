"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { parseSupabaseUrl } from "@/lib/config/trusted-urls";

let browserClient: SupabaseClient | null | undefined;

export function createBrowserSupabaseClient(): SupabaseClient | null {
  if (browserClient !== undefined) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey?.startsWith("sb_publishable_")) {
    browserClient = null;
    return browserClient;
  }

  browserClient = createClient(parseSupabaseUrl(url), publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return browserClient;
}
