import { defineConfig, devices } from "@playwright/test";

// E2E runs against a local Supabase (`supabase start`). Env comes from the shell:
//   E2E_SUPABASE_URL, E2E_SUPABASE_ANON_KEY, E2E_SUPABASE_SERVICE_ROLE_KEY
const url = process.env.E2E_SUPABASE_URL ?? "http://127.0.0.1:54321";
const port = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [["list"]],
  globalSetup: "./tests/e2e/global-setup.ts",
  use: { baseURL: `http://127.0.0.1:${port}`, trace: "retain-on-failure", viewport: { width: 1280, height: 900 } },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } } },
  ],
  webServer: {
    // A production build, like Vercel serves it.
    command: `npx next build && npx next start -p ${port}`,
    url: `http://127.0.0.1:${port}/login`,
    reuseExistingServer: true,
    timeout: 400_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: url,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.E2E_SUPABASE_ANON_KEY ?? "",
      SUPABASE_SERVICE_ROLE_KEY: process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ?? "",
      NEXT_PUBLIC_APP_URL: `http://127.0.0.1:${port}`,
      RESEND_API_KEY: "",
      CRON_SECRET: "e2e-cron-secret",
    },
  },
});
