import { test, expect } from "@playwright/test";

test.describe("Theme Toggle", () => {
  test.beforeEach(async ({ page }) => {
    // Set localStorage to skip welcome modal before navigating
    await page.addInitScript(() => {
      localStorage.setItem("zdk-icon-generator:welcome-seen", "true");
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("has theme toggle button", async ({ page }) => {
    // Find the theme toggle button (has moon or sun icon)
    const themeButton = page.getByRole("button", { name: /toggle theme/i });
    await expect(themeButton).toBeVisible();
  });

  test("can toggle between light and dark theme", async ({ page }) => {
    const themeButton = page.getByRole("button", { name: /toggle theme/i });

    // Get initial theme
    const html = page.locator("html");
    const initialClass = await html.getAttribute("class");
    const initialIsDark = initialClass?.includes("dark");

    // Click toggle
    await themeButton.click();
    await page.waitForTimeout(300);

    // Check theme changed
    const newClass = await html.getAttribute("class");
    const newIsDark = newClass?.includes("dark");

    expect(newIsDark).not.toBe(initialIsDark);
  });

  test("theme persists across reload", async ({ page }) => {
    const themeButton = page.getByRole("button", { name: /toggle theme/i });
    const html = page.locator("html");

    // Get initial theme
    const initialClass = await html.getAttribute("class");
    const initialIsDark = initialClass?.includes("dark");

    // Toggle theme
    await themeButton.click();
    await page.waitForTimeout(300);

    // Reload
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Check theme was preserved
    const reloadedClass = await html.getAttribute("class");
    const reloadedIsDark = reloadedClass?.includes("dark");

    // Theme should be opposite of initial (since we toggled)
    expect(reloadedIsDark).not.toBe(initialIsDark);
  });

  test("dark theme applies correct styles", async ({ page }) => {
    const html = page.locator("html");
    const themeButton = page.getByRole("button", { name: /toggle theme/i });

    // Ensure we're in dark mode
    const currentClass = await html.getAttribute("class");
    if (!currentClass?.includes("dark")) {
      await themeButton.click();
      await page.waitForTimeout(300);
    }

    // Verify dark class is applied
    await expect(html).toHaveClass(/dark/);
  });

  test("light theme applies correct styles", async ({ page }) => {
    const html = page.locator("html");
    const themeButton = page.getByRole("button", { name: /toggle theme/i });

    // Ensure we're in light mode
    const currentClass = await html.getAttribute("class");
    if (currentClass?.includes("dark")) {
      await themeButton.click();
      await page.waitForTimeout(300);
    }

    // Verify dark class is NOT applied
    const finalClass = await html.getAttribute("class");
    expect(finalClass).not.toContain("dark");
  });

  test("theme toggle shows correct icon", async ({ page }) => {
    const themeButton = page.getByRole("button", { name: /toggle theme/i });
    const html = page.locator("html");

    // Get current theme
    const currentClass = await html.getAttribute("class");
    const isDark = currentClass?.includes("dark");

    // In dark mode, should show sun icon (to switch to light)
    // In light mode, should show moon icon (to switch to dark)
    if (isDark) {
      // Look for sun icon
      const sunIcon = themeButton.locator(".lucide-sun");
      await expect(sunIcon).toBeVisible();
    } else {
      // Look for moon icon
      const moonIcon = themeButton.locator(".lucide-moon");
      await expect(moonIcon).toBeVisible();
    }
  });
});
