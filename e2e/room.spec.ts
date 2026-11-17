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

test("a Public or suite pass with its doors open chats in its room", async ({ page }) => {
  await page.goto("/dashboard/tickets");
  const hrefs = await page
    .locator('a[href^="/dashboard/tickets/"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""));

  // The first pass whose room answers: chat opens only from the lobby to the end of access
  let open = false;
  for (const href of new Set(hrefs)) {
    await page.goto(`/watch/${href.split("/").pop()}`);
    const message = page.getByRole("region", { name: "Chat" }).getByLabel("Message");
    open = await expect(message)
      .toBeEnabled({ timeout: 20_000 })
      .then(() => true)
      .catch(() => false);
    if (open) break;
  }
  test.skip(!open, "No Public or suite pass of the member's is in its room on staging now");

  const text = `Journey check ${Date.now().toString(36)}`;
  const chat = page.getByRole("region", { name: "Chat" });
  await chat.getByLabel("Message").fill(text);
  await chat.getByRole("button", { name: "Send" }).click();
  await expect(chat.getByText(text)).toBeVisible();
  // The API's 3-second pace shows on the button
  await expect(chat.getByRole("button", { name: "Send" })).toBeDisabled();
});

test("a pass that isn't the member's is not found", async ({ page }) => {
  await page.goto("/watch/00000000-0000-4000-8000-000000000000");
  await expect(page.getByText("We can't find that pass")).toBeVisible();
});
