// Settings (admin/js/settings.js): office details, bell preferences and the demo reset.
const { test, expect, loginAs, acceptNextDialog } = require("../fixtures");

test.describe("settings", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
    await page.goto("admin/settings.html");
  });

  test("shows the saved office details and the account", async ({ page }) => {
    await expect(page.locator("#office-name")).toHaveValue("SWAFO Office");
    await expect(page.locator("#office-location")).toHaveValue("GMH Building");
    await expect(page.locator("#office-email")).toHaveValue("swafo_helpdesk@dlsud.edu.ph");
    await expect(page.locator("#account-name")).toHaveText("SWAFO Staff");
    await expect(page.locator("#notif-switches .switch")).toHaveCount(4);
    for (const box of await page.locator("#notif-switches .switch").all()) await expect(box).toBeChecked();
  });

  test("saved office details show on the About page and in student Messages", async ({ page, context }) => {
    await page.locator("#office-location").fill("Room 101, Ugnayan Center");
    await page.locator("#office-pickupHours").fill("Mon–Sat, 9AM–4PM");
    await page.locator("#office-form").getByRole("button", { name: /Save/ }).click();
    await expect(page.locator("#office-status")).toHaveText("Saved. Students see the new details right away.");

    await page.locator("#office-location").press("End"); // typing again clears the message
    await page.locator("#office-location").pressSequentially(" ");
    await expect(page.locator("#office-status")).toHaveText("");

    const student = await context.newPage();
    await loginAs(student, "user");
    await student.goto("user/about.html");
    await expect(student.locator("#office-location")).toHaveText("Room 101, Ugnayan Center");
    await student.goto("user/messages.html");
    await expect(student.locator("#info-panel")).toContainText("Mon–Sat, 9AM–4PM");
  });

  test("won't save an office without its details", async ({ page }) => {
    await page.locator("#office-email").fill("");
    await page.locator("#office-form").getByRole("button", { name: /Save/ }).click();
    await expect(page.locator("#office-status")).toHaveText("");
  });

  test("turning off a notification type hides it from the bell", async ({ page }) => {
    await page.locator('#notif-switches .switch[data-type="claim"]').uncheck();
    await expect(page.locator("#notif-status")).toHaveText("Saved.");
    await expect(page.locator("#notif-btn")).toHaveAttribute("aria-label", "Notifications, 6 unread");
    await page.reload();
    await expect(page.locator('#notif-switches .switch[data-type="claim"]')).not.toBeChecked();
  });

  test("Reset demo data puts the samples back", async ({ page }) => {
    await page.evaluate(() => AdminAPI.reviewClaim("CL-0113", "rejected"));
    await page.reload();
    await expect(page.locator('[data-nav="claims"] .sidebar-count')).toHaveText("7");

    page.once("dialog", (dialog) => dialog.dismiss());
    await page.getByRole("button", { name: "Reset demo data" }).click();
    await expect(page.locator('[data-nav="claims"] .sidebar-count')).toHaveText("7");

    acceptNextDialog(page);
    await page.getByRole("button", { name: "Reset demo data" }).click();
    await expect(page.locator('[data-nav="claims"] .sidebar-count')).toHaveText("8");
  });
});
