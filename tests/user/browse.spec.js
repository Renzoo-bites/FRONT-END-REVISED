// Home page search and the Browse page (js/items.js): search, brand privacy, filters.
const { test, expect } = require("../fixtures");

const cardTitles = (page) => page.locator("#item-grid .card-title");

test.describe("home page", () => {
  test("the search bar opens Browse with the results", async ({ page }) => {
    await page.goto("user/index.html");
    await page.getByRole("searchbox", { name: "Search for items" }).fill("umbrella");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page).toHaveURL(/items\.html\?q=umbrella$/);
    await expect(cardTitles(page)).toHaveText(["Navy Blue Umbrella"]);
  });

  test("the feature cards link to Browse and Report", async ({ page }) => {
    await page.goto("user/index.html");
    await expect(page.getByRole("link", { name: /Find an Item/ })).toHaveAttribute("href", "items.html");
    await expect(page.getByRole("link", { name: /Report an Item/ }).first()).toHaveAttribute("href", "report.html");
  });
});

test.describe("browse", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("user/items.html");
  });

  test("lists every item still waiting for its owner", async ({ page }) => {
    await expect(page.locator("#result-count")).toHaveText("Showing 10 items");
    await expect(cardTitles(page)).toHaveCount(10);
    await expect(cardTitles(page).first()).toHaveText("Black Leather Wallet"); // newest first
    // Brown Wallet was already returned, so it's off the list.
    await expect(page.getByRole("link", { name: "Brown Wallet" })).toHaveCount(0);
  });

  test("each card links to its item details", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Black Leather Wallet" })).toHaveAttribute("href", "item-details.html?id=FI-0236");
  });

  test("searching filters as you type", async ({ page }) => {
    await page.locator("#item-search input").fill("wallet");
    await expect(cardTitles(page)).toHaveText(["Black Leather Wallet"]);
    await expect(page.locator("#result-count")).toHaveText("Showing 1 item");
  });

  test("a brand search shows every item of that kind, with a note", async ({ page }) => {
    await page.locator("#item-search input").fill("iPhone 13");
    await expect(cardTitles(page)).toHaveText(["Smartphone with Blue Case"]);
    await expect(page.locator("#search-notice")).toBeVisible();
    await expect(page.locator("#search-notice-text")).toContainText("we're showing all phones instead");
  });

  test("different brands give the same results, so the brand isn't revealed", async ({ page }) => {
    const search = page.locator("#item-search input");
    await search.fill("Apple");
    const apple = await cardTitles(page).allTextContents();
    await search.fill("Samsung");
    await expect(cardTitles(page)).toHaveText(apple);
  });

  test("SWAFO-only details are never searched", async ({ page }) => {
    // "dog" is only in the phone's private identifying details.
    await page.locator("#item-search input").fill("dog");
    await expect(cardTitles(page)).toHaveCount(0);
    await expect(page.locator("#empty-state")).toBeVisible();
    await expect(page.locator("#result-count")).toHaveText("Showing 0 items");
  });

  test("category, location and date filters", async ({ page }) => {
    await page.getByLabel("Bags").check();
    await expect(cardTitles(page)).toHaveText(["Black Leather Wallet", "Gray Backpack"]);
    await page.getByLabel("Bags").uncheck();

    await page.locator("#filter-location").selectOption("aea-main");
    await expect(cardTitles(page)).toHaveCount(4);
    await page.locator("#filter-location").selectOption("");

    await page.locator("#filter-date").selectOption("7");
    await expect(cardTitles(page)).toHaveText(["Black Leather Wallet", "Smartphone with Blue Case"]);
  });

  test("Clear all resets the search and the filters", async ({ page }) => {
    await page.locator("#item-search input").fill("wallet");
    await page.getByLabel("Electronics").check();
    await expect(cardTitles(page)).toHaveCount(0);
    await page.getByRole("button", { name: "Clear all" }).click();
    await expect(page.locator("#item-search input")).toHaveValue("");
    await expect(page.getByLabel("Electronics")).not.toBeChecked();
    await expect(cardTitles(page)).toHaveCount(10);
  });

  test("on a phone the filters fold behind a button", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const toggle = page.locator("#filters-toggle");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#filters")).toHaveClass(/is-open/);
  });
});
