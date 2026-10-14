import { expect, test } from "@playwright/test";

for (const path of ["/sell", "/saved", "/selling", "/inbox"]) {
  test(`${path} redirects guests to sign in`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(path)}`));
  });
}

test("demo account signs in and returns to the requested page", async ({ page }) => {
  await page.goto("/login?next=/selling");
  await page.getByRole("button", { name: /Explore with a demo account/ }).click();
  await expect(page).toHaveURL(/\/selling$/);
  await expect(page.getByRole("heading", { name: "Your listings" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible();
});

test("login rejects off-site redirects", async ({ page }) => {
  await page.goto("/login?next=//evil.example");
  await page.getByRole("button", { name: /Explore with a demo account/ }).click();
  await expect(page).toHaveURL(/localhost:\d+\/$/);
});
