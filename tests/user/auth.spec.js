// Login (js/login.js + js/auth.js), sign up, and the pages that need a login.
const { test, expect } = require("../fixtures");

async function logIn(page, { email, password, side = "Student or employee" }) {
  await page.getByText(side, { exact: true }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
}

test.describe("login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("user/login.html");
  });

  test("a student logs in and lands on My Reports", async ({ page }) => {
    await logIn(page, { email: "student@example.com", password: "student123" });
    await expect(page).toHaveURL(/my-reports\.html$/);
    await expect(page.getByRole("button", { name: "Account menu" })).toHaveText("JD");
  });

  test("an admin logs in on the Admin side and lands on the dashboard", async ({ page }) => {
    await logIn(page, { email: "swafo@dlsud.edu.ph", password: "admin123", side: "SWAFO staff" });
    await expect(page).toHaveURL(/admin\/dashboard\.html$/);
  });

  test("a wrong password shows an error and clears the password", async ({ page }) => {
    await logIn(page, { email: "student@example.com", password: "wrong-password" });
    await expect(page.getByRole("alert")).toHaveText("Incorrect email or password.");
    await expect(page.getByLabel("Password", { exact: true })).toHaveValue("");
    await expect(page.getByLabel("Password", { exact: true })).toBeFocused();
    await expect(page).toHaveURL(/login\.html$/);
  });

  test("an admin account can't log in on the User side", async ({ page }) => {
    await logIn(page, { email: "swafo@dlsud.edu.ph", password: "admin123" });
    await expect(page.getByRole("alert")).toHaveText("This is an admin account. Switch to Admin to log in.");
  });

  test("a student account can't log in on the Admin side", async ({ page }) => {
    await logIn(page, { email: "student@example.com", password: "student123", side: "SWAFO staff" });
    await expect(page.getByRole("alert")).toHaveText("This account doesn't have admin access.");
  });

  test("the eye button shows and hides the password", async ({ page }) => {
    const password = page.getByLabel("Password", { exact: true });
    await password.fill("student123");
    await expect(password).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(password).toHaveAttribute("type", "text");
    await expect(password).toHaveValue("student123");
    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(password).toHaveAttribute("type", "password");
  });

  test("the Student / SWAFO staff switch changes the wording", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Log in");
    await expect(page.getByText("No account yet?")).toBeVisible();
    await page.getByText("SWAFO staff", { exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Log in to SWAFO admin");
    await expect(page.getByText("Staff accounts are set up by the SWAFO office.")).toBeVisible();
    await expect(page.getByText("No account yet?")).toBeHidden();
  });

  test("?role=admin&logged_out=1 opens on the SWAFO staff side with a logged-out notice", async ({ page }) => {
    await page.goto("user/login.html?role=admin&logged_out=1");
    await expect(page.locator("#role-admin")).toBeChecked();
    await expect(page.getByRole("status")).toHaveText("You've been logged out.");
  });
});

test.describe("sign up", () => {
  test("required fields and the 8-character password are checked before submitting", async ({ page }) => {
    await page.goto("user/signup.html");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/signup\.html$/);

    await page.getByLabel("Full name").fill("New Student");
    await page.getByLabel("Student / employee ID").fill("202600001");
    await page.getByLabel("Email").fill("new.student@example.com");
    await page.getByLabel("Password", { exact: true }).fill("short");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/signup\.html$/);
    expect(await page.getByLabel("Password", { exact: true }).evaluate((input) => input.validity.tooShort)).toBe(true);
  });

  test("a complete form goes on to the login page", async ({ page }) => {
    await page.goto("user/signup.html");
    await page.getByLabel("Full name").fill("New Student");
    await page.getByLabel("Student / employee ID").fill("202600001");
    await page.getByLabel("Email").fill("new.student@example.com");
    await page.getByLabel("Password", { exact: true }).fill("longenough");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/login\.html$/);
  });
});

test.describe("pages that need a login", () => {
  test("Messages sends a visitor to the login page", async ({ page }) => {
    await page.goto("user/messages.html");
    await expect(page).toHaveURL(/login\.html$/);
  });

  test("admin pages send a visitor to the Admin login", async ({ page }) => {
    for (const adminPage of ["dashboard", "reports", "found-items", "claims", "messages", "analytics", "settings"]) {
      await page.goto(`admin/${adminPage}.html`);
      await expect(page, `admin/${adminPage}.html`).toHaveURL(/login\.html\?role=admin$/);
    }
  });
});
