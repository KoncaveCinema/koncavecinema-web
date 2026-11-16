import { expect, test } from "@playwright/test";

import { needs, signIn } from "./helpers";

// Booking up to the payment: it stops at Paystack's checkout and pays nothing. The seat it
// holds lapses by itself after 10 minutes.

test("a member holds a seat and is sent to Paystack to pay", async ({ page }) => {
  needs("MEMBER");
  await signIn(page, "MEMBER");

  await page.goto("/showtimes");
  const screening = page.locator('a[href^="/movies/"][href*="/showtimes/"]').first();
  test.skip((await screening.count()) === 0, "No screening is open for booking on staging");
  await screening.click();

  await expect(page.getByRole("heading", { name: "Choose your room" })).toBeVisible();
  // Individual Watch: no identity check stands between the room and the review
  await page.getByRole("radio", { name: /Individual watch/i }).click();
  await page.getByRole("button", { name: /Continue to review/ }).click();

  await expect(page).toHaveURL(/\/checkout\//);
  await page.getByRole("button", { name: /^Pay / }).click();
  await page.waitForURL(/paystack\.(com|co)/, { timeout: 30_000 });
});
