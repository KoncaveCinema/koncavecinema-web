import { expect, test, type Page } from "@playwright/test";

import { signIn } from "./helpers";

// The screening room on sample data: the member's seeded passes cover each state.

async function passId(page: Page, title: string) {
  await page.goto("/dashboard/tickets");
  const card = page.locator("li", { hasText: title }).first();
  await expect(card).toBeVisible();
  const href = await card.locator('a[href^="/dashboard/tickets/"]').first().getAttribute("href");
  return href!.split("/").pop()!;
}

test.beforeEach(async ({ page }) => {
  await signIn(page, "ada@example.com");
});

test("the lobby holds the film until the start, and every refusal has its screen", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto(`/watch/${await passId(page, "Lagos After Dark")}`);
  await expect(page.getByText("Lobby open · starts in")).toBeVisible();
  await expect(page.locator("mux-player")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "IP Geolocation by DB-IP" })).toBeVisible();

  await page.getByRole("button", { name: "Another device", exact: true }).click();
  await expect(page.getByText("Playing on another device")).toBeVisible();
  await page.getByRole("button", { name: "Watch here instead" }).click();
  await expect(page.getByText("Lobby open · starts in")).toBeVisible();

  await page.getByRole("button", { name: "Unusual location", exact: true }).click();
  await page.getByRole("button", { name: "Email me a code" }).click();
  await page.getByRole("textbox", { name: /Code from your email/ }).fill("123456");
  await page.getByRole("button", { name: "Confirm and watch" }).click();
  await expect(page.getByText("Lobby open · starts in")).toBeVisible();

  await page.getByRole("button", { name: "Film not ready", exact: true }).click();
  await expect(page.getByText("The film isn't ready yet")).toBeVisible();
});

test("a screening next week counts down to the doors", async ({ page }) => {
  await page.goto(`/watch/${await passId(page, "Red Soil")}`);
  await expect(page.getByText("The doors aren't open yet")).toBeVisible();
});

test("a pass that isn't the member's is not found", async ({ page }) => {
  await page.goto("/watch/not-a-pass");
  await expect(page.getByText("We can't find that pass")).toBeVisible();
});
