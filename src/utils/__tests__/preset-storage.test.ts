/**
 * Tests for preset storage utilities
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  getCustomExportPresets,
  getAllExportPresets,
  addExportPreset,
  updateExportPreset,
  deleteExportPreset,
  getCustomStylePresets,
  getAllStylePresets,
  addStylePreset,
  updateStylePreset,
  deleteStylePreset,
  getSelectedExportPresetId,
  setSelectedExportPresetId,
  getSelectedStylePresetId,
  setSelectedStylePresetId,
  exportUserPresets,
  importUserPresets,
  clearAllCustomPresets,
} from "../preset-storage";
import {
  BUILTIN_EXPORT_PRESETS,
  BUILTIN_STYLE_PRESETS,
} from "../builtin-presets";

describe("preset-storage", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe("Export Presets", () => {
    it("should return empty array when no custom presets exist", () => {
      const presets = getCustomExportPresets();
      expect(presets).toEqual([]);
    });

    it("should return built-in presets in getAllExportPresets", () => {
      const presets = getAllExportPresets();
      expect(presets.length).toBeGreaterThanOrEqual(
        BUILTIN_EXPORT_PRESETS.length
      );
      expect(presets.some((p) => p.id === "zendesk-app")).toBe(true);
      expect(presets.some((p) => p.id === "raycast-extension")).toBe(true);
    });

    it("should add a new export preset", () => {
      const preset = addExportPreset({
        name: "My Preset",
        description: "Test preset",
        variants: [
          { filename: "icon.png", width: 256, height: 256, format: "png" },
        ],
      });

      expect(preset.id).toBeDefined();
      expect(preset.name).toBe("My Preset");
      expect(preset.isBuiltIn).toBe(false);
      expect(preset.createdAt).toBeDefined();

      const customPresets = getCustomExportPresets();
      expect(customPresets).toHaveLength(1);
      expect(customPresets[0].id).toBe(preset.id);
    });

    it("should update an existing export preset", () => {
      const preset = addExportPreset({
        name: "My Preset",
        description: "Test preset",
        variants: [],
      });

      const updated = updateExportPreset(preset.id, {
        name: "Updated Preset",
      });

      expect(updated?.name).toBe("Updated Preset");
      expect(updated?.updatedAt).toBeDefined();
    });

    it("should delete an export preset", () => {
      const preset = addExportPreset({
        name: "My Preset",
        description: "Test preset",
        variants: [],
      });

      expect(getCustomExportPresets()).toHaveLength(1);

      const deleted = deleteExportPreset(preset.id);
      expect(deleted).toBe(true);
      expect(getCustomExportPresets()).toHaveLength(0);
    });

    it("should not delete built-in presets", () => {
      const deleted = deleteExportPreset("zendesk-app");
      expect(deleted).toBe(false);
    });
  });

  describe("Style Presets", () => {
    it("should return empty array when no custom presets exist", () => {
      const presets = getCustomStylePresets();
      expect(presets).toEqual([]);
    });

    it("should return built-in presets in getAllStylePresets", () => {
      const presets = getAllStylePresets();
      expect(presets.length).toBeGreaterThanOrEqual(
        BUILTIN_STYLE_PRESETS.length
      );
      expect(presets.some((p) => p.id === "zendesk-kale")).toBe(true);
      expect(presets.some((p) => p.id === "dark-mode")).toBe(true);
    });

    it("should add a new style preset", () => {
      const preset = addStylePreset({
        name: "My Style",
        backgroundColor: "#ff0000",
        iconColor: "#ffffff",
      });

      expect(preset.id).toBeDefined();
      expect(preset.name).toBe("My Style");
      expect(preset.isBuiltIn).toBe(false);

      const customPresets = getCustomStylePresets();
      expect(customPresets).toHaveLength(1);
    });

    it("should add a new style preset with colorPalette", () => {
      const preset = addStylePreset({
        name: "My Style With Palette",
        backgroundColor: "#ff0000",
        iconColor: "#ffffff",
        colorPalette: [
          { id: "color-1", name: "Primary", color: "#ffffff" },
          { id: "color-2", name: "Secondary", color: "#000000" },
        ],
      });

      expect(preset.colorPalette).toBeDefined();
      expect(preset.colorPalette).toHaveLength(2);
      expect(preset.colorPalette?.[0].name).toBe("Primary");

      const customPresets = getCustomStylePresets();
      expect(customPresets).toHaveLength(1);
      expect(customPresets[0].colorPalette).toHaveLength(2);
    });

    it("should update an existing style preset", () => {
      const preset = addStylePreset({
        name: "My Style",
        backgroundColor: "#ff0000",
        iconColor: "#ffffff",
      });

      const updated = updateStylePreset(preset.id, {
        name: "Updated Style",
        backgroundColor: "#00ff00",
      });

      expect(updated?.name).toBe("Updated Style");
      expect(updated?.backgroundColor).toBe("#00ff00");
    });

    it("should delete a style preset", () => {
      const preset = addStylePreset({
        name: "My Style",
        backgroundColor: "#ff0000",
        iconColor: "#ffffff",
      });

      const deleted = deleteStylePreset(preset.id);
      expect(deleted).toBe(true);
      expect(getCustomStylePresets()).toHaveLength(0);
    });
  });

  describe("Selected Presets", () => {
    it("should return default export preset when none selected", () => {
      const id = getSelectedExportPresetId();
      expect(id).toBe("zendesk-app");
    });

    it("should set and get selected export preset", () => {
      setSelectedExportPresetId("raycast-extension");
      expect(getSelectedExportPresetId()).toBe("raycast-extension");
    });

    it("should return null for style preset when none selected", () => {
      const id = getSelectedStylePresetId();
      expect(id).toBeNull();
    });

    it("should set and get selected style preset", () => {
      setSelectedStylePresetId("dark-mode");
      expect(getSelectedStylePresetId()).toBe("dark-mode");
    });

    it("should clear selected style preset", () => {
      setSelectedStylePresetId("dark-mode");
      setSelectedStylePresetId(null);
      expect(getSelectedStylePresetId()).toBeNull();
    });
  });

  describe("Import/Export", () => {
    it("should export user presets as JSON with version 2", () => {
      addExportPreset({
        name: "Export Test",
        description: "Test",
        variants: [],
      });

      addStylePreset({
        name: "Style Test",
        backgroundColor: "#000000",
        iconColor: "#ffffff",
        colorPalette: [{ id: "color-1", name: "Primary", color: "#ffffff" }],
      });

      const json = exportUserPresets();
      const data = JSON.parse(json);

      expect(data.version).toBe(2);
      expect(data.exportPresets).toHaveLength(1);
      expect(data.stylePresets).toHaveLength(1);
      expect(data.stylePresets[0].colorPalette).toHaveLength(1);
      expect(data.exportedAt).toBeDefined();
    });

    it("should import presets from JSON", () => {
      const importData = JSON.stringify({
        version: 1,
        exportPresets: [
          {
            id: "imported-export",
            name: "Imported Export",
            description: "Test",
            variants: [],
            isBuiltIn: false,
          },
        ],
        stylePresets: [
          {
            id: "imported-style",
            name: "Imported Style",
            backgroundColor: "#123456",
            iconColor: "#ffffff",
            isBuiltIn: false,
          },
        ],
        exportedAt: new Date().toISOString(),
      });

      const result = importUserPresets(importData);

      expect(result.success).toBe(true);
      expect(result.exportPresetsImported).toBe(1);
      expect(result.stylePresetsImported).toBe(1);

      expect(getCustomExportPresets()).toHaveLength(1);
      expect(getCustomStylePresets()).toHaveLength(1);
    });

    it("should import presets with colorPalette", () => {
      const importData = JSON.stringify({
        version: 2,
        exportPresets: [],
        stylePresets: [
          {
            id: "v2-style",
            name: "V2 Style With Palette",
            backgroundColor: "#123456",
            iconColor: "#ffffff",
            isBuiltIn: false,
            colorPalette: [
              { id: "color-1", name: "Primary", color: "#ffffff" },
              { id: "color-2", name: "Secondary", color: "#000000" },
            ],
          },
        ],
        exportedAt: new Date().toISOString(),
      });

      const result = importUserPresets(importData);

      expect(result.success).toBe(true);
      expect(result.stylePresetsImported).toBe(1);

      const presets = getCustomStylePresets();
      expect(presets).toHaveLength(1);
      expect(presets[0].colorPalette).toHaveLength(2);
      expect(presets[0].colorPalette?.[0].name).toBe("Primary");
    });

    it("should handle invalid JSON during import", () => {
      const result = importUserPresets("invalid json");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle invalid preset format during import", () => {
      const result = importUserPresets(JSON.stringify({ foo: "bar" }));

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid preset file format");
    });
  });

  describe("Clear All", () => {
    it("should clear all custom presets", () => {
      addExportPreset({
        name: "Test",
        description: "Test",
        variants: [],
      });
      addStylePreset({
        name: "Test",
        backgroundColor: "#000",
        iconColor: "#fff",
      });
      setSelectedExportPresetId("test-id");
      setSelectedStylePresetId("test-id");

      clearAllCustomPresets();

      expect(getCustomExportPresets()).toHaveLength(0);
      expect(getCustomStylePresets()).toHaveLength(0);
      expect(getSelectedExportPresetId()).toBe("zendesk-app");
      expect(getSelectedStylePresetId()).toBeNull();
    });
  });
});
