import { test, expect } from "@playwright/test";

test.describe("Status Page PDV", () => {
  test("page loads and displays title", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("page displays at least one service card", async ({ page }) => {
    await page.goto("/");
    const cards = page.locator(".service-card");
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test("status badges have correct text", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".status-badge", { timeout: 10000 });
    const badges = page.locator(".status-badge");
    const count = await badges.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const text = await badges.nth(i).textContent();
      expect(["Operational", "Degraded", "Down"]).toContain(text);
    }
  });

  test("footer shows copyright notice", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator(".footer");
    await expect(footer).toContainText("2025 Asymmetric Effort, LLC");
    await expect(footer).toContainText("MIT LICENSE");
  });

  test("status.json is fetchable and valid", async ({ request }) => {
    const res = await request.get("/status.json");
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty("title");
    expect(data).toHaveProperty("services");
    expect(Array.isArray(data.services)).toBeTruthy();
  });

  test("page renders at mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator(".service-card").first()).toBeVisible({ timeout: 10000 });
  });

  test("overall status indicator is visible", async ({ page }) => {
    await page.goto("/");
    const overall = page.locator(".overall-status");
    await expect(overall).toBeVisible({ timeout: 10000 });
    const text = await overall.textContent();
    expect(["All Systems Operational", "Partial Outage", "Major Outage", "No Services Configured"]).toContain(text);
  });
});
