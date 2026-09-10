import { parseSupabaseUrl } from "@/lib/config/trusted-urls";

function supabaseConnectSources(value: string | undefined): string[] {
  if (!value) return [];
  const url = new URL(parseSupabaseUrl(value));
  return [url.origin, `wss://${url.host}`];
}

export function buildContentSecurityPolicy(
  nonce: string,
  environment = process.env.NODE_ENV,
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
): string {
  const developmentScripts = environment === "development" ? " 'unsafe-eval'" : "";
  const developmentConnections = environment === "development"
    ? ["http://localhost:*", "ws://localhost:*"]
    : [];
  const connectSources = ["'self'", ...supabaseConnectSources(supabaseUrl), ...developmentConnections];

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${developmentScripts}`,
    "style-src 'self' 'unsafe-inline'",
    `connect-src ${connectSources.join(" ")}`,
    "img-src 'self' data: blob: https://framerusercontent.com",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}
