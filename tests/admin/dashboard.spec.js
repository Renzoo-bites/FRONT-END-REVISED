// Dashboard (admin/js/dashboard.js): greeting, stat cards, charts and today's lost items.
const { test, expect, loginAs } = require("../fixtures");

test.describe("dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
    await page.goto("admin/dashboard.html");
  });

  test("greets SWAFO for the time of day", async ({ page }) => {
    await expect(page.locator("#greeting")).toHaveText("Good morning, SWAFO"); // the tests run at 10 AM
  });

  test("shows four stat cards, with claims counted live", async ({ page }) => {
    const cards = page.locator("#stat-grid .stat-card");
    await expect(cards).toHaveCount(4);
    const claims = cards.filter({ hasText: "Claims to review" });
    await expect(claims.locator(".stat-value")).toHaveText("8");
    await expect(claims).toContainText("3 new today");
  });

  test("the weekly chart also has a data table", async ({ page }) => {
    const rows = page.locator("#weekly-table tbody tr");
    await expect(rows).toHaveCount(7);
    await expect(rows.first()).toHaveText(/Mon\s*8\s*5/);
    await expect(page.locator("#weekly-chart, .chart-fallback").first()).toBeAttached();
  });

  test("says so when Chart.js can't load", async ({ page }) => {
    // The tests run offline, so the CDN copy of Chart.js never arrives.
    await expect(page.locator(".chart-fallback")).toHaveCount(2);
    await expect(page.locator(".chart-fallback").first()).toHaveText("Chart couldn't load. Check your internet connection.");
    await expect(page.locator("#category-legend li")).toHaveCount(6);
  });

  test("lists the items reported lost today", async ({ page }) => {
    const rows = page.locator("#today-body tr");
    await expect(rows).toHaveCount(4);
    await expect(rows.first()).toContainText("iPhone 13");
    await expect(rows.first()).toContainText("Maria Santos");
  });
});
