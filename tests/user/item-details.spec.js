// Item details (js/item-details.js): public fields only, the claim button, similar items.
const { test, expect } = require("../fixtures");

test.describe("item details", () => {
  test("shows the public details and links to the claim form", async ({ page }) => {
    await page.goto("user/item-details.html?id=FI-0231");
    const details = page.locator("#item-details");
    await expect(page).toHaveTitle("FindIt | Smartphone with Blue Case");
    await expect(details.getByRole("heading", { level: 1 })).toHaveText("Smartphone with Blue Case");
    await expect(details).toContainText("Reference no. FI-0231");
    await expect(details).toContainText("University Food Square");
    await expect(details).toContainText("October 15, 2026");
    await expect(details).toContainText("Available to claim");
    await expect(details.getByRole("link", { name: "Claim this item" })).toHaveAttribute("href", "claim.html?id=FI-0231");
  });

  test("never shows the SWAFO-only details", async ({ page }) => {
    await page.goto("user/item-details.html?id=FI-0231");
    const details = page.locator("#item-details");
    await expect(details).not.toContainText("Apple");
    await expect(details).not.toContainText("dog");
    await expect(details).not.toContainText("Electronics locker");
  });

  test("an item with an approved claim can't be claimed again", async ({ page }) => {
    await page.goto("user/item-details.html?id=FI-0224");
    await expect(page.locator("#item-details")).toContainText("Claim in progress");
    await expect(page.getByRole("button", { name: "Claim this item" })).toBeDisabled();
  });

  test("a returned item says so", async ({ page }) => {
    await page.goto("user/item-details.html?id=FI-0221");
    await expect(page.getByRole("button", { name: "Claim this item" })).toBeDisabled();
    await expect(page.locator("#item-details")).toContainText("already been returned to its owner");
  });

  test("an unknown item shows a not-found message", async ({ page }) => {
    await page.goto("user/item-details.html?id=FI-9999");
    await expect(page.getByRole("heading", { name: "This item isn't listed anymore" })).toBeVisible();
    await expect(page.locator("#crumb-current")).toHaveText("Item not found");
    await expect(page.locator("#similar-items")).toBeHidden();
  });

  test("similar items show the same category first and never the item itself", async ({ page }) => {
    await page.goto("user/item-details.html?id=FI-0231");
    const similar = page.locator("#similar-grid .card-title");
    await expect(similar).toHaveCount(4);
    await expect(similar.first()).toHaveText("Wireless Earbuds Case"); // the other Electronics item
    await expect(similar.filter({ hasText: "Smartphone with Blue Case" })).toHaveCount(0);
  });
});
