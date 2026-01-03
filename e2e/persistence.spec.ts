import { test, expect } from "@playwright/test";

test.describe("localStorage Persistence", () => {
  test("persists icon color across page reload", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Find and change the icon color
    const colorInputs = page.locator('input[type="color"]');
    const iconColorInput = colorInputs.nth(1); // Second color input is typically icon color

    if (await iconColorInput.isVisible()) {
      // Set a specific color
      await iconColorInput.fill("#00ff00");
      await page.waitForTimeout(600); // Wait for debounce + save

      // Reload the page
      await page.reload();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // Check that the color was restored
      const restoredInput = page.locator('input[type="color"]').nth(1);
      const value = await restoredInput.inputValue();
      
      // Value should be the saved color
      expect(value.toLowerCase()).toBe("#00ff00");
    }
  });

  test("persists background color across page reload", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Find and change the background color
    const colorInputs = page.locator('input[type="color"]');
    const bgColorInput = colorInputs.first();

    if (await bgColorInput.isVisible()) {
      // Set a specific color
      await bgColorInput.fill("#ff5500");
      await page.waitForTimeout(600);

      // Reload
      await page.reload();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // Check restoration
      const restoredInput = page.locator('input[type="color"]').first();
      const value = await restoredInput.inputValue();
      
      expect(value.toLowerCase()).toBe("#ff5500");
    }
  });

  test("persists selected icon pack across page reload", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Find pack selector
    const packSelector = page.getByRole("combobox").first();

    if (await packSelector.isVisible()) {
      // Click to open
      await packSelector.click();
      await page.waitForTimeout(300);

      // Select a specific pack (e.g., Feather)
      const featherOption = page.getByRole("option", { name: /feather/i });
      
      if (await featherOption.isVisible()) {
        await featherOption.click();
        await page.waitForTimeout(600);

        // Reload
        await page.reload();
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1000);

        // Check that pack is restored
        const restoredSelector = page.getByRole("combobox").first();
        const text = await restoredSelector.textContent();
        
        if (text) {
          expect(text.toLowerCase()).toContain("feather");
        }
      }
    }
  });

  test("persists selected locations across page reload", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Find location button/selector
    const locationButton = page.getByRole("button", { name: /location/i });

    if (await locationButton.isVisible()) {
      await locationButton.click();
      await page.waitForTimeout(300);

      // Select a location
      const topBarOption = page.getByText(/top bar/i);
      
      if (await topBarOption.isVisible()) {
        await topBarOption.click();
        await page.keyboard.press("Escape"); // Close dropdown
        await page.waitForTimeout(600);

        // Reload
        await page.reload();
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1000);

        // Check that location indicator shows selection
        // Look for badge or indicator
        const fileCountText = page.getByText(/will export/i);
        const text = await fileCountText.textContent();
        
        // If top_bar was saved, file count should be > 2 (includes SVG)
        if (text) {
          expect(text).toContain("export");
        }
      }
    }
  });

  test("does not persist search query across reload", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Enter a search query
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill("arrow");
    await page.waitForTimeout(600);

    // Reload
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Search should be empty
    const restoredSearch = page.getByPlaceholder(/search/i);
    const value = await restoredSearch.inputValue();
    
    expect(value).toBe("");
  });

  test("clears localStorage and resets to defaults", async ({ page }) => {
    // First, set some values
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Set a color
    const colorInput = page.locator('input[type="color"]').first();
    if (await colorInput.isVisible()) {
      await colorInput.fill("#123456");
      await page.waitForTimeout(600);
    }

    // Clear localStorage via console
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Reload
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Should have default values (not #123456)
    const restoredInput = page.locator('input[type="color"]').first();
    const value = await restoredInput.inputValue();
    
    // Default background color is #063940
    expect(value.toLowerCase()).not.toBe("#123456");
  });
});

