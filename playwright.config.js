const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  webServer: {
    command: 'npx http-server -p 4173 -c-1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'firefox',
      use: {
        browserName: 'firefox',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
      },
    },
    {
      name: 'webkit',
      use: {
        browserName: 'webkit',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
});
