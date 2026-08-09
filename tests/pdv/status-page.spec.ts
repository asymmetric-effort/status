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

  test("/json endpoint returns valid status data", async ({ request }) => {
    const res = await request.get("/json");
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    const data = JSON.parse(body);
    expect(data).toHaveProperty("title");
    expect(data).toHaveProperty("services");
    expect(Array.isArray(data.services)).toBeTruthy();
    for (const svc of data.services) {
      expect(svc).toHaveProperty("name");
      expect(svc).toHaveProperty("status");
      expect(svc).toHaveProperty("message");
      expect(svc).toHaveProperty("updated");
    }
  });

  test("history.json contains histogram data with non-empty service history", async ({ request }) => {
    const res = await request.get("/history.json");
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty("startTime");
    expect(data).toHaveProperty("totalHours");
    expect(data.totalHours).toBe(2160);
    expect(data).toHaveProperty("services");

    const serviceNames = Object.keys(data.services);
    expect(serviceNames.length).toBeGreaterThan(0);

    // At least one service must have non-no-data entries
    let hasRealData = false;
    for (const name of serviceNames) {
      const hours: string[] = data.services[name];
      expect(hours).toHaveLength(2160);
      const realEntries = hours.filter((s: string) => s !== "no-data");
      if (realEntries.length > 0) {
        hasRealData = true;
        // All entries must be valid status values
        for (const entry of hours) {
          expect(["operational", "degraded", "down", "no-data"]).toContain(entry);
        }
      }
    }
    expect(hasRealData).toBeTruthy();
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
