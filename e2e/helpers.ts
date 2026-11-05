import { expect, type Page } from "@playwright/test";

/*
 * Journeys run in sample-data mode (NEXT_PUBLIC_DATA_SOURCE=fixtures): any password signs in,
 * admin@… is the super admin, staff@… is staff and anything else is a member.
 */

export const DEMO_PASSWORD = "Sample-password-1";

export async function signIn(page: Page, email: string, path = "/sign-in") {
  await page.goto(path);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).not.toHaveURL(new RegExp(`${path}$`));
}

/** Lists draw a table on wide screens and cards on phones: the visible one is the table here */
export const visibleTable = (page: Page) => page.locator("main table");
