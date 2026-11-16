import { expect, test } from "@playwright/test";

import { needs, signIn, uniqueTitle } from "./helpers";

// One admin flow that cleans up after itself: a draft is made, edited, certified, found in the
// audit log, then deleted. Uploads and publishing need real files at Mux, so they stay manual.

test("the super admin prepares a draft, sees it audited, and deletes it", async ({ page }) => {
  needs("ADMIN");
  const title = uniqueTitle("E2E Draft");
  await signIn(page, "ADMIN");

  await page.goto("/admin/films/new");
  await page.locator("#title").fill(title);
  await page.locator("#synopsis").fill("A short film made by the end-to-end journey.");
  await page.locator("#producerName").fill("Koncave Test Pictures");
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  const details = page.locator("#details");
  await details.getByRole("button", { name: "Edit" }).click();
  await page.locator("#synopsis").fill("Edited by the journey before it deletes the draft.");
  await page.getByRole("button", { name: "Save details" }).click();
  await expect(
    details.getByText("Edited by the journey before it deletes the draft."),
  ).toBeVisible();

  await page.locator("#cert-number").fill(`NFVCB/E2E/${Date.now()}`);
  await page.locator("#cert-url").fill("https://compliance.example.com/e2e.pdf");
  await page.getByRole("button", { name: "Save certificate" }).click();
  await expect(page.getByText("Certificate saved")).toBeVisible();
  // The form rests on the saved certificate until it's changed again
  await expect(page.getByRole("button", { name: "Update certificate" })).toBeDisabled();
  const filmUrl = page.url();

  await page.goto("/admin/audit?action=ADMIN_MOVIE_");
  await expect(page.getByText("Movie certified").first()).toBeVisible();
  await expect(page.getByText("Movie created").first()).toBeVisible();

  await page.goto(filmUrl);
  await page.getByRole("button", { name: "More actions" }).click();
  await page.getByRole("menuitem", { name: "Delete draft" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete draft" }).click();
  await expect(page).toHaveURL(/\/admin\/films$/);
  await expect(page.getByText("Draft deleted")).toBeVisible();
  await expect(page.getByText(title)).toHaveCount(0);
});
