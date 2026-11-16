import { expect, test } from "@playwright/test";

import { needs, signIn } from "./helpers";

// A member's session: in, their dashboard, and out again.

test("a member signs in to their dashboard and signs out", async ({ page }) => {
  needs("MEMBER");
  await signIn(page, "MEMBER");
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /^Welcome back/ })).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).first().click();
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fdashboard/);
});
