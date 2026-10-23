// Shared setup for every test. Each test gets a fresh browser profile, so the demo stores
// (localStorage) start from their sample data.
const base = require("@playwright/test");

// The sample data is dated around this day, so "Past 7 days" and "25m ago" don't drift.
const NOW = new Date("2026-10-21T10:00:00");

const ACCOUNTS = {
  user: { name: "Juan Dela Cruz", email: "student@example.com", role: "user" },
  admin: { name: "SWAFO Staff", email: "swafo@dlsud.edu.ph", role: "admin" },
};

const test = base.test.extend({
  context: async ({ context }, use) => {
    await context.clock.setFixedTime(NOW);
    // No internet in tests: Chart.js and Google Fonts are skipped, and the pages cope without them.
    await context.route(/^https?:\/\//, (route) => route.abort());
    await use(context);
  },
});

// Logs this tab in, the way js/auth.js keeps a session (per tab, in sessionStorage).
async function loginAs(page, role) {
  const session = JSON.stringify(ACCOUNTS[role]);
  await page.addInitScript((value) => sessionStorage.setItem("findit.session", value), session);
}

// Clicks "OK" on the next confirm() dialog.
function acceptNextDialog(page) {
  page.once("dialog", (dialog) => dialog.accept());
}

module.exports = { test, expect: base.expect, loginAs, acceptNextDialog, NOW };
