// Navbar and footer (js/main.js), shared by every public page.
const { test, expect, loginAs, NOW } = require("../fixtures");

test.describe("navbar", () => {
  test("a visitor sees Log in, Sign up and About", async ({ page }) => {
    await page.goto("user/index.html");
    const nav = page.getByRole("banner");
    await expect(nav.getByRole("link", { name: "Log in" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Sign up" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "About" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "My Reports" })).toHaveCount(0);
  });

  test("highlights the current page", async ({ page }) => {
    await page.goto("user/items.html");
    await expect(page.getByRole("banner").getByRole("link", { name: "Browse" })).toHaveAttribute("aria-current", "page");
  });

  test("a logged-in student gets My Reports and the account menu", async ({ page }) => {
    await loginAs(page, "user");
    await page.goto("user/index.html");
    const nav = page.getByRole("banner");
    await expect(nav.getByRole("link", { name: "My Reports" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Log in" })).toHaveCount(0);

    const menuButton = nav.getByRole("button", { name: "Account menu" });
    await expect(menuButton).toHaveText("JD");
    await menuButton.click();
    await expect(menuButton).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#account-dropdown")).toContainText("student@example.com");
    await expect(page.locator("#account-dropdown").getByRole("link", { name: "Admin dashboard" })).toHaveCount(0);

    await page.keyboard.press("Escape");
    await expect(page.locator("#account-dropdown")).toBeHidden();
    await expect(menuButton).toBeFocused();
  });

  test("clicking outside closes the account menu", async ({ page }) => {
    await loginAs(page, "user");
    await page.goto("user/index.html");
    await page.getByRole("button", { name: "Account menu" }).click();
    await page.locator("main").click({ position: { x: 5, y: 5 } });
    await expect(page.locator("#account-dropdown")).toBeHidden();
  });

  test("an admin also gets a link to the admin dashboard", async ({ page }) => {
    await loginAs(page, "admin");
    await page.goto("user/index.html");
    await page.getByRole("button", { name: "Account menu" }).click();
    await expect(page.getByRole("link", { name: "Admin dashboard" })).toHaveAttribute("href", "../admin/dashboard.html");
  });

  test("Log out ends the session and goes home", async ({ page }) => {
    // Logged in once (not with loginAs, which would log the tab back in on every page).
    await page.goto("user/about.html");
    await page.evaluate(() => sessionStorage.setItem("findit.session",
      JSON.stringify({ name: "Juan Dela Cruz", email: "student@example.com", role: "user" })));
    await page.reload();

    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/index\.html$/);
    await expect(page.getByRole("banner").getByRole("link", { name: "Log in" })).toBeVisible();
  });
});

test.describe("footer", () => {
  test("links to the main pages", async ({ page }) => {
    await page.goto("user/index.html");
    const footer = page.getByRole("contentinfo");
    for (const name of ["Browse items", "Report an item", "My Reports", "About"]) {
      await expect(footer.getByRole("link", { name })).toBeVisible();
    }
    await expect(footer).toContainText(`© ${NOW.getFullYear()} SWAFO Lost and Found`);
  });
});
