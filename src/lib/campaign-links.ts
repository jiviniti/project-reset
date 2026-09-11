import { parseCampaignUrl } from "@/lib/config/trusted-urls";

export const DONATION_URL = parseCampaignUrl(
  process.env.NEXT_PUBLIC_DONATE_URL?.trim() || "https://thirddegreeburnout.com/fueltheimpact",
);

export const TRAILER_URL = parseCampaignUrl(
  process.env.NEXT_PUBLIC_PROJECT_RESET_TRAILER_URL?.trim() || "https://www.thirddegreeburnout.com/",
);

export const PROJECT_RESET_SIGNUP_URL = parseCampaignUrl(
  process.env.NEXT_PUBLIC_PROJECT_RESET_SIGNUP_URL?.trim() || "https://reset.thirddegreeburnout.com/",
);
