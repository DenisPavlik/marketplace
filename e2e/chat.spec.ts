import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("demo user can open a conversation and send a message in real time", async ({ page, isMobile }) => {
  test.skip(isMobile, "covered on desktop");
  test.skip(!process.env.E2E_ALLOW_WRITES, "writes to the database; set E2E_ALLOW_WRITES=1 against a test project");
  await page.goto("/login?next=/inbox");
  await page.getByRole("button", { name: /Explore with a demo account/ }).click();
  await expect(page).toHaveURL(/\/inbox$/);

  await page.locator("aside a[href^='/inbox/']").first().click();
  const text = `e2e ping ${Date.now()}`;
  await page.getByLabel("Message", { exact: true }).fill(text);
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText(text)).toBeVisible();
  // The optimistic bubble settles once the server confirms it.
  await expect(page.getByText(text)).not.toHaveClass(/opacity-60/);
});
