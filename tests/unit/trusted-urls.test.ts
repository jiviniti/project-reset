import { describe, expect, it } from "vitest";
import {
  campaignUrlSchema,
  kinemaFilmUrlSchema,
  supabaseUrlSchema,
} from "../../src/lib/config/trusted-urls";

const unsafeUrls = [
  "javascript:alert(1)",
  "data:text/html,<script>alert(1)</script>",
  "http://reset.thirddegreeburnout.com/",
  "https://user:password@reset.thirddegreeburnout.com/",
  "not a url",
];

describe("trusted URL policy", () => {
  it("accepts only approved HTTPS campaign hosts", () => {
    expect(campaignUrlSchema.parse("https://reset.thirddegreeburnout.com/"))
      .toBe("https://reset.thirddegreeburnout.com/");
    expect(campaignUrlSchema.parse("https://reset.thirddegreeburnout.com/start-a-conversation"))
      .toBe("https://reset.thirddegreeburnout.com/start-a-conversation");
    expect(campaignUrlSchema.parse("https://thirddegreeburnout.com/fueltheimpact"))
      .toBe("https://thirddegreeburnout.com/fueltheimpact");
    for (const value of [...unsafeUrls, "https://reset.thirddegreeburnout.com.attacker.example/"]) {
      expect(campaignUrlSchema.safeParse(value).success).toBe(false);
    }
  });

  it("accepts only KINEMA film pages", () => {
    expect(kinemaFilmUrlSchema.parse("https://kinema.com/films/third-degree-burnout-a-survivors-guide-1mdwu9"))
      .toBe("https://kinema.com/films/third-degree-burnout-a-survivors-guide-1mdwu9");
    for (const value of [
      ...unsafeUrls,
      "https://kinema.com/",
      "https://kinema.com.attacker.example/films/third-degree-burnout",
    ]) {
      expect(kinemaFilmUrlSchema.safeParse(value).success).toBe(false);
    }
  });

  it("accepts only HTTPS Supabase project hosts", () => {
    expect(supabaseUrlSchema.safeParse("https://example.supabase.co").success).toBe(true);
    expect(supabaseUrlSchema.safeParse("https://supabase.co.attacker.example").success).toBe(false);
    expect(supabaseUrlSchema.safeParse("http://example.supabase.co").success).toBe(false);
  });
});
