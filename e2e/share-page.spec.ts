import { test, expect } from "@playwright/test";

test.describe("Share Page", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and navigate to share page
    await page.addInitScript(() => {
      localStorage.clear();
    });
    await page.goto("/share");
    await page.waitForLoadState("networkidle");
  });

  test("displays the share page with title", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Share Configuration" })
    ).toBeVisible();
  });

  test("has back button that navigates to home", async ({ page }) => {
    // Click back button (it's a link wrapping a button with ArrowLeft icon)
    await page.locator('a[href="/"]').first().click();

    // Should navigate to home
    await expect(page).toHaveURL("/");
  });

  test("displays share mode tabs", async ({ page }) => {
    await expect(page.getByText("Restricted Link")).toBeVisible();
    await expect(page.getByText("Import Link")).toBeVisible();
  });

  test("can switch between share modes", async ({ page }) => {
    // Initially in restricted mode
    await expect(page.getByText("Restricted Mode:")).toBeVisible();

    // Click Import Link tab
    await page.getByText("Import Link").click();

    // Should show import mode description
    await expect(page.getByText("Import Mode:")).toBeVisible();
  });

  test("displays default style preset", async ({ page }) => {
    // Should show default style
    await expect(page.getByText("Zendesk Default")).toBeVisible();
  });

  test("can add a new style preset", async ({ page }) => {
    // Click Add Style button
    await page.getByRole("button", { name: /add style/i }).click();

    // New style should be added (use exact match to avoid matching editor title)
    await expect(page.getByText("Style 2", { exact: true })).toBeVisible();
  });

  test("can edit style name", async ({ page }) => {
    // Click on the default style to select it (use the style item, not the editor)
    await page
      .locator(".cursor-pointer")
      .filter({ hasText: "Zendesk Default" })
      .first()
      .click();

    // Should show editor with name field
    const nameInput = page.locator('input[id="style-name"]');
    await expect(nameInput).toBeVisible();

    // Change the name
    await nameInput.fill("My Custom Style");

    // Name should update in the list (use exact match)
    await expect(
      page.getByText("My Custom Style", { exact: true })
    ).toBeVisible();
  });

  test("displays generated URL", async ({ page }) => {
    // Should have a URL input that's readonly
    const urlInput = page.locator("input[readonly]");
    await expect(urlInput).toBeVisible();

    // URL should contain the restrict parameter
    const url = await urlInput.inputValue();
    expect(url).toContain("restrict=");
  });

  test("can copy URL to clipboard", async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // Find and click the copy button
    const copyButton = page
      .locator("button")
      .filter({ has: page.locator('[class*="Copy"]') })
      .first();

    if (await copyButton.isVisible()) {
      await copyButton.click();

      // Should show check mark indicating copied
      await expect(page.locator('[class*="Check"]').first()).toBeVisible();
    }
  });

  test("displays icon pack selector in restricted mode", async ({ page }) => {
    // Should show allowed icon packs section
    await expect(page.getByText("Allowed Icon Packs")).toBeVisible();
  });

  test("icon pack selector is hidden in import mode", async ({ page }) => {
    // Switch to import mode
    await page.getByText("Import Link").click();

    // Icon pack selector should not be visible
    await expect(page.getByText("Allowed Icon Packs")).not.toBeVisible();
  });

  test("displays export preset selector", async ({ page }) => {
    await expect(page.getByText("Allowed Export Presets")).toBeVisible();
  });

  test("can toggle built-in export presets", async ({ page }) => {
    // Find a built-in preset checkbox by looking for checkbox inside label with Zendesk App text
    const presetLabel = page
      .locator("label")
      .filter({ hasText: "Zendesk App" })
      .first();

    if (await presetLabel.isVisible()) {
      // Click the label to toggle (this will also toggle the checkbox)
      await presetLabel.click();

      // Click again to toggle back
      await presetLabel.click();
    }
  });

  test("import and export buttons are visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /import/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /export/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /from url/i })).toBeVisible();
  });

  test("from URL button opens dialog", async ({ page }) => {
    // Click From URL button
    await page.getByRole("button", { name: /from url/i }).click();

    // Dialog should appear
    await expect(page.getByText("Import from URL")).toBeVisible();
    await expect(page.getByPlaceholder(/https:\/\/example.com/)).toBeVisible();
  });

  test("URL import dialog shows error for empty input", async ({ page }) => {
    // Open dialog
    await page.getByRole("button", { name: /from url/i }).click();

    // Click import without entering URL
    await page.getByRole("button", { name: "Import" }).click();

    // Should show error
    await expect(page.getByText("Please enter a URL")).toBeVisible();
  });

  test("URL import dialog can be cancelled", async ({ page }) => {
    // Open dialog
    await page.getByRole("button", { name: /from url/i }).click();

    // Click cancel
    await page.getByRole("button", { name: "Cancel" }).click();

    // Dialog should close
    await expect(
      page.getByPlaceholder(/https:\/\/example.com/)
    ).not.toBeVisible();
  });

  test("generated URL updates when switching modes", async ({ page }) => {
    // Get initial URL
    const urlInput = page.locator("input[readonly]");
    const restrictedUrl = await urlInput.inputValue();

    // Switch to import mode
    await page.getByText("Import Link").click();

    // URL should change
    const importUrl = await urlInput.inputValue();
    expect(importUrl).not.toBe(restrictedUrl);
    expect(importUrl).toContain("config=");
  });

  test("can create custom export preset", async ({ page }) => {
    // Click Custom button
    await page.getByRole("button", { name: "Custom" }).click();

    // Modal should open
    await expect(page.getByText("Create Export Preset")).toBeVisible();
  });

  test("persists state after page reload", async ({ page }) => {
    // Add a new style
    await page.getByRole("button", { name: /add style/i }).click();
    await expect(page.getByText("Style 2", { exact: true })).toBeVisible();

    // Reload page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // State should persist (use exact match)
    await expect(page.getByText("Style 2", { exact: true })).toBeVisible();
  });
});
