import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  generateClipboardPng,
  generateSourceSvgDownload,
  generateStyledSvgDownload,
  getSecondaryExportCapabilities,
  validateExport,
} from "../export-controller";
import type { IconGeneratorState } from "../../hooks/use-icon-generator";
import type { AppLocation } from "../../types/app-location";
import type { ExportPreset } from "../../types/preset";

vi.mock("../icon-catalog", () => ({
  getIconById: vi.fn(),
}));

vi.mock("../renderer", () => ({
  renderSvg: vi.fn(),
  renderPng: vi.fn(),
  renderPngFromImage: vi.fn(),
  renderRasterFromImage: vi.fn(),
  generateExportAssets: vi.fn(),
}));

vi.mock("../canvas-export", () => ({
  generateCanvasExportAssets: vi.fn(),
}));

describe("export-controller", () => {
  const singlePngPreset: ExportPreset = {
    id: "single-png",
    name: "Single PNG",
    description: "Single PNG export",
    isBuiltIn: true,
    variants: [
      {
        filename: "icon.png",
        width: 512,
        height: 512,
        format: "png",
      },
    ],
  };

  const singleSvgPreset: ExportPreset = {
    id: "single-svg",
    name: "Single SVG",
    description: "Single SVG export",
    isBuiltIn: true,
    variants: [
      {
        filename: "icon.svg",
        width: 512,
        height: 512,
        format: "svg",
      },
    ],
  };

  const multiPreset: ExportPreset = {
    id: "multi",
    name: "Multi",
    description: "Multiple exports",
    isBuiltIn: true,
    variants: [
      {
        filename: "icon.png",
        width: 512,
        height: 512,
        format: "png",
      },
      {
        filename: "icon.svg",
        width: 512,
        height: 512,
        format: "svg",
      },
      {
        filename: "icon-large.png",
        width: 1024,
        height: 1024,
        format: "png",
      },
    ],
  };

  const singleWebpPreset: ExportPreset = {
    id: "single-webp",
    name: "Single WebP",
    description: "Single WebP export",
    isBuiltIn: true,
    variants: [
      {
        filename: "icon.webp",
        width: 256,
        height: 256,
        format: "webp",
      },
    ],
  };

  const createMockState = (
    overrides: Partial<IconGeneratorState> = {}
  ): IconGeneratorState => ({
    selectedLocations: [],
    selectedIconId: "test-icon",
    backgroundColor: "#063940",
    iconColor: "#ffffff",
    searchQuery: "",
    selectedPack: "all",
    iconSize: 123,
    svgIconSize: 123,
    ...overrides,
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    sessionStorage.clear();

    const { getIconById } = await import("../icon-catalog");
    const { renderSvg, renderPng, renderPngFromImage } =
      await import("../renderer");
    const { generateCanvasExportAssets } = await import("../canvas-export");

    vi.mocked(getIconById).mockResolvedValue({
      id: "test-icon",
      name: "Test Icon",
      pack: "feather",
      svg: '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>',
      keywords: [],
    });
    vi.mocked(renderSvg).mockReturnValue("<svg>styled</svg>");
    vi.mocked(renderPng).mockResolvedValue(
      new Blob(["png"], { type: "image/png" })
    );
    vi.mocked(renderPngFromImage).mockResolvedValue(
      new Blob(["png"], { type: "image/png" })
    );
    vi.mocked(generateCanvasExportAssets).mockResolvedValue(
      new Map([["clipboard.png", new Blob(["png"], { type: "image/png" })]])
    );
  });

  describe("getSecondaryExportCapabilities", () => {
    it("enables SVG download and PNG copy for standard icon with single PNG preset", () => {
      const capabilities = getSecondaryExportCapabilities(
        createMockState(),
        [],
        undefined,
        { preset: singlePngPreset }
      );

      expect(capabilities).toEqual({
        canDownloadStyledSvg: true,
        canDownloadSourceSvg: true,
        canCopyPng: true,
      });
    });

    it("disables PNG copy for SVG-only preset", () => {
      const capabilities = getSecondaryExportCapabilities(
        createMockState(),
        [],
        undefined,
        { preset: singleSvgPreset }
      );

      expect(capabilities.canCopyPng).toBe(false);
      expect(capabilities.canDownloadStyledSvg).toBe(true);
      expect(capabilities.canDownloadSourceSvg).toBe(true);
    });

    it("enables PNG copy for multi-file presets when a raster variant exists", () => {
      const capabilities = getSecondaryExportCapabilities(
        createMockState(),
        [],
        undefined,
        { preset: multiPreset }
      );

      expect(capabilities.canCopyPng).toBe(true);
    });

    it("disables SVG actions for canvas mode and enables PNG copy for a single raster variant", () => {
      const capabilities = getSecondaryExportCapabilities(
        createMockState({ selectedPack: "canvas", selectedIconId: "canvas" }),
        [],
        { layers: [{ id: "1" }] } as never,
        { preset: singlePngPreset }
      );

      expect(capabilities.canDownloadStyledSvg).toBe(false);
      expect(capabilities.canDownloadSourceSvg).toBe(false);
      expect(capabilities.canCopyPng).toBe(true);
    });

    it("disables SVG actions for custom images", () => {
      const capabilities = getSecondaryExportCapabilities(
        createMockState({ selectedIconId: "custom-image-1" }),
        [],
        undefined,
        { preset: singlePngPreset }
      );

      expect(capabilities.canDownloadStyledSvg).toBe(false);
      expect(capabilities.canDownloadSourceSvg).toBe(false);
      expect(capabilities.canCopyPng).toBe(true);
    });

    it("enables both SVG actions for custom SVG icons", () => {
      const capabilities = getSecondaryExportCapabilities(
        createMockState({ selectedIconId: "custom-svg-1" }),
        [],
        undefined,
        { preset: singlePngPreset }
      );

      expect(capabilities.canDownloadStyledSvg).toBe(true);
      expect(capabilities.canDownloadSourceSvg).toBe(true);
    });
  });

  describe("direct download helpers", () => {
    it("returns a styled SVG blob with the default filename", async () => {
      const { renderSvg } = await import("../renderer");
      const result = await generateStyledSvgDownload(createMockState());
      expect(result.filename).toBe("icon.svg");
      expect(result.blob.type).toBe("image/svg+xml");
      expect(result.blob.size).toBeGreaterThan(0);
      expect(renderSvg).toHaveBeenCalledWith(
        expect.objectContaining({
          backgroundColor: "transparent",
        })
      );
    });

    it("returns raw SVG source with a sanitized filename", async () => {
      const result = await generateSourceSvgDownload(
        createMockState({ selectedIconId: "test-icon" })
      );

      expect(result.filename).toBe("test-icon.svg");
      expect(result.blob.size).toBeGreaterThan(0);
    });

    it("throws when source SVG is requested for a custom image", async () => {
      await expect(
        generateSourceSvgDownload(
          createMockState({ selectedIconId: "custom-image-1" })
        )
      ).rejects.toThrow("Custom images do not support SVG download");
    });
  });

  describe("generateClipboardPng", () => {
    it("renders clipboard PNG for standard icons", async () => {
      const { renderPng } = await import("../renderer");

      const blob = await generateClipboardPng(
        createMockState(),
        [],
        undefined,
        {
          preset: singlePngPreset,
        }
      );

      expect(blob.type).toBe("image/png");
      expect(renderPng).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 512,
          height: 512,
        })
      );
    });

    it("renders clipboard PNG for custom images", async () => {
      const { renderPngFromImage } = await import("../renderer");
      sessionStorage.setItem("custom-image-1", "data:image/png;base64,abc");

      const blob = await generateClipboardPng(
        createMockState({ selectedIconId: "custom-image-1" }),
        [],
        undefined,
        { preset: singlePngPreset }
      );

      expect(blob.type).toBe("image/png");
      expect(renderPngFromImage).toHaveBeenCalled();
    });

    it("uses the biggest PNG when multiple raster variants exist", async () => {
      const { renderPng } = await import("../renderer");

      await generateClipboardPng(createMockState(), [], undefined, {
        preset: multiPreset,
      });

      expect(renderPng).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 1024,
          height: 1024,
        })
      );
    });

    it("falls back to the biggest raster variant when no PNG exists", async () => {
      const { renderPng } = await import("../renderer");

      await generateClipboardPng(createMockState(), [], undefined, {
        preset: singleWebpPreset,
      });

      expect(renderPng).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 256,
          height: 256,
        })
      );
    });

    it("renders clipboard PNG for canvas mode", async () => {
      const blob = await generateClipboardPng(
        createMockState({ selectedPack: "canvas", selectedIconId: "canvas" }),
        [],
        { layers: [{ id: "1" }] } as never,
        { preset: singlePngPreset }
      );

      expect(blob.type).toBe("image/png");
    });
  });

  describe("validateExport", () => {
    it("returns valid when icon is selected", () => {
      const state = createMockState({ selectedIconId: "test-icon" });
      const locations: AppLocation[] = [];

      const result = validateExport(state, locations);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("returns invalid when no icon is selected", () => {
      const state = createMockState({ selectedIconId: undefined });
      const locations: AppLocation[] = [];

      const result = validateExport(state, locations);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("No icon selected");
    });

    it("warns when no locations are selected", () => {
      const state = createMockState();
      const locations: AppLocation[] = [];

      const result = validateExport(state, locations);

      expect(result.warnings).toContain(
        "No app locations selected - only default PNGs will be exported"
      );
    });

    it("does not warn about locations when locations are selected", () => {
      const state = createMockState();
      const locations: AppLocation[] = ["top_bar"];

      const result = validateExport(state, locations);

      expect(result.warnings).not.toContain(
        "No app locations selected - only default PNGs will be exported"
      );
    });

    it("warns about low contrast colors", () => {
      const state = createMockState({
        backgroundColor: "#000000",
        iconColor: "#333333",
      });
      const locations: AppLocation[] = [];

      const result = validateExport(state, locations);

      expect(result.warnings.some((w) => w.includes("contrast"))).toBe(true);
    });

    it("does not warn about high contrast colors", () => {
      const state = createMockState({
        backgroundColor: "#000000",
        iconColor: "#ffffff",
      });
      const locations: AppLocation[] = [];

      const result = validateExport(state, locations);

      expect(result.warnings.some((w) => w.includes("contrast"))).toBe(false);
    });

    it("handles gradient backgrounds for contrast check", () => {
      const state = createMockState({
        backgroundColor: {
          type: "linear",
          angle: 90,
          stops: [
            { color: "#000000", offset: 0 },
            { color: "#333333", offset: 100 },
          ],
        },
        iconColor: "#ffffff",
      });
      const locations: AppLocation[] = [];

      const result = validateExport(state, locations);

      expect(result.valid).toBe(true);
    });

    it("returns valid result structure", () => {
      const state = createMockState();
      const locations: AppLocation[] = [];

      const result = validateExport(state, locations);

      expect(result).toHaveProperty("valid");
      expect(result).toHaveProperty("errors");
      expect(result).toHaveProperty("warnings");
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it("accumulates multiple issues", () => {
      const state = createMockState({
        selectedIconId: undefined,
        backgroundColor: "#111111",
        iconColor: "#222222",
      });
      const locations: AppLocation[] = [];

      const result = validateExport(state, locations);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    describe("color contrast edge cases", () => {
      it("detects low contrast with similar light colors", () => {
        const state = createMockState({
          backgroundColor: "#ffffff",
          iconColor: "#eeeeee",
        });

        const result = validateExport(state, []);

        expect(result.warnings.some((w) => w.includes("contrast"))).toBe(true);
      });

      it("accepts medium contrast colors", () => {
        const state = createMockState({
          backgroundColor: "#003366",
          iconColor: "#ffffff",
        });

        const result = validateExport(state, []);

        expect(result.warnings.some((w) => w.includes("contrast"))).toBe(false);
      });
    });
  });
});
