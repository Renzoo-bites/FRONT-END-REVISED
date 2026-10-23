// Claim form (js/claim.js + js/claim-store.js): item summary, validation, and the claim
// reaching the admin Claims page.
const { test, expect, loginAs } = require("../fixtures");

async function fillClaim(page) {
  await page.getByLabel("Full name").fill("Lea Ramos");
  await page.getByLabel("Student / Employee ID").fill("202305511");
  await page.getByLabel("Email").fill("lea.ramos@example.com");
  await page.getByLabel("Contact number").fill("0927 555 0190");
  await page.getByLabel("Brand").fill("Fossil");
  await page.getByLabel("Describe the item in detail").fill("Black bi-fold wallet with my library card inside.");
  await page.getByLabel("Where did you lose it?").fill("AEA library");
  await page.getByLabel("When did you lose it?").fill("2026-10-16");
  await page.getByLabel(/I certify/).check();
}

test.describe("claim form", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "user");
    await page.goto("user/claim.html?id=FI-0236");
  });

  test("summarizes the item being claimed", async ({ page }) => {
    await expect(page).toHaveTitle("FindIt | Claim Black Leather Wallet");
    await expect(page.locator("#summary-heading")).toHaveText("Black Leather Wallet");
    await expect(page.locator("#summary-ref")).toHaveText("FI-0236");
    await expect(page.locator("#summary-found")).toHaveText("Aklatang Emilio Aguinaldo – Main Building (AEA)");
    await expect(page.locator("#summary-date")).toHaveText("Oct 16, 2026");
    await expect(page.locator("#crumb-item")).toHaveAttribute("href", "item-details.html?id=FI-0236");
    await expect(page.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", "item-details.html?id=FI-0236");
  });

  test("won't submit without the required answers", async ({ page }) => {
    await page.getByRole("button", { name: "Submit claim" }).click();
    await expect(page.locator("#claim-success")).toBeHidden();

    await fillClaim(page);
    await page.getByLabel(/I certify/).uncheck();
    await page.getByRole("button", { name: "Submit claim" }).click();
    await expect(page.locator("#claim-success")).toBeHidden();
  });

  test("a complete claim shows the confirmation", async ({ page }) => {
    await fillClaim(page);
    await page.getByRole("button", { name: "Submit claim" }).click();
    await expect(page.getByRole("heading", { name: "Claim submitted!" })).toBeVisible();
    await expect(page.locator("#claim-success")).toBeFocused();
    await expect(page.locator("#claim-form")).toBeHidden();
    await expect(page.getByRole("link", { name: "Track my claims" })).toHaveAttribute("href", "my-reports.html?id=CL-0114");
  });

  test("the claim shows up for SWAFO to review", async ({ page, context }) => {
    await fillClaim(page);
    await page.getByRole("button", { name: "Submit claim" }).click();
    await expect(page.locator("#claim-success")).toBeVisible();

    const admin = await context.newPage(); // another tab of the same browser
    await loginAs(admin, "admin");
    await admin.goto("admin/claims.html");
    const row = admin.locator("#claims-body tr").first();
    await expect(row).toContainText("Lea Ramos");
    await expect(row).toContainText("CL-0114");
    await expect(row).toContainText("Black Leather Wallet");
    await expect(row).toContainText("Under review");
  });
});
