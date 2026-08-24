import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    env: { ...process.env, E2E_USE_PREVIEW_FIXTURE: "true" },
  },
  use: { baseURL: "http://localhost:3000", trace: "retain-on-failure" },
  projects: [
    { name: "mobile-chromium", use: { ...devices["iPhone 13"], browserName: "chromium" } },
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
