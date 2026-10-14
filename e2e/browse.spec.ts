import { expect, test } from "@playwright/test";

test("home shows the hero, categories and listings", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Stuff your neighbors");
  await expect(page.getByRole("navigation", { name: "Categories" })).toBeVisible();
  await expect(page.locator("article").first()).toBeVisible();
});

test("category chips filter through the URL", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Categories" }).getByRole("link", { name: "Electronics" }).click();
  await expect(page).toHaveURL(/cat=electronics/);
  await expect(page.getByRole("heading", { name: /Electronics/ })).toBeVisible();
});

test("search narrows results and shows an empty state for nonsense", async ({ page }) => {
  await page.goto("/");
  // Desktop and mobile render the box in different places; use whichever is visible.
  const box = page.getByRole("searchbox", { name: "Search listings" }).filter({ visible: true });
  await box.fill("zzqqxxnotathing");
  await box.press("Enter");
  await expect(page).toHaveURL(/q=zzqqxxnotathing/);
  await expect(page.getByText("Nothing matches yet")).toBeVisible();
});

test("a listing card opens its detail page", async ({ page }) => {
  await page.goto("/");
  const first = page.locator("article a").first();
  const title = (await first.locator("h3").textContent())?.trim() ?? "";
  await first.click();
  await expect(page).toHaveURL(/\/listings\//);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  await expect(page.getByText("Pickup area")).toBeVisible();
});

test("unknown listings render the not-found page", async ({ page }) => {
  await page.goto("/listings/not-a-real-id");
  await expect(page.getByText("This page isn't here")).toBeVisible();
});
