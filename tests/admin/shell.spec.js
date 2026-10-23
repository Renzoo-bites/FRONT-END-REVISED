// Admin sidebar and top bar (admin/js/admin.js), shared by every admin page.
const { test, expect, loginAs } = require("../fixtures");

const sidebar = (page) => page.locator("#sidebar");
const navLink = (page, name) => sidebar(page).getByRole("link", { name: new RegExp(`^${name}`) });

test.describe("admin sidebar", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
  });

  test("links to every admin page and marks the current one", async ({ page }) => {
    await page.goto("admin/reports.html");
    for (const name of ["Dashboard", "Reports", "Found Items", "Claims", "Messages", "Analytics", "Settings"]) {
      await expect(navLink(page, name)).toBeVisible();
    }
    await expect(navLink(page, "Reports")).toHaveAttribute("aria-current", "page");
    await expect(navLink(page, "Dashboard")).not.toHaveAttribute("aria-current", "page");
  });

  test("badges count pending reports, claims to review and unread messages", async ({ page }) => {
    await page.goto("admin/dashboard.html");
    await expect(navLink(page, "Reports").locator(".sidebar-count")).toHaveText("25");
    await expect(navLink(page, "Claims").locator(".sidebar-count")).toHaveText("8");
    await expect(navLink(page, "Messages").locator(".sidebar-count")).toHaveText("3");
    await expect(navLink(page, "Found Items").locator(".sidebar-count")).toHaveCount(0);
  });

  test("shows the logged-in admin", async ({ page }) => {
    await page.goto("admin/dashboard.html");
    await expect(page.locator("#sidebar-user")).toContainText("SWAFO Staff");
    await expect(page.locator("#sidebar-user")).toContainText("swafo@dlsud.edu.ph");
  });

  test("on wide screens the menu button collapses the sidebar, and it stays collapsed", async ({ page }) => {
    await page.goto("admin/dashboard.html");
    const toggle = page.locator("#sidebar-toggle");
    await expect(toggle).toHaveAttribute("aria-label", "Collapse sidebar");
    await toggle.click();
    await expect(page.locator("body")).toHaveClass(/sidebar-collapsed/);
    await expect(toggle).toHaveAttribute("aria-label", "Expand sidebar");

    await page.goto("admin/reports.html");
    await expect(page.locator("body")).toHaveClass(/sidebar-collapsed/);
    await page.locator("#sidebar-toggle").click();
    await expect(page.locator("body")).not.toHaveClass(/sidebar-collapsed/);
  });

  test("on small screens the menu button opens the sidebar, and Escape closes it", async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 900 });
    await page.goto("admin/dashboard.html");
    const toggle = page.locator("#sidebar-toggle");
    await expect(toggle).toHaveAttribute("aria-label", "Open menu");
    await toggle.click();
    await expect(page.locator("body")).toHaveClass(/sidebar-open/);
    await expect(toggle).toHaveAttribute("aria-label", "Close menu");
    await page.keyboard.press("Escape");
    await expect(page.locator("body")).not.toHaveClass(/sidebar-open/);
    await expect(toggle).toBeFocused();
  });

  test("Log out returns to the Admin login with a notice", async ({ page }) => {
    await page.goto("admin/dashboard.html");
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/login\.html\?role=admin&logged_out=1$/);
    await expect(page.getByRole("status")).toHaveText("You've been logged out.");
  });
});

test.describe("admin top bar", () => {
  test("the search box searches Reports from other pages", async ({ page }) => {
    await loginAs(page, "admin");
    await page.goto("admin/dashboard.html");
    const search = page.getByRole("searchbox", { name: "Search items and reports" });
    await search.fill("hoodie");
    await search.press("Enter");
    await expect(page).toHaveURL(/reports\.html\?q=hoodie$/);
    await expect(page.locator("#reports-body tr")).toHaveCount(2);
  });
});
