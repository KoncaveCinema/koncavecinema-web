import { expect, test } from "@playwright/test";

test("home page renders the brand", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Koncave Cinema" })).toBeVisible();
});
