import { expect, test } from "@playwright/test";

import { signIn, visibleTable } from "./helpers";

// The admin console's main journeys, on sample data. Desktop only: the tables are the subject.
test.skip(({ isMobile }) => isMobile, "Admin journeys run on desktop");

const POSTER = "public/placeholder/film-ember-and-ash.jpg";
const video = (name: string) => ({ name, mimeType: "video/mp4", buffer: Buffer.alloc(2048, 1) });

test.beforeEach(async ({ page }) => {
  await signIn(page, "admin@koncave.test", "/admin/login");
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByText("Gross collected").first()).toBeVisible();
});

test("a film goes from draft to published, then is scheduled and cancelled", async ({ page }) => {
  // Uploads "process" for a few seconds each in the demo
  test.setTimeout(150_000);
  await page.goto("/admin/films/new");
  await page.locator("#title").fill("The Ferryman of Badagry");
  await page.locator("#synopsis").fill("A ferryman carries one last passenger across the lagoon.");
  await page.locator("#producerName").fill("Lagoon Light Films");
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page.getByText("4 things to do before publishing")).toBeVisible();

  const posters = page.locator('#posters input[type="file"]');
  await posters.nth(0).setInputFiles(POSTER);
  await posters.nth(1).setInputFiles(POSTER);
  await expect(page.getByText("3 things to do before publishing")).toBeVisible();

  const media = page.locator('#media input[type="file"]');
  await media.nth(0).setInputFiles(video("master.mp4"));
  await media.nth(1).setInputFiles(video("trailer.mp4"));
  await page.getByRole("button", { name: "Attach as the master" }).click({ timeout: 45_000 });
  await page.getByRole("button", { name: "Attach as the trailer" }).click({ timeout: 45_000 });
  await expect(page.getByText("1 thing to do before publishing")).toBeVisible();

  await page.locator("#cert-number").fill("NFVCB/2026/CAT-A/77001");
  await page.locator("#cert-url").fill("https://compliance.example.com/ferryman.pdf");
  await page.getByRole("button", { name: "Save certificate" }).click();
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByText("Published and on sale.")).toBeVisible();

  await page.getByRole("button", { name: "Add showtime" }).click();
  const inTwoDays = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
  await page.locator("#st-date").fill(inTwoDays);
  await expect(page.getByText(/^Ends /)).toBeVisible();
  await page.locator('button[form="showtime-form"]').click();
  await page.locator("#showtimes table a").first().click();

  await page.getByRole("button", { name: "Cancel screening" }).click();
  const dialog = page.getByRole("alertdialog");
  await dialog.locator("textarea").fill("The premiere has moved to next month.");
  await dialog.getByRole("button", { name: "Cancel screening" }).click();
  await expect(page.getByText(/Reason sent to buyers/)).toBeVisible();
});

test("the super admin records a refund", async ({ page }) => {
  await page.goto("/admin/refunds");
  await page.getByRole("button", { name: "Mark refunded" }).first().click();
  const dialog = page.getByRole("alertdialog");
  await dialog.locator("textarea").fill("Paystack refund 9911.");
  await dialog.getByRole("button", { name: "Mark refunded" }).click();
  await expect(page.getByText("Refund recorded")).toBeVisible();
});

test("support reveals a legal name and cancels a pass", async ({ page }) => {
  await page.goto("/admin/members?q=adaeze");
  await visibleTable(page).locator('a[href^="/admin/members/"]').first().click();
  await page.getByRole("button", { name: "Reveal legal name" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Reveal" }).click();
  await expect(page.getByRole("button", { name: "Reveal legal name" })).toBeHidden();

  await page.getByRole("button", { name: "Cancel pass" }).first().click();
  const dialog = page.getByRole("alertdialog");
  await dialog.locator("textarea").fill("Booked the wrong night, at the member's request.");
  await dialog.getByRole("button", { name: "Cancel pass" }).click();
  await expect(page.getByText(/Cancelled|seated in this suite|hasn't ended/).first()).toBeVisible();
});

test("staff invites are refused for an existing member of staff", async ({ page }) => {
  await page.goto("/admin/staff");
  await page.getByRole("button", { name: "Invite staff" }).click();
  await page.locator('input[type="email"]').fill("tunde.bello@koncavecinema.com");
  await page.getByRole("button", { name: "Send invite" }).click();
  await expect(page.getByText("This account is already staff.")).toBeVisible();
});

test("the audit log pages on with Load more", async ({ page }) => {
  await page.goto("/admin/audit");
  const entries = page.locator("main li");
  await expect(entries.first()).toBeVisible();
  const before = await entries.count();
  await page.getByRole("button", { name: "Load more" }).click();
  await expect.poll(() => entries.count()).toBeGreaterThan(before);
});

test("a long list pages through at the size you choose", async ({ page }) => {
  await page.goto("/admin/members");
  const pages = page.getByRole("navigation", { name: "Pages" });
  await expect(pages.getByText(/^Page 1 of \d+$/)).toBeVisible();
  await pages.getByRole("combobox").click();
  await page.getByRole("option", { name: "10", exact: true }).click();
  await expect(page).toHaveURL(/pageSize=10/);
  await expect(visibleTable(page).locator("tbody tr")).toHaveCount(10);
  await pages.getByRole("button", { name: "Next page" }).click();
  await expect(pages.getByText(/^Page 2 of \d+$/)).toBeVisible();
  await expect(pages.getByText(/^Showing 11[–-]20 of \d+$/)).toBeVisible();
});

test("a role changes from the row's menu, behind a confirmation", async ({ page }) => {
  await page.goto("/admin/staff");
  await page.getByRole("button", { name: "Access for tunde.bello@koncavecinema.com" }).click();
  await page.getByRole("menuitem", { name: "Make super admin" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("Make tunde.bello@koncavecinema.com super admin?");
  await dialog.getByRole("button", { name: "Change role" }).click();
  await expect(page.getByText("Access updated")).toBeVisible();
});

test("the console's account menu holds only the person's own links", async ({ page }) => {
  await page.getByRole("button", { name: "Account menu" }).click();
  const menu = page.getByRole("menu");
  await expect(menu.getByRole("menuitem", { name: /Account settings/ })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: /My tickets/ })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: /Dashboard/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "View the site" })).toHaveCount(0);
});
