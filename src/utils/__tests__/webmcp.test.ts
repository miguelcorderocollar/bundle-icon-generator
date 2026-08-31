import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IconMetadata } from "../../types/icon";
import {
  createWebMcpTools,
  registerWebMcpTools,
  type WebMcpModelContext,
  type WebMcpToolDefinition,
} from "../webmcp";

const featherStar: IconMetadata = {
  id: "feather-star",
  name: "Star",
  pack: "feather",
  svg: '<svg viewBox="0 0 24 24"><path d="M1 1" /></svg>',
  keywords: ["star", "favorite"],
};

vi.mock("../icon-catalog", () => ({
  getIconById: vi.fn(async (id: string) =>
    id === featherStar.id ? featherStar : null
  ),
  searchIcons: vi.fn(async () => [featherStar]),
  filterIconsByPack: vi.fn((icons: IconMetadata[], pack: string) =>
    pack === "all" ? icons : icons.filter((icon) => icon.pack === pack)
  ),
}));

vi.mock("../renderer", () => ({
  renderSvg: vi.fn(() => '<svg viewBox="0 0 128 128"><path /></svg>'),
}));

function createExecutionOptions(): { signal: AbortSignal } {
  return { signal: new AbortController().signal };
}

function findTool(tools: WebMcpToolDefinition[], name: string) {
  const tool = tools.find((candidate) => candidate.name === name);
  if (!tool) {
    throw new Error("Tool " + name + " was not created");
  }
  return tool;
}

describe("webmcp tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers the demo tools and can dispose them", async () => {
    const registeredTools: WebMcpToolDefinition[] = [];
    const registerTool = vi.fn(
      async (
        tool: WebMcpToolDefinition,
        _options?: { signal?: AbortSignal }
      ) => {
        registeredTools.push(tool);
      }
    );
    const modelContext: WebMcpModelContext = { registerTool };

    const registration = await registerWebMcpTools(modelContext);

    expect(registeredTools.map((tool) => tool.name)).toEqual([
      "search_icons",
      "get_icon",
      "generate_icon_svg",
    ]);
    expect(registration.toolNames).toEqual([
      "search_icons",
      "get_icon",
      "generate_icon_svg",
    ]);

    registration.dispose();
    expect(registerTool.mock.calls[0][1]?.signal?.aborted).toBe(true);
  });

  it("returns compact search results without SVG source", async () => {
    const tool = findTool(createWebMcpTools(), "search_icons");
    const result = (await tool.execute(
      { query: "star", limit: 5 },
      createExecutionOptions()
    )) as { icons: Array<Record<string, unknown>>; count: number };

    expect(result.count).toBe(1);
    expect(result.icons[0]).toMatchObject({
      id: "feather-star",
      name: "Star",
      pack: "feather",
    });
    expect(result.icons[0]).not.toHaveProperty("svg");
  });

  it("generates an SVG using validated tool input", async () => {
    const tool = findTool(createWebMcpTools(), "generate_icon_svg");
    const result = (await tool.execute(
      {
        iconId: "feather-star",
        backgroundColor: "#17494d",
        iconColor: "#ffffff",
        size: 128,
      },
      createExecutionOptions()
    )) as { svg: string; settings: { outputSize: number } };

    expect(result.svg).toContain("<svg");
    expect(result.settings.outputSize).toBe(128);
  });

  it("returns stable errors for missing icons and invalid input", async () => {
    const tools = createWebMcpTools();
    const getIconTool = findTool(tools, "get_icon");
    const generateTool = findTool(tools, "generate_icon_svg");

    await expect(
      getIconTool.execute({ iconId: "missing-icon" }, createExecutionOptions())
    ).rejects.toMatchObject({ code: "icon_not_found" });

    await expect(
      generateTool.execute(
        { iconId: "feather-star", iconColor: "not-a-color" },
        createExecutionOptions()
      )
    ).rejects.toMatchObject({ code: "invalid_input" });
  });
});
