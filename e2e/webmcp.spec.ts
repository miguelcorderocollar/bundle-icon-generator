import { expect, test } from "@playwright/test";

test.describe("WebMCP demo", () => {
  test("renders the manual tool call in a regular browser", async ({
    page,
  }) => {
    await page.goto("/webmcp");

    await expect(
      page.getByText("WebMCP is not available in this browser")
    ).toBeVisible();
    await page.getByRole("button", { name: "Run tool" }).click();

    await expect(page.getByAltText("Star")).toBeVisible();
    await expect(page.getByText("v0.1.0")).toBeVisible();
  });

  test("registers tools when a WebMCP model context is present", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const testWindow = window as Window & {
        __registeredWebMcpTools: Array<{ name: string }>;
      };
      testWindow.__registeredWebMcpTools = [];

      Object.defineProperty(document, "modelContext", {
        configurable: true,
        value: {
          registerTool: async (tool: { name: string }) => {
            testWindow.__registeredWebMcpTools.push(tool);
          },
        },
      });
    });
    await page.goto("/webmcp");

    await expect(page.getByText("WebMCP detected")).toBeVisible();
    const registeredNames = await page.evaluate(() => {
      const testWindow = window as Window & {
        __registeredWebMcpTools: Array<{ name: string }>;
      };
      return testWindow.__registeredWebMcpTools.map((tool) => tool.name);
    });

    expect(registeredNames).toEqual([
      "search_icons",
      "get_icon",
      "generate_icon_svg",
    ]);
  });
});
