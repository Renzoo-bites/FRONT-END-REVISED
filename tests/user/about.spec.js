// About page (js/about.js): office details from the admin Settings (js/settings-store.js).
const { test, expect } = require("../fixtures");

test.describe("about", () => {
  test("shows the office details", async ({ page }) => {
    await page.goto("user/about.html");
    await expect(page.locator("#office-location")).toHaveText("GMH Building");
    await expect(page.locator("#office-hours")).toHaveText("Monday–Friday, 8:00 AM – 5:00 PM");
    await expect(page.locator("#office-email")).toHaveText("swafo_helpdesk@dlsud.edu.ph");
    await expect(page.locator("#office-email")).toHaveAttribute("href", "mailto:swafo_helpdesk@dlsud.edu.ph");
  });

  test("uses the details SWAFO saved in Settings", async ({ page }) => {
    await page.goto("user/about.html");
    await page.evaluate(() => SettingsStore.save({
      ...SettingsStore.get(),
      office: { ...SettingsStore.get().office, location: "Room 101, Ugnayan Center", email: "swafo@dlsud.edu.ph" },
    }));
    await page.reload();
    await expect(page.locator("#office-location")).toHaveText("Room 101, Ugnayan Center");
    await expect(page.locator("#office-email")).toHaveAttribute("href", "mailto:swafo@dlsud.edu.ph");
  });
});
