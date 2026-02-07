import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  parseBatchCsv,
  generateExampleCsv,
  generateOptionsCsv,
  exportConfigsToCsv,
} from "../batch-csv";
import type { UploadedAsset, BatchIconConfig } from "@/src/types/batch";

// Mock preset storage
vi.mock("../preset-storage", () => ({
  getAllStylePresets: () => [
    {
      id: "zendesk-kale",
      name: "Zendesk Kale",
      backgroundColor: "#063940",
      iconColor: "#ffffff",
      isBuiltIn: true,
    },
    {
      id: "dark-mode",
      name: "Dark Mode",
      backgroundColor: "#1a1a1a",
      iconColor: "#ffffff",
      isBuiltIn: true,
    },
  ],
  getAllExportPresets: () => [
    {
      id: "zendesk-app",
      name: "Zendesk App",
      description: "Icon bundle for Zendesk apps",
      variants: [],
      isBuiltIn: true,
    },
    {
      id: "raycast-extension",
      name: "Raycast Extension",
      description: "Icon for Raycast",
      variants: [],
      isBuiltIn: true,
    },
  ],
}));

vi.mock("../builtin-presets", () => ({
  DEFAULT_STYLE_PRESET_ID: "zendesk-kale",
}));

describe("batch-csv", () => {
  describe("parseBatchCsv", () => {
    const emptyAssets: UploadedAsset[] = [];

    it("should parse valid CSV with all columns", () => {
      const csv = `project,format_preset,source,icon_name,style,icon_size
my-app,zendesk-app,feather,home,zendesk-kale,80
settings,raycast-extension,remixicon,settings-line,dark-mode,75`;

      const result = parseBatchCsv(csv, emptyAssets);

      expect(result.success).toBe(true);
      expect(result.configs).toHaveLength(2);
      expect(result.errors).toHaveLength(0);

      expect(result.configs[0]).toMatchObject({
        projectName: "my-app",
        formatPresetId: "zendesk-app",
        source: "feather",
        iconName: "home",
        stylePresetId: "zendesk-kale",
        iconSize: 80,
      });

      expect(result.configs[1]).toMatchObject({
        projectName: "settings",
        formatPresetId: "raycast-extension",
        source: "remixicon",
        iconName: "settings-line",
        stylePresetId: "dark-mode",
        iconSize: 75,
      });
    });

    it("should parse CSV with optional format_preset empty", () => {
      const csv = `project,format_preset,source,icon_name,style,icon_size
my-app,,feather,home,zendesk-kale,80`;

      const result = parseBatchCsv(csv, emptyAssets);

      expect(result.success).toBe(true);
      expect(result.configs).toHaveLength(1);
      expect(result.configs[0].formatPresetId).toBeUndefined();
    });

    it("should use default icon_size when not provided", () => {
      const csv = `project,format_preset,source,icon_name,style,icon_size
my-app,,feather,home,zendesk-kale,`;

      const result = parseBatchCsv(csv, emptyAssets);

      expect(result.success).toBe(true);
      expect(result.configs[0].iconSize).toBe(80);
    });

    it("should return error for missing required column", () => {
      const csv = `project,source,icon_name
my-app,feather,home`;

      const result = parseBatchCsv(csv, emptyAssets);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain("style");
    });

    it("should return error for invalid source", () => {
      const csv = `project,format_preset,source,icon_name,style,icon_size
my-app,,invalid-source,home,zendesk-kale,80`;

      const result = parseBatchCsv(csv, emptyAssets);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].column).toBe("source");
      expect(result.errors[0].message).toContain("Invalid source");
    });

    it("should return error for invalid style preset", () => {
      const csv = `project,format_preset,source,icon_name,style,icon_size
my-app,,feather,home,nonexistent-style,80`;

      const result = parseBatchCsv(csv, emptyAssets);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].column).toBe("style");
    });

    it("should return error for invalid format preset", () => {
      const csv = `project,format_preset,source,icon_name,style,icon_size
my-app,nonexistent-preset,feather,home,zendesk-kale,80`;

      const result = parseBatchCsv(csv, emptyAssets);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].column).toBe("format_preset");
    });

    it("should validate upload source against uploaded assets", () => {
      const csv = `project,format_preset,source,icon_name,style,icon_size
my-app,,upload,missing-file.svg,zendesk-kale,80`;

      const result = parseBatchCsv(csv, emptyAssets);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].column).toBe("icon_name");
      expect(result.errors[0].message).toContain("not found");
    });

    it("should accept valid uploaded asset reference", () => {
      const assets: UploadedAsset[] = [
        {
          name: "my-logo",
          filename: "my-logo.svg",
          type: "svg",
          dataUrl: "data:...",
          iconId: "batch-upload-my-logo-123",
        },
      ];

      const csv = `project,format_preset,source,icon_name,style,icon_size
my-app,,upload,my-logo,zendesk-kale,80`;

      const result = parseBatchCsv(csv, assets);

      expect(result.success).toBe(true);
      expect(result.configs).toHaveLength(1);
      expect(result.configs[0].iconId).toBe("batch-upload-my-logo-123");
    });

    it("should skip empty rows", () => {
      const csv = `project,format_preset,source,icon_name,style,icon_size
my-app,,feather,home,zendesk-kale,80

settings,,feather,settings,zendesk-kale,80`;

      const result = parseBatchCsv(csv, emptyAssets);

      expect(result.success).toBe(true);
      expect(result.configs).toHaveLength(2);
    });

    it("should handle quoted fields with commas", () => {
      const csv = `project,format_preset,source,icon_name,style,icon_size
"my-app, test",,feather,home,zendesk-kale,80`;

      const result = parseBatchCsv(csv, emptyAssets);

      expect(result.success).toBe(true);
      expect(result.configs[0].projectName).toBe("my-app, test");
    });

    it("should return warning for invalid icon_size", () => {
      const csv = `project,format_preset,source,icon_name,style,icon_size
my-app,,feather,home,zendesk-kale,invalid`;

      const result = parseBatchCsv(csv, emptyAssets);

      expect(result.success).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.configs[0].iconSize).toBe(80); // default
    });

    it("should return error for empty CSV", () => {
      const csv = "";

      const result = parseBatchCsv(csv, emptyAssets);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // May report multiple missing column errors
    });
  });

  describe("generateExampleCsv", () => {
    it("should generate valid CSV with header and sample rows", () => {
      const csv = generateExampleCsv();
      const lines = csv.split("\n");

      expect(lines.length).toBeGreaterThan(1);
      expect(lines[0]).toBe(
        "project,format_preset,source,icon_name,style,icon_size"
      );
    });

    it("should include sample data", () => {
      const csv = generateExampleCsv();

      expect(csv).toContain("feather");
      expect(csv).toContain("zendesk-kale");
    });
  });

  describe("generateOptionsCsv", () => {
    it("should generate CSV with all option types", () => {
      const csv = generateOptionsCsv();

      expect(csv).toContain("option_type,option_id,option_name,description");
      expect(csv).toContain("format_preset");
      expect(csv).toContain("source");
      expect(csv).toContain("style");
    });

    it("should include format presets", () => {
      const csv = generateOptionsCsv();

      expect(csv).toContain("zendesk-app");
      expect(csv).toContain("raycast-extension");
    });

    it("should include all sources", () => {
      const csv = generateOptionsCsv();

      expect(csv).toContain("zendesk-garden");
      expect(csv).toContain("feather");
      expect(csv).toContain("remixicon");
      expect(csv).toContain("emoji");
      expect(csv).toContain("upload");
    });

    it("should include style presets", () => {
      const csv = generateOptionsCsv();

      expect(csv).toContain("zendesk-kale");
      expect(csv).toContain("dark-mode");
    });
  });

  describe("exportConfigsToCsv", () => {
    it("should export configs to valid CSV", () => {
      const configs: BatchIconConfig[] = [
        {
          id: "1",
          projectName: "my-app",
          source: "feather",
          iconName: "home",
          stylePresetId: "zendesk-kale",
          formatPresetId: "zendesk-app",
          iconSize: 80,
        },
        {
          id: "2",
          projectName: "settings",
          source: "remixicon",
          iconName: "settings-line",
          stylePresetId: "dark-mode",
          iconSize: 75,
        },
      ];

      const csv = exportConfigsToCsv(configs);
      const lines = csv.split("\n");

      expect(lines).toHaveLength(3); // header + 2 rows
      expect(lines[0]).toBe(
        "project,format_preset,source,icon_name,style,icon_size"
      );
      expect(lines[1]).toBe("my-app,zendesk-app,feather,home,zendesk-kale,80");
      expect(lines[2]).toBe("settings,,remixicon,settings-line,dark-mode,75");
    });
  });
});
