import { z } from "zod";

const APPROVED_CAMPAIGN_HOSTS = new Set([
  "project-reset-psi.vercel.app",
  "projectreset.example",
  "reset.thirddegreeburnout.com",
  "thirddegreeburnout.com",
  "www.thirddegreeburnout.com",
]);

function trustedHttpsSchema(
  message: string,
  isAllowed: (url: URL) => boolean,
) {
  return z.string().trim().superRefine((value, context) => {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      context.addIssue({ code: "custom", message });
      return;
    }
    if (url.protocol !== "https:" || url.username || url.password || !isAllowed(url)) {
      context.addIssue({ code: "custom", message });
    }
  });
}

export const campaignUrlSchema = trustedHttpsSchema(
  "Campaign URLs must use HTTPS and an approved Project RESET or Third Degree Burnout host.",
  (url) => APPROVED_CAMPAIGN_HOSTS.has(url.hostname.toLowerCase()),
);

export const kinemaFilmUrlSchema = trustedHttpsSchema(
  "The KINEMA film URL must use HTTPS, kinema.com, and a /films/ path.",
  (url) => {
    const hostname = url.hostname.toLowerCase();
    return (hostname === "kinema.com" || hostname === "www.kinema.com")
      && url.pathname.startsWith("/films/");
  },
);

export const supabaseUrlSchema = trustedHttpsSchema(
  "The Supabase URL must use HTTPS and a supabase.co project host.",
  (url) => url.hostname.toLowerCase().endsWith(".supabase.co"),
);

export function parseCampaignUrl(value: string): string {
  return campaignUrlSchema.parse(value);
}

export function parseSupabaseUrl(value: string): string {
  return supabaseUrlSchema.parse(value);
}
