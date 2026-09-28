import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 30000,
  workers: 1,
  use: {
    baseURL: "http://localhost:4173",
    channel: "chrome",
    viewport: { width: 390, height: 844 },
    trace: "off",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 4173 --host 127.0.0.1",
    url: "http://localhost:4173",
    reuseExistingServer: true,
    timeout: 60000,
  },
});
