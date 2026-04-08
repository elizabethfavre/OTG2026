// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.cjs',
  globalTeardown: './tests/e2e/global-teardown.cjs',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5500',
    trace: 'on-first-retry',
    navigationTimeout: 30000,
    // Handle HTTPS/external API calls (needed for backend API on Render)
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        ignoreHTTPSErrors: true,
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        ignoreHTTPSErrors: true,
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        ignoreHTTPSErrors: true,
      },
    },
  ],

  webServer: {
    command: 'npx http-server -p 5500 -c-1',
    url: 'http://localhost:5500',
    reuseExistingServer: !process.env.CI,
  },
});
