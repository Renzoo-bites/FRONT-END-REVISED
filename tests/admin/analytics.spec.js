// Analytics (admin/js/analytics.js): totals and breakdowns counted from every report.
const { test, expect, loginAs } = require("../fixtures");

const stat = (page, label) => page.locator("#analytics-stats .stat-card").filter({ hasText: label });

test.describe("analytics", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
    await page.goto("admin/analytics.html");
  });

  test("totals all reports", async ({ page }) => {
    await expect(stat(page, "Total reports").locator(".stat-value")).toHaveText("46");
    await expect(stat(page, "Total reports")).toContainText("All time");
    await expect(stat(page, "Lost reports").locator(".stat-value")).toHaveText("24");
    await expect(stat(page, "Lost reports")).toContainText("52% of reports");
    await expect(stat(page, "Found reports").locator(".stat-value")).toHaveText("22");
    await expect(stat(page, "Returned to owners").locator(".stat-value")).toHaveText("9");
  });

  test("each chart has a table with the same numbers", async ({ page }) => {
    for (const summary of await page.getByText("View as table").all()) await summary.click();
    await expect(page.locator("#status-table tbody tr")).toHaveText([/Pending\s*25/, /Matched\s*6/, /Ready for claim\s*6/, /Claimed\s*9/]);
    await expect(page.locator("#category-table tbody tr").first()).toHaveText(/Electronics\s*12/);
    await expect(page.locator("#location-table tbody tr")).toHaveCount(8); // the top 8 places
    await expect(page.locator("#trend-table tbody tr")).not.toHaveCount(0);
  });

  test("picking a month narrows everything to that month, by week", async ({ page }) => {
    await expect(page.locator("#period-filter option")).toHaveText(["All time", "September 2026", "August 2026"]);
    await page.locator("#period-filter").selectOption("2026-09");
    await expect(stat(page, "Total reports").locator(".stat-value")).toHaveText("32");
    await expect(stat(page, "Total reports")).toContainText("In this period");
    await expect(page.locator("#trend-heading")).toHaveText("Reports by week");
  });

  test("a newly logged item is counted", async ({ page }) => {
    await page.getByRole("button", { name: "Add found item" }).click();
    const drawer = page.getByRole("dialog", { name: "Add found item" });
    await drawer.getByLabel(/Item name/).fill("Umbrella");
    await drawer.getByLabel(/Category/).selectOption("Others");
    await drawer.getByLabel(/Description/).fill("Red umbrella");
    await drawer.getByLabel(/Found at/).selectOption("chapel");
    await drawer.getByRole("button", { name: "Save item" }).click();
    await expect(stat(page, "Total reports").locator(".stat-value")).toHaveText("47");
    await expect(stat(page, "Found reports").locator(".stat-value")).toHaveText("23");
  });
});
