import { existsSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

// The staging accounts the journeys sign in with, kept out of the repo (see e2e/helpers.ts)
if (existsSync(".env.e2e.local")) process.loadEnvFile(".env.e2e.local");

// The dev server, which forwards the API to staging (API_DEV_PROXY_URL)
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8000";

export default defineConfig({
  testDir: "./e2e",
  // One journey at a time: each signs in afresh, and refresh tokens are single-use, so parallel
  // journeys sharing a session would trip the API's reuse check and end every session
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  use: { baseURL, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : { command: "npm run dev", url: baseURL, reuseExistingServer: true, timeout: 120_000 },
});
