// Admin Messages (admin/js/messages.js): SWAFO's inbox, replies and status changes.
const { test, expect, loginAs } = require("../fixtures");

const conversations = (page) => page.locator("#chat-list .chat-convo");
const bubbles = (page) => page.locator("#thread-messages .bubble-text");

test.describe("admin messages", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
  });

  test("lists every student's conversations with the unread total", async ({ page }) => {
    await page.goto("admin/messages.html");
    await expect(conversations(page)).toHaveCount(10);
    await expect(page.locator("#chat-unread-total")).toHaveText("3");
    await page.locator("#chat-filters").getByRole("button", { name: /Unread/ }).click();
    await expect(conversations(page)).toHaveCount(3);
  });

  test("the search box filters by student or item", async ({ page }) => {
    await page.goto("admin/messages.html");
    await page.getByRole("searchbox").fill("Maria");
    await expect(conversations(page)).toHaveText([/Maria Santos/]);
    await page.getByRole("searchbox").fill("FI-0231");
    await expect(conversations(page)).toHaveCount(2);
  });

  test("?c= opens a conversation and marks it read", async ({ page }) => {
    await page.goto("admin/messages.html?c=conv-4");
    await expect(page.locator("#chat-thread-title")).toHaveText("Juan Dela Cruz");
    await expect(bubbles(page).last()).toHaveText("Great! I'll come by tomorrow morning.");
    await expect(page.locator("#chat-unread-total")).toHaveText("2");
    await expect(page.locator('[data-nav="messages"] .sidebar-count')).toHaveText("2");
    await expect(page.getByRole("link", { name: "View report" })).toHaveAttribute("href", "reports.html?q=FI-0224");
  });

  test("a reply reaches the student", async ({ page, context }) => {
    await page.goto("admin/messages.html?c=conv-4");
    await page.locator("#composer-input").fill("See you tomorrow, Juan!");
    await page.locator("#send-btn").click();
    await expect(bubbles(page).last()).toHaveText("See you tomorrow, Juan!");
    await expect(conversations(page).first()).toContainText("See you tomorrow, Juan!");

    const student = await context.newPage();
    await loginAs(student, "user");
    await student.goto("user/messages.html?item=FI-0224");
    await expect(student.locator("#thread-messages .bubble-text").last()).toHaveText("See you tomorrow, Juan!");
  });

  test("changing the status tells the student in the chat", async ({ page }) => {
    await page.goto("admin/messages.html?c=conv-10"); // matched
    await page.locator("#chat-info").getByRole("button", { name: "Mark as Ready for claim" }).click();
    await expect(page.locator("#thread-messages .msg-system").last()).toHaveText("SWAFO marked this item as Ready for claim");
    await expect(page.locator("#chat-info .chat-status")).toContainText("Ready for claim");
    await expect(page.locator("#chat-info").getByRole("button", { name: "Mark as Claimed" })).toBeVisible();
  });

  test("on narrower screens the info panel opens from a button and takes focus", async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 800 });
    await page.goto("admin/messages.html?c=conv-4");
    await page.getByRole("button", { name: "Show conversation details" }).click();
    await expect(page.locator("#chat-info-close")).toBeFocused({ timeout: 1500 });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Show conversation details" })).toHaveAttribute("aria-expanded", "false");
  });

  test("shows the student's details and shared photos", async ({ page }) => {
    await page.goto("admin/messages.html?c=conv-4");
    const info = page.locator("#chat-info");
    await expect(info).toContainText("student@example.com");
    await expect(info.locator(".photo-thumb")).toHaveCount(1);
    await info.locator(".photo-thumb").click();
    await expect(page.locator("#lightbox")).toBeVisible();
    await page.locator("#lightbox-close").click();
    await expect(page.locator("#lightbox")).toBeHidden();
  });
});
