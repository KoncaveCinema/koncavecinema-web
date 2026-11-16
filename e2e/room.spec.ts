import { expect, test } from "@playwright/test";

import { needs, signIn } from "./helpers";

// The screening room as the member's passes stand today: staging moves on, so the journey reads
// the room's state rather than expecting one.

test.beforeEach(async ({ page }) => {
  needs("MEMBER");
  await signIn(page, "MEMBER");
});

test("the member's next pass opens its room", async ({ page }) => {
  await page.goto("/dashboard/tickets");
  const pass = page.locator('a[href^="/dashboard/tickets/"]').first();
  test.skip((await pass.count()) === 0, "The member has no upcoming pass on staging");
  const ticketId = (await pass.getAttribute("href"))!.split("/").pop()!;

  await page.goto(`/watch/${ticketId}`);
  const room = page.getByText(
    /The doors aren't open yet|Lobby open · starts in|Start watching|This screening has ended/i,
  );
  await expect(room.or(page.locator("mux-player")).first()).toBeVisible({ timeout: 30_000 });
});

test("a pass that isn't the member's is not found", async ({ page }) => {
  await page.goto("/watch/00000000-0000-4000-8000-000000000000");
  await expect(page.getByText("We can't find that pass")).toBeVisible();
});
