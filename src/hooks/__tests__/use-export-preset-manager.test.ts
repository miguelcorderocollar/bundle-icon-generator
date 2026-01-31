import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useExportPresetManager } from "../use-export-preset-manager";
import type { RestrictionConfig } from "../../types/restriction";

// Mock builtin presets
vi.mock("../../utils/builtin-presets", () => ({
  BUILTIN_EXPORT_PRESETS: [
    {
      id: "zendesk-app",
      name: "Zendesk App",
      description: "Standard Zendesk app icons",
      variants: [
        { filename: "logo.png", width: 1024, height: 1024, format: "png" },
      ],
      isBuiltIn: true,
    },
    {
      id: "pwa",
      name: "PWA Icons",
      description: "Progressive Web App icons",
      variants: [
        { filename: "icon-192.png", width: 192, height: 192, format: "png" },
      ],
      isBuiltIn: true,
    },
  ],
}));

describe("useExportPresetManager", () => {
  const createDefaultConfig = (): RestrictionConfig => ({
    version: 1,
    styles: [
      {
        name: "Default Style",
        backgroundColor: "#063940",
        iconColor: "#ffffff",
      },
    ],
  });

  let config: RestrictionConfig;
  let setConfig: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    config = createDefaultConfig();
    setConfig = vi.fn((newConfig: RestrictionConfig) => {
      config = newConfig;
    });
  });

  describe("initial state", () => {
    it("has editor closed initially", () => {
      const { result } = renderHook(() =>
        useExportPresetManager(config, setConfig)
      );

      expect(result.current.showEditor).toBe(false);
      expect(result.current.editingPreset).toBeUndefined();
      expect(result.current.editingPresetIndex).toBeNull();
    });

    it("has no custom presets initially", () => {
      const { result } = renderHook(() =>
        useExportPresetManager(config, setConfig)
      );

      expect(result.current.customPresets).toHaveLength(0);
    });
  });

  describe("toggleBuiltInPreset", () => {
    it("adds a built-in preset when not present", () => {
      const { result } = renderHook(() =>
        useExportPresetManager(config, setConfig)
      );

      act(() => {
        result.current.toggleBuiltInPreset("zendesk-app");
      });

      expect(setConfig).toHaveBeenCalled();
      const newConfig = setConfig.mock.calls[0][0];
      expect(newConfig.allowedExportPresets).toHaveLength(1);
      expect(newConfig.allowedExportPresets[0].id).toBe("zendesk-app");
    });

    it("removes a built-in preset when already present", () => {
      config.allowedExportPresets = [
        { id: "zendesk-app", name: "Zendesk App" },
      ];

      const { result } = renderHook(() =>
        useExportPresetManager(config, setConfig)
      );

      act(() => {
        result.current.toggleBuiltInPreset("zendesk-app");
      });

      expect(setConfig).toHaveBeenCalled();
      const newConfig = setConfig.mock.calls[0][0];
      expect(newConfig.allowedExportPresets).toBeUndefined();
    });
  });

  describe("toggleAllPresets", () => {
    it("selects all presets when none are selected", () => {
      const { result } = renderHook(() =>
        useExportPresetManager(config, setConfig)
      );

      act(() => {
        result.current.toggleAllPresets();
      });

      expect(setConfig).toHaveBeenCalled();
      const newConfig = setConfig.mock.calls[0][0];
      expect(newConfig.allowedExportPresets).toHaveLength(2);
    });

    it("deselects all presets when all are selected", () => {
      config.allowedExportPresets = [
        { id: "zendesk-app", name: "Zendesk App" },
        { id: "pwa", name: "PWA Icons" },
      ];

      const { result } = renderHook(() =>
        useExportPresetManager(config, setConfig)
      );

      act(() => {
        result.current.toggleAllPresets();
      });

      expect(setConfig).toHaveBeenCalled();
      const newConfig = setConfig.mock.calls[0][0];
      expect(newConfig.allowedExportPresets).toBeUndefined();
    });
  });

  describe("custom preset operations", () => {
    it("createCustomPreset opens editor in create mode", () => {
      const { result } = renderHook(() =>
        useExportPresetManager(config, setConfig)
      );

      act(() => {
        result.current.createCustomPreset();
      });

      expect(result.current.showEditor).toBe(true);
      expect(result.current.editingPreset).toBeUndefined();
      expect(result.current.editingPresetIndex).toBeNull();
    });

    it("editCustomPreset opens editor with preset", () => {
      config.allowedExportPresets = [
        {
          id: "custom-1",
          name: "Custom Preset",
          variants: [
            { filename: "test.png", width: 100, height: 100, format: "png" },
          ],
        },
      ];

      const { result } = renderHook(() =>
        useExportPresetManager(config, setConfig)
      );

      act(() => {
        result.current.editCustomPreset(config.allowedExportPresets![0], 0);
      });

      expect(result.current.showEditor).toBe(true);
      expect(result.current.editingPreset).toBeDefined();
      expect(result.current.editingPresetIndex).toBe(0);
    });

    it("saveCustomPreset creates new preset", () => {
      const { result } = renderHook(() =>
        useExportPresetManager(config, setConfig)
      );

      act(() => {
        result.current.createCustomPreset();
      });

      act(() => {
        result.current.saveCustomPreset({
          name: "New Custom",
          description: "Test description",
          variants: [
            { filename: "test.png", width: 100, height: 100, format: "png" },
          ],
        });
      });

      expect(setConfig).toHaveBeenCalled();
      const newConfig = setConfig.mock.calls[0][0];
      expect(newConfig.allowedExportPresets).toHaveLength(1);
      expect(newConfig.allowedExportPresets[0].name).toBe("New Custom");
      expect(result.current.showEditor).toBe(false);
    });

    it("deleteCustomPreset removes a preset", () => {
      config.allowedExportPresets = [
        { id: "custom-1", name: "Custom 1", variants: [] },
        { id: "custom-2", name: "Custom 2", variants: [] },
      ];

      const { result } = renderHook(() =>
        useExportPresetManager(config, setConfig)
      );

      act(() => {
        result.current.deleteCustomPreset(0);
      });

      expect(setConfig).toHaveBeenCalled();
      const newConfig = setConfig.mock.calls[0][0];
      expect(newConfig.allowedExportPresets).toHaveLength(1);
      expect(newConfig.allowedExportPresets[0].id).toBe("custom-2");
    });
  });

  describe("customPresets computed property", () => {
    it("filters to only presets with variants", () => {
      config.allowedExportPresets = [
        { id: "builtin-ref", name: "Built-in Ref" }, // No variants = built-in reference
        {
          id: "custom-1",
          name: "Custom",
          variants: [
            { filename: "test.png", width: 100, height: 100, format: "png" },
          ],
        },
      ];

      const { result } = renderHook(() =>
        useExportPresetManager(config, setConfig)
      );

      expect(result.current.customPresets).toHaveLength(1);
      expect(result.current.customPresets[0].preset.id).toBe("custom-1");
      expect(result.current.customPresets[0].index).toBe(1);
    });
  });
});
