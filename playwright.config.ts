import { defineConfig, devices } from '@playwright/test';

/**
 * Prerequisites before running tests:
 *   docker compose up -d   (postgres + redis)
 *   npm run dev            (or set PLAYWRIGHT_BASE_URL if already running)
 *
 * Run:  npx playwright test
 * UI:   npx playwright test --ui
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // share DB — run serially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Creates test users and saves admin auth state
    { name: 'setup', testMatch: /global\.setup\.ts/ },

    // All E2E specs run after setup
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
