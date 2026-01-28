/**
 * Tests for preset type definitions and type guards
 */

import { describe, it, expect } from "vitest";
import {
  isExportPreset,
  isStylePreset,
  isExportVariantConfig,
  isPresetExportData,
  isColorPaletteEntry,
  formatSupportsQuality,
  formatSupportsTransparency,
  getFormatMimeType,
  getFormatExtension,
  EXPORT_FORMATS,
} from "../preset";
import type {
  ExportPreset,
  StylePreset,
  ExportVariantConfig,
  PresetExportData,
  ColorPaletteEntry,
} from "../preset";

describe("preset types", () => {
  describe("isExportPreset", () => {
    it("should return true for valid export preset", () => {
      const preset: ExportPreset = {
        id: "test",
        name: "Test",
        description: "Test preset",
        variants: [],
        isBuiltIn: false,
      };
      expect(isExportPreset(preset)).toBe(true);
    });

    it("should return false for invalid objects", () => {
      expect(isExportPreset(null)).toBe(false);
      expect(isExportPreset(undefined)).toBe(false);
      expect(isExportPreset({ id: "test" })).toBe(false);
      expect(isExportPreset({ id: "test", name: "Test" })).toBe(false);
    });
  });

  describe("isColorPaletteEntry", () => {
    it("should return true for valid color palette entry", () => {
      const entry: ColorPaletteEntry = {
        id: "color-1",
        name: "Primary",
        color: "#ffffff",
      };
      expect(isColorPaletteEntry(entry)).toBe(true);
    });

    it("should return false for invalid objects", () => {
      expect(isColorPaletteEntry(null)).toBe(false);
      expect(isColorPaletteEntry(undefined)).toBe(false);
      expect(isColorPaletteEntry({ id: "test" })).toBe(false);
      expect(isColorPaletteEntry({ id: "test", name: "Test" })).toBe(false);
      expect(
        isColorPaletteEntry({ id: 123, name: "Test", color: "#fff" })
      ).toBe(false);
    });
  });

  describe("isStylePreset", () => {
    it("should return true for valid style preset", () => {
      const preset: StylePreset = {
        id: "test",
        name: "Test",
        backgroundColor: "#000000",
        iconColor: "#ffffff",
        isBuiltIn: false,
      };
      expect(isStylePreset(preset)).toBe(true);
    });

    it("should return true for style preset with valid colorPalette", () => {
      const preset: StylePreset = {
        id: "test",
        name: "Test",
        backgroundColor: "#000000",
        iconColor: "#ffffff",
        isBuiltIn: false,
        colorPalette: [
          { id: "color-1", name: "Primary", color: "#ffffff" },
          { id: "color-2", name: "Secondary", color: "#000000" },
        ],
      };
      expect(isStylePreset(preset)).toBe(true);
    });

    it("should return true for style preset with empty colorPalette", () => {
      const preset: StylePreset = {
        id: "test",
        name: "Test",
        backgroundColor: "#000000",
        iconColor: "#ffffff",
        isBuiltIn: false,
        colorPalette: [],
      };
      expect(isStylePreset(preset)).toBe(true);
    });

    it("should return false for style preset with invalid colorPalette", () => {
      const preset = {
        id: "test",
        name: "Test",
        backgroundColor: "#000000",
        iconColor: "#ffffff",
        isBuiltIn: false,
        colorPalette: [{ invalid: "entry" }],
      };
      expect(isStylePreset(preset)).toBe(false);
    });

    it("should return false for style preset with non-array colorPalette", () => {
      const preset = {
        id: "test",
        name: "Test",
        backgroundColor: "#000000",
        iconColor: "#ffffff",
        isBuiltIn: false,
        colorPalette: "not-an-array",
      };
      expect(isStylePreset(preset)).toBe(false);
    });

    it("should return false for invalid objects", () => {
      expect(isStylePreset(null)).toBe(false);
      expect(isStylePreset({ id: "test", name: "Test" })).toBe(false);
    });
  });

  describe("isExportVariantConfig", () => {
    it("should return true for valid variant config", () => {
      const config: ExportVariantConfig = {
        filename: "icon.png",
        width: 512,
        height: 512,
        format: "png",
      };
      expect(isExportVariantConfig(config)).toBe(true);
    });

    it("should return false for invalid objects", () => {
      expect(isExportVariantConfig(null)).toBe(false);
      expect(isExportVariantConfig({ filename: "test" })).toBe(false);
    });
  });

  describe("isPresetExportData", () => {
    it("should return true for valid export data", () => {
      const data: PresetExportData = {
        version: 1,
        exportPresets: [],
        stylePresets: [],
        exportedAt: new Date().toISOString(),
      };
      expect(isPresetExportData(data)).toBe(true);
    });

    it("should return false for invalid objects", () => {
      expect(isPresetExportData(null)).toBe(false);
      expect(isPresetExportData({ version: 1 })).toBe(false);
    });
  });

  describe("formatSupportsQuality", () => {
    it("should return true for JPEG", () => {
      expect(formatSupportsQuality("jpeg")).toBe(true);
    });

    it("should return true for WebP", () => {
      expect(formatSupportsQuality("webp")).toBe(true);
    });

    it("should return false for PNG", () => {
      expect(formatSupportsQuality("png")).toBe(false);
    });

    it("should return false for SVG", () => {
      expect(formatSupportsQuality("svg")).toBe(false);
    });

    it("should return false for ICO", () => {
      expect(formatSupportsQuality("ico")).toBe(false);
    });
  });

  describe("formatSupportsTransparency", () => {
    it("should return true for PNG", () => {
      expect(formatSupportsTransparency("png")).toBe(true);
    });

    it("should return true for WebP", () => {
      expect(formatSupportsTransparency("webp")).toBe(true);
    });

    it("should return true for SVG", () => {
      expect(formatSupportsTransparency("svg")).toBe(true);
    });

    it("should return false for JPEG", () => {
      expect(formatSupportsTransparency("jpeg")).toBe(false);
    });

    it("should return false for ICO", () => {
      expect(formatSupportsTransparency("ico")).toBe(false);
    });
  });

  describe("getFormatMimeType", () => {
    it("should return correct MIME types", () => {
      expect(getFormatMimeType("png")).toBe("image/png");
      expect(getFormatMimeType("jpeg")).toBe("image/jpeg");
      expect(getFormatMimeType("webp")).toBe("image/webp");
      expect(getFormatMimeType("svg")).toBe("image/svg+xml");
      expect(getFormatMimeType("ico")).toBe("image/x-icon");
    });
  });

  describe("getFormatExtension", () => {
    it("should return correct extensions", () => {
      expect(getFormatExtension("png")).toBe("png");
      expect(getFormatExtension("jpeg")).toBe("jpg");
      expect(getFormatExtension("webp")).toBe("webp");
      expect(getFormatExtension("svg")).toBe("svg");
      expect(getFormatExtension("ico")).toBe("ico");
    });
  });

  describe("EXPORT_FORMATS", () => {
    it("should contain all supported formats", () => {
      expect(EXPORT_FORMATS).toContain("png");
      expect(EXPORT_FORMATS).toContain("jpeg");
      expect(EXPORT_FORMATS).toContain("webp");
      expect(EXPORT_FORMATS).toContain("svg");
      expect(EXPORT_FORMATS).toContain("ico");
    });
  });
});
