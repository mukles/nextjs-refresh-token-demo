import { defineConfig, devices } from "@playwright/test";

const apiPort = 3013;
const webPort = 3014;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${webPort}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: `npm run build && PORT=${apiPort} WEB_ORIGIN=http://127.0.0.1:${webPort} ACCESS_TOKEN_TTL_SECONDS=2 REFRESH_TOKEN_TTL_SECONDS=30 REFRESH_TOKEN_GRACE_SECONDS=2 npm run start`,
      cwd: "../api",
      url: `http://127.0.0.1:${apiPort}/api/v1/health`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `NEXT_PUBLIC_API_URL=http://127.0.0.1:${apiPort}/api/v1 npx next dev --port ${webPort} --hostname 127.0.0.1`,
      cwd: ".",
      url: `http://127.0.0.1:${webPort}/login`,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
