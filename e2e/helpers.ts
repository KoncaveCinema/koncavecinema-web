import { expect, test, type Page } from "@playwright/test";

/*
 * The journeys run against staging through the dev server. Their accounts come from
 * .env.e2e.local (ignored by git), never from the repo:
 *
 *   E2E_MEMBER_EMAIL, E2E_MEMBER_PASSWORD   a member with at least one pass
 *   E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD     the super admin
 *
 * A journey whose account is missing is skipped, naming what to set.
 */

type Account = "MEMBER" | "ADMIN";

function credentials(account: Account) {
  const email = process.env[`E2E_${account}_EMAIL`];
  const password = process.env[`E2E_${account}_PASSWORD`];
  return email && password ? { email, password } : null;
}

/** Skips the journey unless this account is set */
export function needs(account: Account) {
  test.skip(
    !credentials(account),
    `Set E2E_${account}_EMAIL and E2E_${account}_PASSWORD in .env.e2e.local`,
  );
}

/** Signs in on the member or staff form and waits to leave it */
export async function signIn(page: Page, account: Account) {
  const { email, password } = credentials(account)!;
  const path = account === "ADMIN" ? "/admin/login" : "/login";
  await page.goto(path);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).not.toHaveURL(new RegExp(`${path}$`));
}

/** A title no other film on staging has, so a journey finds only what it made */
export const uniqueTitle = (prefix: string) => `${prefix} ${Date.now().toString(36).toUpperCase()}`;
