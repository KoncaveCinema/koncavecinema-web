import { expect, test } from "@playwright/test";

import { signIn } from "./helpers";

// Who may open what. The API's role checks are the real protection; these are the screens.

test("signed out, the dashboard sends you to sign in and back", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fdashboard/);
});

test("signed out, the admin console sends you to the staff sign-in", async ({ page }) => {
  await page.goto("/admin/films");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Ffilms/);
});

test("a member opening the admin console sees it's for staff", async ({ page }) => {
  await signIn(page, "ada@example.com");
  await page.goto("/admin");
  await expect(page.getByText("This area is for Koncave staff")).toBeVisible();
});

test("staff can't open the super admin's pages", async ({ page }) => {
  await signIn(page, "staff@koncave.test", "/admin/login");
  await page.goto("/admin/staff");
  await expect(page.getByText("Only the super admin can open this page")).toBeVisible();
  await page.goto("/admin/refunds");
  await expect(page.getByText(/Only the super admin records refunds/)).toBeVisible();
});
