const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 90000,
  expect: { timeout: 20000 },
  use: {
    headless: true,
    channel: 'chromium',
    acceptDownloads: true,
    viewport: { width: 1440, height: 980 },
  },
});
