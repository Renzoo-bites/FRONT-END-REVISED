// Notification bell (admin/js/notifications.js): unread messages, new claims and sample notices.
const { test, expect, loginAs } = require("../fixtures");

const bell = (page) => page.locator("#notif-btn");
const items = (page) => page.locator("#notif-panel .notif-item");

test.describe("notification bell", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
    await page.goto("admin/dashboard.html");
  });

  test("shows a dot and the unread count", async ({ page }) => {
    await expect(bell(page).locator(".notif-dot")).toBeVisible();
    await expect(bell(page)).toHaveAttribute("aria-label", "Notifications, 10 unread");
  });

  test("lists messages, claims and notices, newest first", async ({ page }) => {
    await bell(page).click();
    await expect(page.locator("#notif-panel")).toBeVisible();
    await expect(bell(page)).toHaveAttribute("aria-expanded", "true");
    await expect(items(page)).toHaveCount(10);
    await expect(items(page).first()).toContainText("Maria Santos sent a message");
    await expect(items(page).filter({ hasText: "New claim to review" })).toHaveCount(4);
    await expect(items(page).filter({ hasText: "Ana Cruz claimed" })).toHaveAttribute("href", "claims.html?id=CL-0113");
  });

  test("Mark all as read clears the dot, and stays read after a reload", async ({ page }) => {
    await bell(page).click();
    await page.getByRole("button", { name: "Mark all as read" }).click();
    await expect(bell(page).locator(".notif-dot")).toBeHidden();
    await expect(bell(page)).toHaveAttribute("aria-label", "Notifications");
    await page.reload();
    await expect(bell(page).locator(".notif-dot")).toBeHidden();
    await bell(page).click();
    await expect(page.getByRole("button", { name: "Mark all as read" })).toBeDisabled();
  });

  test("the panel stays open after Mark all as read", async ({ page }) => {
    // The panel re-renders before the click reaches the "click outside" handler.
    await bell(page).click();
    await page.getByRole("button", { name: "Mark all as read" }).click();
    await expect(page.locator("#notif-panel")).toBeVisible({ timeout: 1500 });
  });

  test("opening a notification marks it read and goes to it", async ({ page }) => {
    await bell(page).click();
    await items(page).filter({ hasText: "Ana Cruz claimed" }).click();
    await expect(page).toHaveURL(/claims\.html\?id=CL-0113$/);
    await expect(page.locator("#detail-panel")).toHaveClass(/is-open/);
    await expect(bell(page)).toHaveAttribute("aria-label", "Notifications, 9 unread");
  });

  test("closes with Escape or a click outside", async ({ page }) => {
    await bell(page).click();
    await page.keyboard.press("Escape");
    await expect(page.locator("#notif-panel")).toBeHidden();
    await expect(bell(page)).toBeFocused();

    await bell(page).click();
    await page.locator("main").click({ position: { x: 5, y: 5 } });
    await expect(page.locator("#notif-panel")).toBeHidden();
  });
});
