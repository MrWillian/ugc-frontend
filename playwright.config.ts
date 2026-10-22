import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const STUB_BACKEND_PORT = Number(process.env.STUB_BACKEND_PORT ?? 4010);

export const baseURL = process.env.BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  // instant() guards are deterministic; a retry would mask the regression they exist to catch.
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : [
        {
          command: `node e2e/stub-backend.mjs`,
          url: `http://127.0.0.1:${STUB_BACKEND_PORT}/health`,
          reuseExistingServer: false,
          stdout: "pipe",
        },
        {
          // EXPOSE_TESTING_API is needed at build time (the client lock is compiled
          // into the bundle) AND here at runtime: the server reads
          // exposeTestingApiInProductionBuild from next.config.ts on each request to
          // decide whether to honor the lock cookie on a document request. Omitting
          // it here leaves initial-load navigations unlocked, and an instant() test
          // would pass vacuously.
          command: `npx next start --port ${PORT}`,
          url: `http://127.0.0.1:${PORT}/login`,
          reuseExistingServer: false,
          stdout: "pipe",
          env: {
            EXPOSE_TESTING_API: "1",
            NEXT_PUBLIC_API_URL: `http://127.0.0.1:${STUB_BACKEND_PORT}`,
          },
        },
      ],
});
