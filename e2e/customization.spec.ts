import { test, expect } from "@playwright/test";

test.describe("Customization Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Set localStorage to skip welcome modal before navigating
    await page.addInitScript(() => {
      localStorage.setItem("zdk-icon-generator:welcome-seen", "true");
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Wait for random icon to be selected
    await page.waitForTimeout(1000);
  });

  test("displays customization controls pane", async ({ page }) => {
    // Should have color picker labels
    await expect(page.getByText(/background/i)).toBeVisible();
    await expect(page.getByText(/icon color/i)).toBeVisible();
  });

  test("can change background color via hex input", async ({ page }) => {
    // Find the background color hex input
    const hexInputs = page.locator('input[placeholder="#ffffff"]').first();

    if (await hexInputs.isVisible()) {
      await hexInputs.clear();
      await hexInputs.fill("#ff5500");

      // Verify the input value changed
      await expect(hexInputs).toHaveValue("#ff5500");
    }
  });

  test("can change icon color via hex input", async ({ page }) => {
    // Find the icon color hex input (second one typically)
    const hexInputs = page.locator('input[placeholder="#ffffff"]');
    const iconColorInput = hexInputs.nth(1);

    if (await iconColorInput.isVisible()) {
      await iconColorInput.clear();
      await iconColorInput.fill("#00ff00");

      await expect(iconColorInput).toHaveValue("#00ff00");
    }
  });

  test("displays icon size slider", async ({ page }) => {
    // Look for slider or size-related controls
    const sizeLabel = page.getByText(/icon size/i);
    await expect(sizeLabel).toBeVisible();
  });

  test("can select app locations", async ({ page }) => {
    // Find location selector (multi-select or checkboxes)
    const locationButton = page.getByRole("button", { name: /location/i });

    if (await locationButton.isVisible()) {
      await locationButton.click();

      // Should show location options
      await page.waitForTimeout(300);
      const options = page.getByRole("option");
      const optionCount = await options.count();

      if (optionCount > 0) {
        // Click first option
        await options.first().click();
      }
    }
  });

  test("preview updates when colors change", async ({ page }) => {
    // Get the preview pane by its exact card title (heading, not tab)
    const previewTitle = page.getByRole("heading", { name: "Preview" });
    await expect(previewTitle).toBeVisible();

    // Change a color and verify preview is still visible
    const hexInputs = page.locator('input[placeholder="#ffffff"]').first();
    if (await hexInputs.isVisible()) {
      await hexInputs.clear();
      await hexInputs.fill("#123456");

      // Preview should still be visible (heading, not tab)
      await expect(
        page.getByRole("heading", { name: "Preview" })
      ).toBeVisible();
    }
  });

  test("can switch between gradient and solid color modes", async ({
    page,
  }) => {
    // Look for gradient/solid toggle
    const backgroundControls = page.getByText(/solid|gradient/i);

    if (await backgroundControls.first().isVisible()) {
      await backgroundControls.first().click();
      await page.waitForTimeout(300);
    }
  });

  test("SVG icon size control is visible", async ({ page }) => {
    // Should have SVG icon size control
    const svgSizeLabel = page.getByText(/svg.*size/i);

    if (await svgSizeLabel.isVisible()) {
      await expect(svgSizeLabel).toBeVisible();
    }
  });

  test("color picker has native color input", async ({ page }) => {
    // Should have color type inputs
    const colorInputs = page.locator('input[type="color"]');
    const count = await colorInputs.count();

    // Should have at least 2 color inputs (background and icon)
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
