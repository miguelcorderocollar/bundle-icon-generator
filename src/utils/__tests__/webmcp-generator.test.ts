import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IconMetadata } from "../../types/icon";
import type { ExportPreset } from "../../types/preset";
import type { RestrictedStyle } from "../../types/restriction";
import type {
  IconGeneratorActions,
  IconGeneratorState,
} from "../../hooks/use-icon-generator";
import {
  createGeneratorWebMcpTools,
  type WebMcpGeneratorBindings,
} from "../webmcp-generator";
import type { WebMcpToolDefinition } from "../webmcp";

const featherStar: IconMetadata = {
  id: "feather-star",
  name: "Star",
  pack: "feather",
  svg: '<svg viewBox="0 0 24 24"><path d="M1 1" /></svg>',
  keywords: ["star", "favorite"],
};

const zendeskPreset: ExportPreset = {
  id: "zendesk-app",
  name: "Zendesk App",
  description: "Icon bundle for Zendesk marketplace apps",
  isBuiltIn: true,
  variants: [
    {
      filename: "logo.png",
      width: 320,
      height: 320,
      format: "png",
    },
  ],
};

const mocks = vi.hoisted(() => ({
  renderSvg: vi.fn(() => '<svg viewBox="0 0 128 128"><path /></svg>'),
  downloadFile: vi.fn(),
  generateExportDownloadPayload: vi.fn(),
  validateExport: vi.fn(() => ({ valid: true, errors: [], warnings: [] })),
}));

vi.mock("../icon-catalog", () => ({
  getIconById: vi.fn(async (id: string) =>
    id === featherStar.id ? featherStar : null
  ),
  searchIcons: vi.fn(async () => [featherStar]),
  filterIconsByPack: vi.fn(async (icons: IconMetadata[]) => icons),
}));

vi.mock("../renderer", () => ({ renderSvg: mocks.renderSvg }));

vi.mock("../export-controller", () => ({
  downloadFile: mocks.downloadFile,
  generateExportDownloadPayload: mocks.generateExportDownloadPayload,
  validateExport: mocks.validateExport,
}));

function createState(): IconGeneratorState {
  return {
    selectedLocations: [],
    selectedIconId: featherStar.id,
    backgroundColor: "#063940",
    iconColor: "#ffffff",
    searchQuery: "",
    selectedPack: "all",
    iconSize: 123,
    svgIconSize: 123,
    cornerRadius: 0,
    borderEnabled: false,
    borderColor: "#ffffff",
    borderWidth: 6,
  };
}

function createBindings(state: IconGeneratorState = createState()): {
  bindings: WebMcpGeneratorBindings;
  actions: Record<keyof IconGeneratorActions, ReturnType<typeof vi.fn>>;
} {
  const actions = {
    setSelectedLocations: vi.fn(),
    setSelectedIconId: vi.fn(),
    setBackgroundColor: vi.fn(),
    setIconColor: vi.fn(),
    setSearchQuery: vi.fn(),
    setSelectedPack: vi.fn(),
    setIconSize: vi.fn(),
    setSvgIconSize: vi.fn(),
    setCornerRadius: vi.fn(),
    setBorderEnabled: vi.fn(),
    setBorderColor: vi.fn(),
    setBorderWidth: vi.fn(),
    setBorderStyle: vi.fn(),
  } as Record<keyof IconGeneratorActions, ReturnType<typeof vi.fn>>;

  return {
    actions,
    bindings: {
      getState: () => state,
      getCanvasState: () => ({
        layers: [],
        selectedLayerId: null,
        backgroundColor: state.backgroundColor,
      }),
      getExportPresets: () => [zendeskPreset],
      getSelectedExportPresetId: () => zendeskPreset.id,
      getStylePresets: () => [],
      getSelectedStylePresetId: () => null,
      isIconPackAllowed: () => true,
      isExportPresetAllowed: () => true,
      isRestricted: () => false,
      getAllowedStyles: () => [],
      actions: actions as unknown as IconGeneratorActions,
      selectExportPreset: vi.fn(),
      selectStylePreset: vi.fn(),
    },
  };
}

function findTool(tools: WebMcpToolDefinition[], name: string) {
  const tool = tools.find((candidate) => candidate.name === name);
  if (!tool) {
    throw new Error("Tool " + name + " was not created");
  }
  return tool;
}

function createExecutionOptions(): { signal: AbortSignal } {
  return { signal: new AbortController().signal };
}

describe("generator WebMCP tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.generateExportDownloadPayload.mockResolvedValue({
      blob: new Blob(["zip"]),
      filename: "zendesk-app-icons.zip",
      isZip: true,
      metadata: {
        exportedAt: "2026-01-01T00:00:00.000Z",
        iconId: featherStar.id,
        iconName: featherStar.name,
        customization: {
          backgroundColor: "#063940",
          iconColor: "#ffffff",
          iconSize: 123,
        },
        locations: [],
        variants: ["logo.png"],
      },
      filenames: ["logo.png"],
    });
  });

  it("exposes the full main-page workflow", () => {
    const { bindings } = createBindings();
    expect(
      createGeneratorWebMcpTools(bindings).map((tool) => tool.name)
    ).toEqual([
      "search_icons",
      "get_icon",
      "generate_icon_svg",
      "inspect_generator_state",
      "configure_generator",
      "render_current_icon",
      "export_icon_bundle",
    ]);
  });

  it("configures the visible generator state", async () => {
    const { bindings, actions } = createBindings();
    const tool = findTool(
      createGeneratorWebMcpTools(bindings),
      "configure_generator"
    );

    const result = (await tool.execute(
      {
        iconId: featherStar.id,
        pack: "feather",
        locations: ["top_bar", "nav_bar"],
        backgroundColor: "#17494d",
        iconColor: "#ffffff",
        iconSize: 256,
        exportPresetId: zendeskPreset.id,
      },
      createExecutionOptions()
    )) as { applied: { locations: string[]; pack: string; iconId: string } };

    expect(actions.setSelectedIconId).toHaveBeenCalledWith(featherStar.id);
    expect(actions.setSelectedPack).toHaveBeenCalledWith("feather");
    expect(actions.setSelectedLocations).toHaveBeenCalledWith([
      "top_bar",
      "nav_bar",
    ]);
    expect(actions.setBackgroundColor).toHaveBeenCalledWith("#17494d");
    expect(actions.setIconSize).toHaveBeenCalledWith(256);
    expect(result.applied).toMatchObject({
      iconId: featherStar.id,
      pack: "feather",
      locations: ["top_bar", "nav_bar"],
    });
  });

  it("renders the current visible configuration", async () => {
    const { bindings } = createBindings();
    const tool = findTool(
      createGeneratorWebMcpTools(bindings),
      "render_current_icon"
    );

    const result = (await tool.execute({}, createExecutionOptions())) as {
      svg: string;
      settings: { size: number };
    };

    expect(mocks.renderSvg).toHaveBeenCalledWith(
      expect.objectContaining({ size: 123, iconColor: "#ffffff" })
    );
    expect(result).toMatchObject({
      svg: expect.stringContaining("<svg"),
      settings: { size: 123 },
    });
  });

  it("keeps restricted customization behind allowed style names", async () => {
    const { bindings, actions } = createBindings();
    const restrictedStyle: RestrictedStyle = {
      name: "Brand teal",
      backgroundColor: "#17494d",
      iconColor: "#ffffff",
    };
    bindings.isRestricted = () => true;
    bindings.getAllowedStyles = () => [restrictedStyle];
    const tool = findTool(
      createGeneratorWebMcpTools(bindings),
      "configure_generator"
    );

    await expect(
      tool.execute({ backgroundColor: "#ffffff" }, createExecutionOptions())
    ).rejects.toMatchObject({ code: "customization_not_allowed" });

    const result = (await tool.execute(
      { restrictedStyleName: "brand teal", iconSize: 256 },
      createExecutionOptions()
    )) as { applied: { restrictedStyleName: string } };

    expect(actions.setBackgroundColor).toHaveBeenCalledWith("#17494d");
    expect(actions.setIconColor).toHaveBeenCalledWith("#ffffff");
    expect(result.applied.restrictedStyleName).toBe("Brand teal");
  });

  it("downloads a validated bundle using the selected preset", async () => {
    const { bindings } = createBindings();
    const tool = findTool(
      createGeneratorWebMcpTools(bindings),
      "export_icon_bundle"
    );

    const result = (await tool.execute(
      { exportPresetId: zendeskPreset.id },
      createExecutionOptions()
    )) as { downloaded: boolean; filename: string; isZip: boolean };

    expect(mocks.validateExport).toHaveBeenCalled();
    expect(mocks.generateExportDownloadPayload).toHaveBeenCalledWith(
      expect.objectContaining({ selectedIconId: featherStar.id }),
      [],
      undefined,
      { preset: zendeskPreset }
    );
    expect(mocks.downloadFile).toHaveBeenCalledWith(
      expect.any(Blob),
      "zendesk-app-icons.zip"
    );
    expect(result).toEqual({
      downloaded: true,
      filename: "zendesk-app-icons.zip",
      isZip: true,
      apiVersion: "0.1.0",
      filenames: ["logo.png"],
      metadata: expect.any(Object),
      warnings: [],
    });
  });
});
