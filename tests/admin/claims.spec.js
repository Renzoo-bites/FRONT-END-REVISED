// Claims (admin/js/claims.js): the review queue, proof vs. SWAFO's record, and decisions.
const { test, expect, loginAs, acceptNextDialog } = require("../fixtures");

const rows = (page) => page.locator("#claims-body tr[data-id]");
const tab = (page, name) => page.locator("#claim-tabs .status-tab").filter({ hasText: name });
const body = (page) => page.locator("#detail-body");

async function openClaim(page, id) {
  await page.goto(`admin/claims.html?id=${id}`);
  await expect(page.locator("#detail-id")).toHaveText(id);
}

test.describe("claims", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
  });

  test("opens on the claims waiting for review, newest first", async ({ page }) => {
    await page.goto("admin/claims.html");
    await expect(tab(page, "Under review")).toHaveAttribute("aria-pressed", "true");
    await expect(rows(page)).toHaveCount(8);
    await expect(rows(page).first()).toContainText("Ana Cruz");
    await expect(page.locator("#claims-summary")).toHaveText("Showing 8 of 13 claims");
    await expect(tab(page, "Approved").locator(".tab-count")).toHaveText("4");
    await expect(tab(page, "Rejected").locator(".tab-count")).toHaveText("1");
    await expect(tab(page, "All").locator(".tab-count")).toHaveText("13");
  });

  test("the search box filters by claimant, item or ID", async ({ page }) => {
    await page.goto("admin/claims.html");
    const search = page.getByRole("searchbox");
    await search.fill("Maria");
    await expect(rows(page)).toHaveText([/Maria Santos/]);
    await search.fill("FI-0229");
    await expect(tab(page, "All").locator(".tab-count")).toHaveText("2");
  });

  test("puts the claimant's answers next to SWAFO's record", async ({ page }) => {
    await openClaim(page, "CL-0112");
    await expect(page.locator("#detail-name")).toHaveText("Maria Santos");
    await expect(body(page)).toContainText("202301234");
    await expect(body(page).getByRole("link", { name: "maria.santos@example.com" })).toHaveAttribute("href", "mailto:maria.santos@example.com");
    await expect(body(page)).toContainText("iphone-box-serial.jpg");
    await expect(body(page)).toContainText("Matches record"); // said Apple, the record says Apple
    await expect(body(page)).toContainText("Electronics locker");
  });

  test("flags a brand that doesn't match the record", async ({ page }) => {
    await openClaim(page, "CL-0105"); // said Samsung, the earbuds are Apple AirPods
    await expect(body(page)).toContainText("Doesn't match");
  });

  test("Approve is off when another claim for the item was approved", async ({ page }) => {
    await openClaim(page, "CL-0113");
    await expect(body(page).getByRole("note")).toHaveText("Juan Dela Cruz's claim for this item was already approved (CL-0110).");
    await expect(page.getByRole("button", { name: "Approve claim" })).toBeDisabled();
  });

  test("approving a claim makes the item ready, then it can be picked up", async ({ page, context }) => {
    await openClaim(page, "CL-0112");
    await page.getByRole("button", { name: "Approve claim" }).click();
    await expect(body(page).locator(".detail-title")).toContainText("Approved");
    await expect(page.locator('[data-nav="claims"] .sidebar-count')).toHaveText("7");

    const visitor = await context.newPage();
    await visitor.goto("user/item-details.html?id=FI-0231");
    await expect(visitor.locator("#item-details")).toContainText("Claim in progress");

    await page.getByRole("button", { name: "Mark as picked up" }).click();
    await expect(page.getByRole("button", { name: "Picked up" })).toBeDisabled();
    await visitor.goto("user/items.html");
    await expect(visitor.getByRole("link", { name: "Smartphone with Blue Case" })).toHaveCount(0);
  });

  test("rejecting asks first", async ({ page }) => {
    await openClaim(page, "CL-0104");
    page.once("dialog", (dialog) => dialog.dismiss());
    await page.getByRole("button", { name: "Reject", exact: true }).click();
    await expect(body(page).locator(".detail-title")).toContainText("Under review");

    acceptNextDialog(page);
    await page.getByRole("button", { name: "Reject", exact: true }).click();
    await expect(body(page).locator(".detail-title")).toContainText("Rejected");
    await expect(tab(page, "Rejected").locator(".tab-count")).toHaveText("2");
  });

  test("?id= of a reviewed claim switches to the All tab", async ({ page }) => {
    await openClaim(page, "CL-0101");
    await expect(tab(page, "All")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#detail-panel")).toHaveClass(/is-open/);
  });

  test("a claim from the student side appears live in another tab", async ({ page, context }) => {
    await page.goto("admin/claims.html");
    await expect(rows(page)).toHaveCount(8);
    const student = await context.newPage();
    await loginAs(student, "user");
    await student.goto("user/claim.html?id=FI-0218");
    await student.getByLabel("Full name").fill("Juan Dela Cruz");
    await student.getByLabel("Student / Employee ID").fill("202312345");
    await student.getByLabel("Email").fill("student@example.com");
    await student.getByLabel("Contact number").fill("0917 123 4567");
    await student.getByLabel("Describe the item in detail").fill("Navy umbrella with a wooden handle.");
    await student.getByLabel(/I certify/).check();
    await student.getByRole("button", { name: "Submit claim" }).click();

    await expect(rows(page)).toHaveCount(9);
    await expect(rows(page).first()).toContainText("Navy Blue Umbrella");
  });
});
