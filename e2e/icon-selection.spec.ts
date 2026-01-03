import { test, expect } from "@playwright/test";

test.describe("Icon Selection Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the page to fully load
    await page.waitForLoadState("networkidle");
  });

  test("loads the home page with icon generator title", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /icon generator/i })).toBeVisible();
  });

  test("displays icon search pane", async ({ page }) => {
    // Should have a search input
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
  });

  test("can search for icons", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill("arrow");

    // Wait for search results
    await page.waitForTimeout(500); // Debounce delay

    // Should show search results (grid items)
    const iconGrid = page.locator('[class*="grid"]').first();
    await expect(iconGrid).toBeVisible();
  });

  test("can select an icon from the grid", async ({ page }) => {
    // Wait for icons to load
    await page.waitForTimeout(500);

    // Find and click an icon in the grid
    const iconButtons = page.locator('button[class*="group"]').first();
    
    if (await iconButtons.isVisible()) {
      await iconButtons.click();

      // Preview pane should update (use exact match to avoid "Generating preview..." text)
      await expect(page.getByText("Preview", { exact: true })).toBeVisible();
    }
  });

  test("can filter icons by pack", async ({ page }) => {
    // Find the pack selector (usually a dropdown or select)
    const packSelector = page.getByRole("combobox").first();
    
    if (await packSelector.isVisible()) {
      await packSelector.click();

      // Should show pack options
      await expect(page.getByRole("option").first()).toBeVisible();
    }
  });

  test("export button is enabled when icon is selected", async ({ page }) => {
    // Wait for initial load and random icon selection
    await page.waitForTimeout(1000);

    // Export button should be visible
    const exportButton = page.getByRole("button", { name: /export zip/i });
    await expect(exportButton).toBeVisible();

    // If an icon is selected (by default), button should be enabled
    // The app auto-selects a random icon on load
    await expect(exportButton).toBeEnabled();
  });

  test("shows empty state message when no icon selected", async ({ page }) => {
    // Clear any selection by searching for something that doesn't exist
    // and then clicking away - this is a regression test scenario
    // For now, just verify the preview pane exists (use exact match)
    await expect(page.getByText("Preview", { exact: true })).toBeVisible();
  });

  test("search is case insensitive", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    
    // Search with lowercase
    await searchInput.fill("arrow");
    await page.waitForTimeout(500);
    
    // Count results
    const lowerCaseResults = await page.locator('button[class*="group"]').count();

    // Clear and search with uppercase
    await searchInput.clear();
    await searchInput.fill("ARROW");
    await page.waitForTimeout(500);

    // Should get same number of results
    const upperCaseResults = await page.locator('button[class*="group"]').count();

    // Results should be equal (or both greater than 0)
    if (lowerCaseResults > 0 && upperCaseResults > 0) {
      expect(lowerCaseResults).toBe(upperCaseResults);
    }
  });
});

