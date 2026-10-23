// Student Messages (js/messages.js + js/chat-ui.js): conversation list, thread, composer,
// info panel, and messages reaching SWAFO.
const { test, expect, loginAs, acceptNextDialog } = require("../fixtures");

const conversations = (page) => page.locator("#convo-list .convo");
const bubbles = (page) => page.locator("#thread-messages .bubble-text");

test.describe("student messages", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "user");
  });

  test("lists only this student's conversations, newest first", async ({ page }) => {
    await page.goto("user/messages.html");
    await expect(conversations(page)).toHaveCount(6);
    await expect(conversations(page).first()).toContainText("Item #1 (Phone)");
    await expect(page.locator("#unread-total")).toHaveText(" · 3");
  });

  test("opens the latest conversation that's already read", async ({ page }) => {
    await page.goto("user/messages.html");
    await expect(page.locator("#thread-title")).toHaveText("Item #4 · School ID");
    await expect(bubbles(page).last()).toHaveText("Great! I'll come by tomorrow morning.");
    await expect(page.locator("#thread-messages .msg-system")).toHaveText("SWAFO marked this item as Ready for claim");
  });

  test("opening an unread conversation clears its badge", async ({ page }) => {
    await page.goto("user/messages.html");
    const phone = conversations(page).filter({ hasText: "Item #1 (Phone)" });
    await expect(phone.locator(".unread-badge")).toContainText("2");
    await phone.click();
    await expect(page.locator("#thread-title")).toHaveText("Item #1 · Phone");
    await expect(phone.locator(".unread-badge")).toHaveCount(0);
    await expect(page.locator("#unread-total")).toHaveText(" · 1");
  });

  test("?item= opens that item's conversation", async ({ page }) => {
    await page.goto("user/messages.html?item=FI-0222");
    await expect(page.locator("#thread-title")).toHaveText("Item #5 · Dorm keys");
  });

  test("Unread, SWAFO and search filter the list", async ({ page }) => {
    await page.goto("user/messages.html");
    await page.getByRole("button", { name: /^Unread/ }).click();
    await expect(conversations(page)).toHaveCount(2);
    await page.getByRole("button", { name: "SWAFO", exact: true }).click();
    await expect(conversations(page)).toHaveCount(2); // the ones SWAFO started
    await page.getByRole("button", { name: "All", exact: true }).click();
    await page.getByRole("searchbox", { name: "Search conversations" }).fill("backpack");
    await expect(conversations(page)).toHaveText([/Item #9 \(Backpack\)/]);
    await page.getByRole("searchbox", { name: "Search conversations" }).fill("nothing like this");
    await expect(page.locator("#convo-list")).toHaveText("No conversations found.");
  });

  test("sending a message adds it to the thread and moves the conversation up", async ({ page }) => {
    await page.goto("user/messages.html");
    const send = page.locator("#send-btn");
    await expect(send).toBeDisabled();
    await page.locator("#composer-input").fill("Thank you po, see you tomorrow!");
    await expect(send).toBeEnabled();
    await send.click();
    await expect(bubbles(page).last()).toHaveText("Thank you po, see you tomorrow!");
    await expect(page.locator("#composer-input")).toHaveValue("");
    await expect(conversations(page).first()).toContainText("Thank you po, see you tomorrow!");
  });

  test("Enter sends and Shift+Enter adds a new line", async ({ page }) => {
    await page.goto("user/messages.html");
    const input = page.locator("#composer-input");
    await input.fill("Line one");
    await input.press("Shift+Enter");
    await input.pressSequentially("line two");
    await expect(input).toHaveValue("Line one\nline two");
    await input.press("Enter");
    await expect(bubbles(page).last()).toHaveText("Line one\nline two");
  });

  test("SWAFO sees the student's message in the admin inbox", async ({ page, context }) => {
    await page.goto("user/messages.html");
    await page.locator("#composer-input").fill("Hello SWAFO, is my ID still there?");
    await page.locator("#send-btn").click();
    await expect(bubbles(page).last()).toHaveText("Hello SWAFO, is my ID still there?");

    const admin = await context.newPage();
    await loginAs(admin, "admin");
    await admin.goto("admin/messages.html?c=conv-4");
    await expect(admin.locator("#thread-messages .bubble-text").last()).toHaveText("Hello SWAFO, is my ID still there?");
  });

  test("the info panel shows the item and pick-up hours", async ({ page }) => {
    await page.goto("user/messages.html");
    const info = page.locator("#info-panel");
    await expect(info).toContainText("FI-0224");
    await expect(info).toContainText("Mon–Fri, 8AM–5PM");
    await expect(info.getByRole("link", { name: "Start claim" })).toHaveAttribute("href", "claim.html?id=FI-0224");
  });

  test("on narrower screens the info panel opens from a button and closes with Escape", async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 800 });
    await page.goto("user/messages.html");
    const toggle = page.getByRole("button", { name: "Show conversation details" });
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#info-panel")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  test("opening the info panel moves keyboard focus into it", async ({ page }) => {
    // The panel slides in, but must be visible at once or focus() is ignored.
    await page.setViewportSize({ width: 1000, height: 800 });
    await page.goto("user/messages.html");
    await page.getByRole("button", { name: "Show conversation details" }).click();
    await expect(page.getByRole("button", { name: "Close details" })).toBeFocused({ timeout: 1500 });
  });

  test("a conversation can be reported once", async ({ page }) => {
    await page.goto("user/messages.html");
    acceptNextDialog(page);
    await page.getByRole("button", { name: "Report conversation" }).click();
    await expect(page.locator("#report-btn")).toBeDisabled();
    await expect(page.locator("#report-btn")).toHaveText("Reported. SWAFO will review this conversation.");
  });
});
