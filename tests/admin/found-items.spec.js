// Found Items (admin/js/found-items.js): the office inventory, filters, search and status actions.
const { test, expect, loginAs } = require("../fixtures");

const cards = (page) => page.locator("#found-grid .found-card-btn");
const tab = (page, name) => page.locator("#item-tabs .status-tab").filter({ hasText: name });

test.describe("found items", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
    await page.goto("admin/found-items.html");
  });

  test("lists every item SWAFO holds, with status tabs", async ({ page }) => {
    await expect(cards(page)).toHaveCount(11);
    await expect(page.locator("#found-summary")).toHaveText("Showing 11 of 11 items");
    await expect(tab(page, "Pending").locator(".tab-count")).toHaveText("4");
    await expect(tab(page, "Claimed").locator(".tab-count")).toHaveText("1");
    await tab(page, "Ready").click();
    await expect(cards(page)).toHaveCount(3);
  });

  test("category and location filters", async ({ page }) => {
    await page.locator("#item-category").selectOption("Bags");
    await expect(cards(page)).toHaveCount(3);
    await page.locator("#item-location").selectOption("aea-main");
    await expect(cards(page)).toHaveCount(2);
  });

  test("SWAFO can search the private details too", async ({ page }) => {
    await page.getByRole("searchbox").fill("Aquaflask"); // the bottle's brand, hidden on Browse
    await expect(cards(page)).toHaveText([/Stainless Water Bottle/]);
    await page.getByRole("searchbox").fill("Cabinet A");
    await expect(cards(page)).toHaveCount(2);
  });

  test("the panel shows the SWAFO-only details and only the status button", async ({ page }) => {
    await cards(page).filter({ hasText: "Smartphone with Blue Case" }).click();
    const body = page.locator("#detail-body");
    await expect(page.locator("#detail-id")).toHaveText("FI-0231");
    await expect(body.locator(".private-box")).toContainText("Apple");
    await expect(body.locator(".private-box")).toContainText("Electronics locker");
    await expect(body.locator(".detail-actions .admin-btn")).toHaveText(["Mark as Ready for claim"]);
  });

  test("status changes reach the public pages", async ({ page, context }) => {
    await page.goto("admin/found-items.html?id=FI-0229"); // ready
    await page.getByRole("button", { name: "Mark as Claimed (returned)" }).click();
    await expect(page.getByRole("button", { name: "Returned to owner" })).toBeDisabled();
    await expect(tab(page, "Claimed").locator(".tab-count")).toHaveText("2");

    const visitor = await context.newPage();
    await visitor.goto("user/items.html");
    await expect(visitor.getByRole("link", { name: "Stainless Water Bottle" })).toHaveCount(0);
  });

  test("Escape closes the panel", async ({ page }) => {
    await page.goto("admin/found-items.html?id=FI-0236");
    await expect(page.locator("#detail-panel")).toHaveClass(/is-open/);
    await page.keyboard.press("Escape");
    await expect(page.locator("#detail-panel")).not.toHaveClass(/is-open/);
  });
});
