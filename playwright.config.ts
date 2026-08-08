import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/pdv",
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: process.env.BAILFIRE_URL || "http://localhost:8080",
    headless: true,
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
