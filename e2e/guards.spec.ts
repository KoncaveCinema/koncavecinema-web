import { expect, test } from "@playwright/test";

import { needs, signIn } from "./helpers";

// Who may open what. The API's role checks are the real protection; these are the screens.

test("signed out, the dashboard sends you to sign in and back", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
});

test("signed out, the admin console sends you to the staff sign-in", async ({ page }) => {
  await page.goto("/admin/films");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Ffilms/);
});

test("a member opening the admin console sees it's for staff", async ({ page }) => {
  needs("MEMBER");
  await signIn(page, "MEMBER");
  await page.goto("/admin");
  await expect(page.getByText("This area is for Koncave staff")).toBeVisible();
});
