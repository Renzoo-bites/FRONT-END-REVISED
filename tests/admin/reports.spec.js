// Reports (admin/js/reports.js): tabs, filters, search, pagination, checkboxes and the detail
// panel with its status, Edit and Message buttons.
const { test, expect, loginAs } = require("../fixtures");

const rows = (page) => page.locator("#reports-body tr[data-id]");
const tab = (page, name) => page.locator("#status-tabs .status-tab").filter({ hasText: name });
const panel = (page) => page.locator("#detail-panel");
const editForm = (page) => page.locator("#edit-form");

async function openReport(page, id) {
  await page.getByRole("searchbox", { name: "Search items and reports" }).fill(id);
  await page.locator(`tr[data-id="${id}"] .row-link`).click();
  await expect(page.locator("#detail-id")).toHaveText(id);
}

test.describe("reports", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
    await page.goto("admin/reports.html");
  });

  test("tabs count the reports by status", async ({ page }) => {
    await expect(tab(page, "All").locator(".tab-count")).toHaveText("46");
    await expect(tab(page, "Pending").locator(".tab-count")).toHaveText("25");
    await expect(tab(page, "Matched").locator(".tab-count")).toHaveText("6");
    await expect(tab(page, "Ready").locator(".tab-count")).toHaveText("6");
    await expect(tab(page, "Claimed").locator(".tab-count")).toHaveText("9");
    await tab(page, "Matched").click();
    await expect(tab(page, "Matched")).toHaveAttribute("aria-pressed", "true");
    await expect(rows(page)).toHaveCount(6);
  });

  test("pages through the reports, 8 at a time", async ({ page }) => {
    await expect(rows(page)).toHaveCount(8);
    await expect(page.locator("#page-summary")).toHaveText("Showing 1–8 of 46");
    await page.getByRole("button", { name: "Next page" }).click();
    await expect(page.locator("#page-summary")).toHaveText("Showing 9–16 of 46");
    await page.locator("#pagination").getByRole("button", { name: "6", exact: true }).click();
    await expect(page.locator("#page-summary")).toHaveText("Showing 41–46 of 46");
    await expect(page.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  test("category and month filters, and the counts follow them", async ({ page }) => {
    await page.locator("#category-filter").selectOption("Electronics");
    await expect(tab(page, "All").locator(".tab-count")).toHaveText("12");
    await page.locator("#date-filter").selectOption("2026-08");
    await expect(page.locator("#date-filter option")).toHaveText(["Any date", "September 2026", "August 2026"]);
    await expect(tab(page, "All").locator(".tab-count")).toHaveText("4");
    await expect(rows(page).first()).toContainText("Earbuds");
  });

  test("the search box filters as you type, and ?q= fills it in", async ({ page }) => {
    await page.getByRole("searchbox", { name: "Search items and reports" }).fill("hoodie");
    await expect(rows(page)).toHaveCount(2);
    await page.goto("admin/reports.html?q=FI-0230");
    await expect(rows(page)).toHaveText([/Black Hoodie/]);
    await page.getByRole("searchbox", { name: "Search items and reports" }).fill("no such report");
    await expect(page.locator("#reports-body")).toHaveText("No reports match these filters.");
  });

  test("select all checks every row on the page", async ({ page }) => {
    const selectAll = page.locator("#select-all");
    await selectAll.check();
    await expect(page.locator("#reports-body .row-check:checked")).toHaveCount(8);
    await page.locator("#reports-body .row-check").first().uncheck();
    await expect(selectAll).not.toBeChecked();
    expect(await selectAll.evaluate((box) => box.indeterminate)).toBe(true);
  });

  test("the detail panel shows the report and its NLP match", async ({ page }) => {
    await openReport(page, "FI-0230");
    await expect(panel(page)).toHaveClass(/is-open/);
    await expect(page.locator("#detail-name")).toHaveText("Black Hoodie");
    await expect(page.locator("#detail-body .info-grid")).toContainText("Clothing");
    await expect(page.locator("#detail-body .match-box")).toContainText("Matches lost report FI-0234");
    await expect(page.locator("#detail-body .match-score")).toHaveText("92%");
  });

  test("below 1360px the panel slides over the table and takes focus", async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.locator('tr[data-id="FI-0230"] .row-link').click();
    await expect(panel(page)).toBeFocused({ timeout: 1500 });
    await page.locator("#panel-backdrop").click({ position: { x: 10, y: 10 } });
    await expect(panel(page)).not.toHaveClass(/is-open/);
  });

  test("Escape closes the panel and returns focus to the row", async ({ page }) => {
    await openReport(page, "FI-0230");
    await page.keyboard.press("Escape");
    await expect(panel(page)).not.toHaveClass(/is-open/);
    await expect(page.locator('tr[data-id="FI-0230"] .row-link')).toBeFocused();
  });

  test("the main button moves a report to its next status", async ({ page }) => {
    await openReport(page, "FI-0231");
    await page.getByRole("button", { name: "Mark as Ready for claim" }).click();
    await expect(page.locator("#detail-body .detail-title")).toContainText("Ready for claim");
    await expect(page.locator('[data-nav="reports"] .sidebar-count')).toHaveText("24"); // one fewer pending
    await page.getByRole("button", { name: "Mark as Claimed" }).click();
    await expect(page.getByRole("button", { name: "Already claimed" })).toBeDisabled();
  });

  test("Message opens the student's conversation about the item", async ({ page }) => {
    await openReport(page, "FI-0230");
    await page.locator("#detail-body").getByRole("link", { name: "Message" }).click();
    await expect(page).toHaveURL(/messages\.html\?c=conv-11$/);
    await expect(page.locator("#chat-thread-title")).toHaveText("Paolo Reyes");
  });

  test("Message is off when no student has messaged about the item", async ({ page }) => {
    await openReport(page, "FI-0215");
    await expect(page.locator("#detail-body").getByRole("button", { name: "Message" })).toBeDisabled();
  });

  test("Edit changes the report's details", async ({ page }) => {
    await openReport(page, "FI-0230");
    await page.getByRole("button", { name: "Edit" }).click();
    await expect(editForm(page).getByLabel("Item name")).toBeFocused();
    await expect(editForm(page).getByLabel("Item name")).toHaveValue("Black Hoodie");
    await editForm(page).getByLabel("Item name").fill("Black Zip Hoodie");
    await editForm(page).getByLabel("Location").selectOption("gregoria-de-jesus-hall");
    await editForm(page).getByLabel("Date").fill("2026-10-02");
    await editForm(page).getByRole("button", { name: "Save changes" }).click();

    await expect(page.locator("#detail-name")).toHaveText("Black Zip Hoodie");
    await expect(page.locator("#detail-body .info-grid")).toContainText("Gregoria De Jesus Hall (GDH)");
    await expect(page.locator("#detail-body .info-grid")).toContainText("Oct 2, 2026");
    await expect(page.locator('tr[data-id="FI-0230"]')).toContainText("Black Zip Hoodie");
    await expect(page.getByRole("button", { name: "Edit" })).toBeFocused();
    await expect(page.locator("#date-filter option")).toContainText(["October 2026"]);
  });

  test("Cancel leaves the report as it was", async ({ page }) => {
    await openReport(page, "FI-0230");
    await page.getByRole("button", { name: "Edit" }).click();
    await editForm(page).getByLabel("Item name").fill("Something else");
    await editForm(page).getByRole("button", { name: "Cancel" }).click();
    await expect(page.locator("#detail-name")).toHaveText("Black Hoodie");
    await expect(page.getByRole("button", { name: "Edit" })).toBeFocused();
  });

  test("editing an item logged at the office also updates Browse", async ({ page, context }) => {
    const id = await page.evaluate(() => AdminAPI.addFoundItem({
      name: "Umbrella", category: "Others", color: "Red", description: "Red umbrella", image: null,
      locationId: "chapel", locationOther: "", locationDetails: "", dateFound: "2026-10-19", brand: "", turnedInBy: "", storage: "",
      identifyingDetails: "",
    }).then((item) => item.id));
    await page.reload();
    await openReport(page, id);
    await page.getByRole("button", { name: "Edit" }).click();
    await editForm(page).getByLabel("Item name").fill("Red umbrella");
    await editForm(page).getByRole("button", { name: "Save changes" }).click();
    await expect(page.locator("#detail-name")).toHaveText("Red umbrella");

    const visitor = await context.newPage();
    await visitor.goto(`user/item-details.html?id=${id}`);
    await expect(visitor.getByRole("heading", { level: 1 })).toHaveText("Red umbrella");
  });
});
