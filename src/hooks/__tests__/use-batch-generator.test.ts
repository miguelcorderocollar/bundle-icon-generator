import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBatchGenerator, sanitizeProjectName } from "../use-batch-generator";

// Mock preset storage
vi.mock("@/src/utils/preset-storage", () => ({
  getStylePreset: (id: string) => {
    if (id === "zendesk-kale") {
      return {
        id: "zendesk-kale",
        name: "Zendesk Kale",
        backgroundColor: "#063940",
        iconColor: "#ffffff",
        isBuiltIn: true,
      };
    }
    return undefined;
  },
}));

vi.mock("@/src/utils/builtin-presets", () => ({
  DEFAULT_STYLE_PRESET_ID: "zendesk-kale",
}));

describe("use-batch-generator", () => {
  beforeEach(() => {
    // Clear localStorage and sessionStorage before each test
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("sanitizeProjectName", () => {
    it("should lowercase the name", () => {
      expect(sanitizeProjectName("MyApp")).toBe("myapp");
    });

    it("should replace spaces with hyphens", () => {
      expect(sanitizeProjectName("my app")).toBe("my-app");
    });

    it("should replace special characters with hyphens", () => {
      expect(sanitizeProjectName("my@app#test")).toBe("my-app-test");
    });

    it("should collapse multiple hyphens", () => {
      expect(sanitizeProjectName("my--app")).toBe("my-app");
    });

    it("should remove leading and trailing hyphens", () => {
      expect(sanitizeProjectName("-myapp-")).toBe("myapp");
    });

    it("should truncate to 50 characters", () => {
      const longName = "a".repeat(100);
      expect(sanitizeProjectName(longName)).toHaveLength(50);
    });
  });

  describe("useBatchGenerator hook", () => {
    it("should initialize with default state", async () => {
      const { result } = renderHook(() => useBatchGenerator());

      // Wait for initialization
      await vi.waitFor(() => {
        expect(result.current.hasInitialized).toBe(true);
      });

      expect(result.current.state.configs).toEqual([]);
      expect(result.current.state.uploadedAssets).toEqual([]);
      expect(result.current.state.globalFormatPresetId).toBe("zendesk-app");
    });

    it("should add a config", async () => {
      const { result } = renderHook(() => useBatchGenerator());

      await vi.waitFor(() => {
        expect(result.current.hasInitialized).toBe(true);
      });

      act(() => {
        result.current.actions.addConfig({ projectName: "test-app" });
      });

      expect(result.current.state.configs).toHaveLength(1);
      expect(result.current.state.configs[0].projectName).toBe("test-app");
    });

    it("should update a config", async () => {
      const { result } = renderHook(() => useBatchGenerator());

      await vi.waitFor(() => {
        expect(result.current.hasInitialized).toBe(true);
      });

      let configId: string;
      act(() => {
        const config = result.current.actions.addConfig({
          projectName: "original",
        });
        configId = config.id;
      });

      act(() => {
        result.current.actions.updateConfig(configId, {
          projectName: "updated",
        });
      });

      expect(result.current.state.configs[0].projectName).toBe("updated");
    });

    it("should remove a config", async () => {
      const { result } = renderHook(() => useBatchGenerator());

      await vi.waitFor(() => {
        expect(result.current.hasInitialized).toBe(true);
      });

      let configId: string;
      act(() => {
        const config = result.current.actions.addConfig();
        configId = config.id;
      });

      expect(result.current.state.configs).toHaveLength(1);

      act(() => {
        result.current.actions.removeConfig(configId);
      });

      expect(result.current.state.configs).toHaveLength(0);
    });

    it("should clear all configs", async () => {
      const { result } = renderHook(() => useBatchGenerator());

      await vi.waitFor(() => {
        expect(result.current.hasInitialized).toBe(true);
      });

      act(() => {
        result.current.actions.addConfig();
        result.current.actions.addConfig();
        result.current.actions.addConfig();
      });

      expect(result.current.state.configs).toHaveLength(3);

      act(() => {
        result.current.actions.clearConfigs();
      });

      expect(result.current.state.configs).toHaveLength(0);
    });

    it("should add an uploaded asset", async () => {
      const { result } = renderHook(() => useBatchGenerator());

      await vi.waitFor(() => {
        expect(result.current.hasInitialized).toBe(true);
      });

      act(() => {
        result.current.actions.addUploadedAsset({
          name: "test-icon",
          filename: "test-icon.svg",
          type: "svg",
          dataUrl: "data:image/svg+xml,...",
          svgContent: "<svg>...</svg>",
        });
      });

      expect(result.current.state.uploadedAssets).toHaveLength(1);
      expect(result.current.state.uploadedAssets[0].name).toBe("test-icon");
      expect(result.current.state.uploadedAssets[0].iconId).toContain(
        "batch-upload-test-icon"
      );
    });

    it("should remove an uploaded asset", async () => {
      const { result } = renderHook(() => useBatchGenerator());

      await vi.waitFor(() => {
        expect(result.current.hasInitialized).toBe(true);
      });

      act(() => {
        result.current.actions.addUploadedAsset({
          name: "test-icon",
          filename: "test-icon.svg",
          type: "svg",
          dataUrl: "data:...",
        });
      });

      expect(result.current.state.uploadedAssets).toHaveLength(1);

      act(() => {
        result.current.actions.removeUploadedAsset("test-icon");
      });

      expect(result.current.state.uploadedAssets).toHaveLength(0);
    });

    it("should set global format preset", async () => {
      const { result } = renderHook(() => useBatchGenerator());

      await vi.waitFor(() => {
        expect(result.current.hasInitialized).toBe(true);
      });

      act(() => {
        result.current.actions.setGlobalFormatPresetId("raycast-extension");
      });

      expect(result.current.state.globalFormatPresetId).toBe(
        "raycast-extension"
      );
    });

    it("should import configs", async () => {
      const { result } = renderHook(() => useBatchGenerator());

      await vi.waitFor(() => {
        expect(result.current.hasInitialized).toBe(true);
      });

      act(() => {
        result.current.actions.importConfigs([
          {
            id: "temp-1",
            projectName: "app-1",
            source: "feather",
            iconName: "home",
            stylePresetId: "zendesk-kale",
            iconSize: 80,
          },
          {
            id: "temp-2",
            projectName: "app-2",
            source: "remixicon",
            iconName: "settings",
            stylePresetId: "zendesk-kale",
            iconSize: 75,
          },
        ]);
      });

      expect(result.current.state.configs).toHaveLength(2);
      // IDs should be regenerated
      expect(result.current.state.configs[0].id).not.toBe("temp-1");
      expect(result.current.state.configs[1].id).not.toBe("temp-2");
    });

    it("should resolve config colors from style preset", async () => {
      const { result } = renderHook(() => useBatchGenerator());

      await vi.waitFor(() => {
        expect(result.current.hasInitialized).toBe(true);
      });

      const resolvedConfig = result.current.actions.resolveConfigColors({
        id: "test",
        projectName: "test",
        source: "feather",
        iconName: "home",
        stylePresetId: "zendesk-kale",
        iconSize: 80,
      });

      expect(resolvedConfig.resolvedBackgroundColor).toBe("#063940");
      expect(resolvedConfig.resolvedIconColor).toBe("#ffffff");
    });

    it("should find uploaded asset by name", async () => {
      const { result } = renderHook(() => useBatchGenerator());

      await vi.waitFor(() => {
        expect(result.current.hasInitialized).toBe(true);
      });

      act(() => {
        result.current.actions.addUploadedAsset({
          name: "my-logo",
          filename: "my-logo.svg",
          type: "svg",
          dataUrl: "data:...",
        });
      });

      const asset = result.current.actions.getUploadedAssetByName("my-logo");
      expect(asset).toBeDefined();
      expect(asset?.name).toBe("my-logo");

      const assetByFilename =
        result.current.actions.getUploadedAssetByName("my-logo.svg");
      expect(assetByFilename).toBeDefined();
    });

    it("should clear all state", async () => {
      const { result } = renderHook(() => useBatchGenerator());

      await vi.waitFor(() => {
        expect(result.current.hasInitialized).toBe(true);
      });

      act(() => {
        result.current.actions.addConfig();
        result.current.actions.addUploadedAsset({
          name: "test",
          filename: "test.svg",
          type: "svg",
          dataUrl: "data:...",
        });
        result.current.actions.setGlobalFormatPresetId("custom-preset");
      });

      expect(result.current.state.configs).toHaveLength(1);
      expect(result.current.state.uploadedAssets).toHaveLength(1);

      act(() => {
        result.current.actions.clearAll();
      });

      expect(result.current.state.configs).toHaveLength(0);
      expect(result.current.state.uploadedAssets).toHaveLength(0);
      expect(result.current.state.globalFormatPresetId).toBe("zendesk-app");
    });
  });
});
