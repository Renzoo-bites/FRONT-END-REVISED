// Report pages: the lost/found chooser, the report form (js/report-form.js), and "Report submitted".
const { test, expect, loginAs } = require("../fixtures");

// A 1x1 PNG, for the photo preview
const PHOTO = {
  name: "umbrella.png",
  mimeType: "image/png",
  buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64"),
};

test.describe("report chooser", () => {
  test("offers a lost report and a found report", async ({ page }) => {
    await page.goto("user/report.html");
    await expect(page.getByRole("link", { name: "Report a lost item" })).toHaveAttribute("href", "report-form.html?type=lost");
    await expect(page.getByRole("link", { name: "Report a found item" })).toHaveAttribute("href", "report-form.html?type=found");
  });
});

test.describe("report form", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "user");
  });

  test("starts as a lost report", async ({ page }) => {
    await page.goto("user/report-form.html");
    await expect(page.locator("#type-lost")).toBeChecked();
    await expect(page.getByText("Where and when did you lose it?")).toBeVisible();
    await expect(page.getByLabel(/Date lost/)).toBeVisible();
    await expect(page.locator("#item-now")).toBeHidden();
    await expect(page.locator("#item-now")).toBeDisabled(); // left out of the submission
  });

  test("?type=found opens it as a found report", async ({ page }) => {
    await page.goto("user/report-form.html?type=found");
    await expect(page.locator("#type-found")).toBeChecked();
    await expect(page.getByLabel(/Date found/)).toBeVisible();
    await expect(page.getByLabel("Where is the item now?")).toBeEnabled();
  });

  test("switching between Lost and Found swaps the wording and fields", async ({ page }) => {
    await page.goto("user/report-form.html");
    await page.getByText("I found an item").click();
    await expect(page.getByText("Where and when did you find it?")).toBeVisible();
    await expect(page.getByLabel("Where is the item now?")).toBeVisible();
    await page.getByText("I lost an item").click();
    await expect(page.getByText("Where and when did you lose it?")).toBeVisible();
    await expect(page.locator("#item-now")).toBeHidden();
  });

  test("uses the site-wide category and location lists", async ({ page }) => {
    await page.goto("user/report-form.html");
    await expect(page.locator("#category option")).toHaveText(["Select a category", "Electronics", "Bags", "Clothing", "ID & Docs", "Accessories", "Others"]);
    await expect(page.locator("#location option")).toHaveCount(52); // placeholder + 50 places + Other / Not sure
  });

  test("a chosen photo is previewed", async ({ page }) => {
    await page.goto("user/report-form.html");
    await expect(page.locator("#photo-preview")).toBeHidden();
    await page.getByLabel("Photo").setInputFiles(PHOTO);
    await expect(page.getByAltText("Preview of the selected photo")).toBeVisible();
    await page.getByLabel("Photo").setInputFiles([]);
    await expect(page.locator("#photo-preview")).toBeHidden();
  });

  test("won't submit without the required fields", async ({ page }) => {
    await page.goto("user/report-form.html");
    await page.getByRole("button", { name: "Submit report" }).click();
    await expect(page).toHaveURL(/report-form\.html$/);
  });

  test("a complete report goes to the confirmation page", async ({ page }) => {
    await page.goto("user/report-form.html");
    await page.getByLabel(/Item name/).fill("Umbrella");
    await page.getByLabel(/Category/).selectOption("Others");
    await page.getByLabel(/Description/).fill("Red folding umbrella");
    await page.getByLabel(/Location/, { exact: false }).first().selectOption("chapel");
    await page.getByLabel(/Date lost/).fill("2026-10-20");
    await page.getByLabel(/Full name/).fill("Juan Dela Cruz");
    await page.getByLabel(/Student \/ Employee ID/).fill("202312345");
    await page.getByLabel(/Email/).fill("student@example.com");
    await page.getByRole("button", { name: "Submit report" }).click();

    await expect(page).toHaveURL(/report-submitted\.html$/);
    await expect(page.getByRole("heading", { name: "Report submitted!" })).toBeVisible();
    await expect(page.getByRole("link", { name: "View my reports" })).toHaveAttribute("href", "my-reports.html");
  });
});
