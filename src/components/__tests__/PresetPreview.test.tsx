import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PresetPreview } from "../PresetPreview";
import type { IconGeneratorState } from "../../hooks/use-icon-generator";
import type { ExportPreset } from "../../types/preset";
import { SVG_SPECS } from "../../constants/app";

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("../../utils/icon-catalog", () => ({
  getIconById: vi.fn(),
}));

vi.mock("../../utils/renderer", () => ({
  renderPng: vi.fn(),
  renderPngFromImage: vi.fn(),
  renderRaster: vi.fn(),
  renderSvg: vi.fn(),
}));

vi.mock("../../utils/locations", () => ({
  isCustomImageIcon: vi.fn(() => false),
}));

vi.mock("../../utils/gradients", () => ({
  isGradient: vi.fn(() => false),
  gradientToCss: vi.fn(() => ""),
}));

vi.mock("../../utils/image-color-analysis", () => ({
  getColorOverride: vi.fn(() => null),
  getColorAnalysis: vi.fn(() => null),
}));

describe("PresetPreview", () => {
  const mockPreset: ExportPreset = {
    id: "favicon-bundle",
    name: "Favicon Bundle",
    description: "Complete favicon set for websites",
    isBuiltIn: true,
    variants: [
      {
        filename: "favicon.ico",
        width: 32,
        height: 32,
        format: "ico",
      },
    ],
  };

  const mockZendeskSvgPreset: ExportPreset = {
    id: "zendesk-location-bundle",
    name: "Zendesk Location Bundle",
    description: "Zendesk SVG location files",
    isBuiltIn: true,
    variants: [
      {
        filename: "icon_top_bar.svg",
        width: 30,
        height: 30,
        format: "svg",
      },
    ],
  };

  const mockState: IconGeneratorState = {
    selectedLocations: [],
    selectedIconId: "test-icon",
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

  beforeEach(async () => {
    vi.clearAllMocks();

    const { getIconById } = await import("../../utils/icon-catalog");
    const { renderPng, renderSvg } = await import("../../utils/renderer");

    vi.mocked(getIconById).mockResolvedValue({
      id: "test-icon",
      name: "Test Icon",
      svg: '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>',
      pack: "feather",
      categories: [],
      keywords: [],
    });

    vi.mocked(renderPng).mockResolvedValue(
      new Blob(["png-preview"], { type: "image/png" })
    );
    vi.mocked(renderSvg).mockReturnValue(
      '<svg viewBox="0 0 30 30"><path fill="currentColor" d="M0 0"/></svg>'
    );

    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:ico-preview"),
      revokeObjectURL: vi.fn(),
    });
  });

  it("renders an image preview for ico variants", async () => {
    const { renderPng } = await import("../../utils/renderer");

    render(
      <PresetPreview preset={mockPreset} iconId="test-icon" state={mockState} />
    );

    await waitFor(() => {
      expect(screen.getByAltText("favicon.ico")).toHaveAttribute(
        "src",
        "blob:ico-preview"
      );
    });

    expect(renderPng).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 32,
        height: 32,
        size: mockState.iconSize,
        backgroundColor: mockState.backgroundColor,
        iconColor: mockState.iconColor,
      })
    );
  });

  it("uses zendesk SVG export settings for zendesk location variants", async () => {
    const { renderSvg } = await import("../../utils/renderer");

    render(
      <PresetPreview
        preset={mockZendeskSvgPreset}
        iconId="test-icon"
        state={mockState}
      />
    );

    await waitFor(() => {
      expect(renderSvg).toHaveBeenCalledWith(
        expect.objectContaining({
          size: SVG_SPECS.PADDED_SIZE,
          outputSize: 30,
          zendeskLocationMode: true,
        })
      );
    });
  });
});
