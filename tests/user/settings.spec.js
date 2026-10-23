// Student Settings (js/settings.js) and its link in the account menu (js/main.js).
const { test, expect, loginAs } = require("../fixtures");

// A 1×1 PNG for the profile photo upload
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

const toasts = (page) => page.locator("#toast-region");
const sidebar = (page) => page.getByRole("navigation", { name: "Settings sections" });

test("the account menu has Settings above a divider and Log out", async ({ page }) => {
  await loginAs(page, "user");
  await page.goto("user/index.html");
  await page.getByRole("button", { name: "Account menu" }).click();
  const menu = page.locator("#account-dropdown");
  await expect(menu.locator("a, button")).toHaveText(["My Reports", "Messages", "Settings", "Log out"]);
  await expect(menu.locator("hr + #nav-logout")).toHaveCount(1);

  await menu.getByRole("link", { name: "Settings" }).click();
  await expect(page).toHaveURL(/user\/settings\.html$/);
  await expect(page.getByRole("heading", { name: "Settings", level: 1 })).toBeVisible();
});

test("settings sends a logged-out visitor to the login page", async ({ page }) => {
  await page.goto("user/settings.html");
  await expect(page).toHaveURL(/login\.html$/);
});

test("confirming Delete account logs out and goes home", async ({ page }) => {
  // Logged in once (not with loginAs, which would log the tab back in on every page).
  await page.goto("user/about.html");
  await page.evaluate(() => sessionStorage.setItem("findit.session",
    JSON.stringify({ name: "Juan Dela Cruz", email: "student@example.com", role: "user" })));
  await page.goto("user/settings.html#danger-zone");

  await page.getByRole("button", { name: "Delete account" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete account" }).click();
  await expect(page).toHaveURL(/user\/index\.html$/);
  await expect(page.getByRole("banner").getByRole("link", { name: "Log in" })).toBeVisible();
});

test.describe("settings", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "user");
    await page.goto("user/settings.html");
  });

  test("the sidebar shows one section at a time", async ({ page }) => {
    await expect(sidebar(page).getByRole("link", { name: "Profile" })).toHaveAttribute("aria-current", "true");
    await expect(page.getByRole("heading", { name: "Profile", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Account", exact: true })).toBeHidden();

    await sidebar(page).getByRole("link", { name: "Account" }).click();
    await expect(page.getByRole("heading", { name: "Account", exact: true })).toBeFocused();
    await expect(page.getByRole("heading", { name: "Profile", exact: true })).toBeHidden();
    await expect(sidebar(page).getByRole("link", { name: "Account" })).toHaveAttribute("aria-current", "true");
    await expect(page).toHaveURL(/settings\.html#account$/);
  });

  test("on a phone the sections are stacked, without the sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(sidebar(page)).toBeHidden();
    for (const name of ["Profile", "Account", "Notifications", "Danger zone"]) {
      await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
    }
  });

  test("the profile shows the student's details, with the email read-only", async ({ page }) => {
    await expect(page.getByLabel("Full name")).toHaveValue("Juan Dela Cruz");
    await expect(page.getByLabel("Email", { exact: true })).toHaveValue("student@example.com");
    await expect(page.getByLabel("Email", { exact: true })).not.toBeEditable();
    await expect(page.locator("#photo-preview")).toHaveText("JD");
  });

  test("the profile shows inline errors, and clears each once it's fixed", async ({ page }) => {
    const name = page.getByLabel("Full name");
    const phone = page.getByLabel("Contact number");
    await name.fill("");
    await phone.fill("12ab");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(name).toHaveAttribute("aria-invalid", "true");
    await expect(name).toHaveAccessibleDescription("Enter your full name.");
    await expect(phone).toHaveAccessibleDescription(/Enter a valid contact number, like 0917 123 4567\.$/);
    await expect(name).toBeFocused();
    await expect(toasts(page)).toBeEmpty();

    await name.fill("Juan Dela Cruz");
    await expect(name).not.toHaveAttribute("aria-invalid");
    await expect(page.locator("#full-name-error")).toBeHidden();
    await expect(phone).toHaveAttribute("aria-invalid", "true");
  });

  test("saving the profile shows a toast, updates the navbar, and is kept", async ({ page }) => {
    await page.getByLabel("Full name").fill("Maria Santos");
    await page.getByLabel("Contact number").fill("0917 123 4567");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(toasts(page)).toContainText("Profile saved.");
    await expect(page.getByRole("button", { name: "Account menu" })).toHaveText("MS");
    await page.reload();
    await expect(page.getByLabel("Contact number")).toHaveValue("0917 123 4567");
  });

  test("a profile photo is checked, previewed, and can be removed", async ({ page }) => {
    const fileInput = page.locator("#photo");
    await fileInput.setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
    await expect(page.locator("#photo-error")).toHaveText("Choose an image file (JPG, PNG, or WebP).");

    await fileInput.setInputFiles({ name: "me.png", mimeType: "image/png", buffer: PNG });
    await expect(page.getByRole("img", { name: "Your profile photo" })).toBeVisible();
    await expect(page.locator("#photo-error")).toBeHidden();
    await expect(page.getByRole("button", { name: "Change photo" })).toBeVisible();

    await page.getByRole("button", { name: "Remove photo" }).click();
    await expect(page.getByRole("img", { name: "Your profile photo" })).toHaveCount(0);
    await expect(page.locator("#photo-preview")).toHaveText("JD");
    await expect(page.getByRole("button", { name: "Upload photo" })).toBeFocused();
  });

  test("changing the password checks the fields, then the current password", async ({ page }) => {
    await sidebar(page).getByRole("link", { name: "Account" }).click();
    const current = page.getByLabel(/^Current password/);
    const next = page.getByLabel(/^New password/);
    const confirm = page.getByLabel(/^Confirm new password/);

    await next.fill("short");
    await confirm.fill("different");
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(current).toHaveAccessibleDescription("Enter your current password.");
    await expect(next).toHaveAccessibleDescription(/Use at least 8 characters\.$/);
    await expect(confirm).toHaveAccessibleDescription("Passwords don't match.");
    await expect(current).toBeFocused();

    await current.fill("wrong-password");
    await next.fill("newpass123");
    await confirm.fill("newpass123");
    await expect(confirm).not.toHaveAttribute("aria-invalid");
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(current).toHaveAccessibleDescription("That's not your current password.");

    await current.fill("student123");
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(toasts(page)).toContainText("Password updated.");
    await expect(current).toHaveValue("");
    await expect(next).toHaveValue("");
  });

  test("each password box has its own show/hide button", async ({ page }) => {
    await sidebar(page).getByRole("link", { name: "Account" }).click();
    await page.getByLabel(/^New password/).fill("newpass123");
    await page.getByRole("button", { name: "Show new password" }).click();
    await expect(page.getByLabel(/^New password/)).toHaveAttribute("type", "text");
    await expect(page.getByLabel(/^Current password/)).toHaveAttribute("type", "password");
    await expect(page.getByRole("button", { name: "Hide new password" })).toBeVisible();
  });

  test("notification switches save right away and work from the keyboard", async ({ page }) => {
    await sidebar(page).getByRole("link", { name: "Notifications" }).click();
    await expect(page.getByRole("switch", { name: "Match found for my lost item" })).toBeChecked();
    const email = page.getByRole("switch", { name: "Email notifications" });
    await expect(email).not.toBeChecked();

    await email.focus();
    await page.keyboard.press("Space");
    await expect(email).toBeChecked();
    await expect(toasts(page)).toContainText("Notification settings saved.");

    await page.reload();
    await expect(page.getByRole("switch", { name: "Email notifications" })).toBeChecked();
  });

  test("Delete account asks first, and Cancel or Escape keeps the account", async ({ page }) => {
    await sidebar(page).getByRole("link", { name: "Danger zone" }).click();
    const open = page.getByRole("button", { name: "Delete account" });
    const dialog = page.getByRole("dialog", { name: "Delete your account?" });

    await open.click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(open).toBeFocused();

    await open.click();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/settings\.html#danger-zone$/);
  });
});
