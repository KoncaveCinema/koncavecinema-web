import { expect, test } from "@playwright/test";

// Smoke test: the home page renders its billboard and does not scroll sideways on any device.
test("home page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: /night of the premiere/i }),
  ).toBeAttached();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
