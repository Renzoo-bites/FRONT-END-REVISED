// My Reports (js/my-reports.js + UserAPI in js/mock-data.js): the student's reports and claims,
// each report's progress, and the found item SWAFO matched it to.
const { test, expect, loginAs, acceptNextDialog } = require("../fixtures");

const cardTitles = (page) => page.locator(".report-card-title");
const card = (page, name) => page.locator(".report-card", { hasText: name });
const detail = (page) => page.locator("#report-detail");

test.describe("my reports", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "user");
  });

  test("lists the student's reports and claims, newest first, with their status", async ({ page }) => {
    await page.goto("user/my-reports.html");
    await expect(cardTitles(page)).toHaveText([
      "Black Umbrella", "Smartphone with Blue Case", "Student ID", "Dorm Keys",
      "Wireless Earbuds", "Water Bottle", "Gray Backpack", "Brown Wallet",
    ]);
    await expect(card(page, "Black Umbrella")).toContainText("Pending");
    await expect(card(page, "Smartphone with Blue Case")).toContainText("Found · University Food Square · Oct 15 · FI-0231");
    await expect(card(page, "Smartphone with Blue Case")).toContainText("Owner found");
    await expect(card(page, "Student ID")).toContainText("Ready for claim");
    await expect(card(page, "Dorm Keys")).toContainText("Under review");
    await expect(card(page, "Wireless Earbuds")).toContainText("Match found");
    await expect(card(page, "Brown Wallet")).toContainText("Claim · Ugnayang La Salle (ULS) · Sep 11 · CL-0101");
    await expect(card(page, "Brown Wallet")).toContainText("Claimed");
  });

  test("opens on the match waiting for the student", async ({ page }) => {
    await page.goto("user/my-reports.html");
    await expect(card(page, "Wireless Earbuds")).toHaveAttribute("aria-current", "true");
    await expect(detail(page).getByRole("heading", { level: 2 })).toHaveText("Wireless Earbuds");
    await expect(detail(page)).toContainText("FI-0233 · Lost at Aklatang Emilio Aguinaldo – Main Building (AEA)");

    // Public details of the found item only, with the match score
    const match = detail(page).locator(".match-card");
    await expect(match.getByRole("link", { name: "Wireless Earbuds Case" })).toHaveAttribute("href", "item-details.html?id=FI-0235");
    await expect(match).toContainText("Found at Aklatang Emilio Aguinaldo – Main Building (AEA) · Oct 9");
    await expect(match).toContainText("92%");
    await expect(match).not.toContainText("Apple");

    await expect(detail(page).locator('.timeline [aria-current="step"]')).toContainText("Possible match found");
    await expect(detail(page).getByRole("link", { name: "Verify and claim" })).toHaveAttribute("href", "claim.html?id=FI-0235");
    await expect(detail(page).getByRole("button", { name: "Not mine" })).toBeVisible();
  });

  test("the filter chips count and narrow the list", async ({ page }) => {
    await page.goto("user/my-reports.html");
    for (const name of ["All · 8", "Lost · 5", "Found · 1", "Matches · 1", "Claims · 5"]) {
      await expect(page.getByRole("button", { name })).toBeVisible();
    }

    await page.getByRole("button", { name: "Found · 1" }).click();
    await expect(page.getByRole("button", { name: "Found · 1" })).toHaveAttribute("aria-pressed", "true");
    await expect(cardTitles(page)).toHaveText(["Smartphone with Blue Case"]);
    await expect(detail(page)).toContainText("Someone reported losing an item like this");

    await page.getByRole("button", { name: "Matches · 1" }).click();
    await expect(cardTitles(page)).toHaveText(["Wireless Earbuds"]);
  });

  test("clicking a report shows its progress", async ({ page }) => {
    await page.goto("user/my-reports.html");
    await card(page, "Dorm Keys").click();
    await expect(card(page, "Dorm Keys")).toHaveAttribute("aria-current", "true");
    await expect(card(page, "Wireless Earbuds")).not.toHaveAttribute("aria-current", "true");
    await expect(detail(page).getByRole("heading", { level: 2 })).toHaveText("Dorm Keys");
    await expect(detail(page)).toContainText("SWAFO is checking your answers");
    await expect(detail(page).getByRole("link", { name: "Message SWAFO" })).toHaveAttribute("href", "messages.html?item=FI-0222");
  });

  test("?id= opens a report, or the report a claim belongs to", async ({ page }) => {
    await page.goto("user/my-reports.html?id=FI-0223");
    await expect(detail(page).getByRole("heading", { level: 2 })).toHaveText("Student ID");
    await expect(detail(page)).toContainText("Pick it up at the SWAFO Office, GMH Building");
    await expect(detail(page)).toContainText("claim no. CL-0107");

    await page.goto("user/my-reports.html?id=CL-0108");
    await expect(detail(page).getByRole("heading", { level: 2 })).toHaveText("Dorm Keys");
  });

  test("Not mine sends the report back to Pending", async ({ page }) => {
    await page.goto("user/my-reports.html");
    acceptNextDialog(page);
    await detail(page).getByRole("button", { name: "Not mine" }).click();

    await expect(page.locator("#reports-notice")).toContainText("back to Pending");
    await expect(card(page, "Wireless Earbuds")).toContainText("Pending");
    await expect(detail(page)).toContainText("No match yet");
    await expect(page.getByRole("button", { name: "Matches · 0" })).toBeVisible();

    await page.reload();
    await expect(card(page, "Wireless Earbuds")).toContainText("Pending");
  });

  test("a pending report can be cancelled", async ({ page }) => {
    await page.goto("user/my-reports.html");
    await card(page, "Black Umbrella").click();
    acceptNextDialog(page);
    await detail(page).getByRole("button", { name: "Cancel this report" }).click();

    await expect(page.locator("#reports-notice")).toHaveText("Your black umbrella report was cancelled.");
    await expect(card(page, "Black Umbrella")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "All · 7" })).toBeVisible();
  });

  test("verifying and claiming a match, then SWAFO approving it", async ({ page, context }) => {
    await page.goto("user/my-reports.html");
    await detail(page).getByRole("link", { name: "Verify and claim" }).click();
    await expect(page).toHaveURL(/claim\.html\?id=FI-0235$/);

    await page.getByLabel("Full name").fill("Juan Dela Cruz");
    await page.getByLabel("Student / Employee ID").fill("202312345");
    await page.getByLabel("Email").fill("juan.personal@example.com"); // still linked through the login
    await page.getByLabel("Contact number").fill("0917 123 4567");
    await page.getByLabel("Brand").fill("Apple");
    await page.getByLabel("Describe the item in detail").fill("White AirPods case with a small scratch on the lid.");
    await page.getByLabel(/I certify/).check();
    await page.getByRole("button", { name: "Submit claim" }).click();
    await page.getByRole("link", { name: "Track my claims" }).click();

    await expect(page).toHaveURL(/my-reports\.html\?id=CL-0114$/);
    await expect(detail(page).getByRole("heading", { level: 2 })).toHaveText("Wireless Earbuds");
    await expect(card(page, "Wireless Earbuds")).toContainText("Under review");

    const admin = await context.newPage(); // SWAFO, in another tab of the same browser
    await loginAs(admin, "admin");
    await admin.goto("admin/claims.html");
    await admin.evaluate(() => AdminAPI.reviewClaim("CL-0114", "approved"));

    await expect(card(page, "Wireless Earbuds")).toContainText("Ready for claim");
    await expect(detail(page)).toContainText("claim no. CL-0114");
  });

  test("on a phone the match shows first, above the list", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("user/my-reports.html");
    await expect(detail(page).getByRole("link", { name: "Verify and claim" })).toBeInViewport();

    await card(page, "Brown Wallet").click();
    await expect(detail(page).getByRole("heading", { level: 2 })).toBeFocused();
    await expect(detail(page)).toBeInViewport();
  });
});

test("logged-out visitors are sent to the login page", async ({ page }) => {
  await page.goto("user/my-reports.html");
  await expect(page).toHaveURL(/login\.html$/);
});
