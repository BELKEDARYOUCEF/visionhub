const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 30000,
  expect: { timeout: 5000 },
  use: {
    baseURL: "http://127.0.0.1:5502",
    trace: "on-first-retry"
  },
  webServer: {
    command: "npm run start",
    url: "http://127.0.0.1:5502",
    reuseExistingServer: true,
    timeout: 10000
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
