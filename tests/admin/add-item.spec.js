// "+ Add found item" drawer (admin/js/add-item.js), on every admin page.
const { test, expect, loginAs } = require("../fixtures");

const PHOTO = {
  name: "umbrella.png",
  mimeType: "image/png",
  buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64"),
};

const drawer = (page) => page.getByRole("dialog", { name: "Add found item" });

async function fillItem(page) {
  const form = drawer(page);
  await form.getByLabel(/Item name/).fill("Umbrella");
  await form.getByLabel(/Category/).selectOption("Others");
  await form.getByLabel("Color").fill("Red");
  await form.getByLabel(/Description/).fill("Red folding umbrella");
  await form.getByLabel(/Found at/).selectOption("chapel");
  await form.getByLabel("Brand").fill("Totes");
  await form.getByLabel("Stored at").fill("Umbrella stand");
}

test.describe("add found item", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
  });

  test("opens with today's date, and Cancel closes it", async ({ page }) => {
    await page.goto("admin/dashboard.html");
    await page.getByRole("button", { name: "Add found item" }).click();
    await expect(drawer(page)).toBeVisible();
    await expect(drawer(page).getByLabel(/Item name/)).toBeFocused();
    await expect(drawer(page).getByLabel(/Date found/)).toHaveValue("2026-10-21");
    await expect(drawer(page).getByLabel(/Date found/)).toHaveAttribute("max", "2026-10-21");
    await drawer(page).getByRole("button", { name: "Cancel" }).click();
    await expect(drawer(page)).toBeHidden();
  });

  test("won't save without the required fields", async ({ page }) => {
    await page.goto("admin/dashboard.html");
    await page.getByRole("button", { name: "Add found item" }).click();
    await drawer(page).getByRole("button", { name: "Save item" }).click();
    await expect(drawer(page)).toBeVisible();
    await expect(page.locator(".toast")).toHaveCount(0);
  });

  test("previews a photo, can remove it, and refuses other files", async ({ page }) => {
    await page.goto("admin/dashboard.html");
    await page.getByRole("button", { name: "Add found item" }).click();
    const photo = drawer(page).getByLabel("Photo");
    await photo.setInputFiles(PHOTO);
    await expect(drawer(page).getByAltText("Preview of the photo")).toBeVisible();
    await drawer(page).getByRole("button", { name: "Remove photo" }).click();
    await expect(page.locator("#new-item-photo-preview")).toBeHidden();

    await photo.setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
    await expect(page.locator("#add-item-error")).toHaveText("Only photos can be attached.");
  });

  test("a saved item opens in Reports and shows a toast", async ({ page }) => {
    await page.goto("admin/reports.html");
    await page.getByRole("button", { name: "Add found item" }).click();
    await fillItem(page);
    await drawer(page).getByRole("button", { name: "Save item" }).click();

    await expect(drawer(page)).toBeHidden();
    await expect(page.locator(".toast")).toContainText("Umbrella was added as FI-0237 and is now on Browse.");
    await expect(page.locator("#reports-body tr").first()).toContainText("FI-0237");
    await expect(page.locator("#detail-id")).toHaveText("FI-0237");
    await expect(page.locator("#detail-body")).toContainText("Umbrella stand"); // SWAFO-only
    await expect(page.locator('[data-nav="reports"] .sidebar-count')).toHaveText("26");
  });

  test("a saved item is on Found Items and on the public Browse page", async ({ page, context }) => {
    await page.goto("admin/found-items.html");
    await page.getByRole("button", { name: "Add found item" }).click();
    await fillItem(page);
    await drawer(page).getByRole("button", { name: "Save item" }).click();
    await expect(page.locator("#detail-id")).toHaveText("FI-0237");
    await expect(page.locator("#found-summary")).toHaveText("Showing 12 of 12 items");

    const visitor = await context.newPage();
    await visitor.goto("user/items.html");
    await expect(visitor.locator("#item-grid .card-title").first()).toHaveText("Umbrella");
    await visitor.goto("user/item-details.html?id=FI-0237");
    await expect(visitor.locator("#item-details")).toContainText("Red folding umbrella");
    await expect(visitor.locator("#item-details")).not.toContainText("Totes"); // the brand stays private
  });
});
