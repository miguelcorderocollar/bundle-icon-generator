/**
 * CSV utilities for batch generator
 * Handles parsing, validation, and generation of CSV files
 */

import type {
  BatchIconConfig,
  BatchIconSource,
  CsvParseResult,
  CsvParseError,
  CsvOptionEntry,
  UploadedAsset,
} from "@/src/types/batch";
import { BATCH_ICON_SOURCES, isBatchIconSource } from "@/src/types/batch";
import { getAllStylePresets, getAllExportPresets } from "./preset-storage";
import { DEFAULT_STYLE_PRESET_ID } from "./builtin-presets";

/**
 * Generate a unique ID for batch items
 */
function generateId(): string {
  return `batch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Parse a CSV string into rows and columns
 */
function parseRawCsv(csvContent: string): string[][] {
  const lines = csvContent.trim().split(/\r?\n/);
  return lines.map((line) => {
    // Handle quoted fields with commas
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
}

/**
 * Validate and parse a CSV file for batch import
 */
export function parseBatchCsv(
  csvContent: string,
  uploadedAssets: UploadedAsset[],
  validateIconExists?: (source: BatchIconSource, iconName: string) => boolean
): CsvParseResult {
  const errors: CsvParseError[] = [];
  const warnings: string[] = [];
  const configs: BatchIconConfig[] = [];

  const rows = parseRawCsv(csvContent);

  if (rows.length === 0) {
    errors.push({ row: 0, column: "general", message: "CSV file is empty" });
    return { success: false, configs: [], errors, warnings };
  }

  // Validate header row
  const header = rows[0].map((h) => h.toLowerCase().trim());
  const requiredColumns = ["project", "source", "icon_name", "style"];
  const allColumns = [
    "project",
    "format_preset",
    "source",
    "icon_name",
    "style",
    "icon_size",
  ];

  // Check for required columns
  for (const col of requiredColumns) {
    if (!header.includes(col)) {
      errors.push({
        row: 1,
        column: "general",
        message: `Missing required column: ${col}`,
      });
    }
  }

  if (errors.length > 0) {
    return { success: false, configs: [], errors, warnings };
  }

  // Map column indices
  const columnIndices: Record<string, number> = {};
  for (const col of allColumns) {
    const index = header.indexOf(col);
    if (index !== -1) {
      columnIndices[col] = index;
    }
  }

  // Get valid style presets
  const stylePresets = getAllStylePresets();
  const validStyleIds = new Set(stylePresets.map((p) => p.id));

  // Get valid export presets
  const exportPresets = getAllExportPresets();
  const validExportPresetIds = new Set(exportPresets.map((p) => p.id));

  // Create lookup for uploaded assets
  const uploadedAssetNames = new Set(uploadedAssets.map((a) => a.name));
  const uploadedAssetFilenames = new Set(uploadedAssets.map((a) => a.filename));

  // Parse data rows
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1; // 1-based for user display

    // Skip empty rows
    if (row.every((cell) => cell.trim() === "")) {
      continue;
    }

    const getValue = (col: string): string => {
      const index = columnIndices[col];
      return index !== undefined ? (row[index] || "").trim() : "";
    };

    // Parse and validate each field
    const project = getValue("project");
    const formatPreset = getValue("format_preset");
    const source = getValue("source");
    const iconName = getValue("icon_name");
    const style = getValue("style");
    const iconSizeStr = getValue("icon_size");

    let hasError = false;

    // Validate project name
    if (!project) {
      errors.push({
        row: rowNum,
        column: "project",
        message: "Project name is required",
      });
      hasError = true;
    }

    // Validate source
    if (!source) {
      errors.push({
        row: rowNum,
        column: "source",
        message: "Source is required",
      });
      hasError = true;
    } else if (!isBatchIconSource(source)) {
      errors.push({
        row: rowNum,
        column: "source",
        message: `Invalid source: "${source}". Valid options: ${BATCH_ICON_SOURCES.join(", ")}`,
      });
      hasError = true;
    }

    // Validate icon_name
    if (!iconName) {
      errors.push({
        row: rowNum,
        column: "icon_name",
        message: "Icon name is required",
      });
      hasError = true;
    } else if (source === "upload") {
      // For uploads, check if the asset exists
      if (
        !uploadedAssetNames.has(iconName) &&
        !uploadedAssetFilenames.has(iconName)
      ) {
        errors.push({
          row: rowNum,
          column: "icon_name",
          message: `Uploaded asset not found: "${iconName}". Upload it first.`,
        });
        hasError = true;
      }
    } else if (validateIconExists && isBatchIconSource(source)) {
      // For catalog icons, optionally validate they exist
      if (!validateIconExists(source, iconName)) {
        warnings.push(
          `Row ${rowNum}: Icon "${iconName}" may not exist in ${source}`
        );
      }
    }

    // Validate style
    if (!style) {
      errors.push({
        row: rowNum,
        column: "style",
        message: "Style preset is required",
      });
      hasError = true;
    } else if (!validStyleIds.has(style)) {
      errors.push({
        row: rowNum,
        column: "style",
        message: `Invalid style preset: "${style}"`,
      });
      hasError = true;
    }

    // Validate format_preset (optional)
    if (formatPreset && !validExportPresetIds.has(formatPreset)) {
      errors.push({
        row: rowNum,
        column: "format_preset",
        message: `Invalid format preset: "${formatPreset}"`,
      });
      hasError = true;
    }

    // Parse icon_size (optional)
    let iconSize = 80; // default
    if (iconSizeStr) {
      const parsed = parseInt(iconSizeStr, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 100) {
        warnings.push(
          `Row ${rowNum}: Invalid icon_size "${iconSizeStr}", using default 80`
        );
      } else {
        iconSize = parsed;
      }
    }

    // Skip this row if it has errors
    if (hasError) {
      continue;
    }

    // Find the uploaded asset if source is upload
    let iconId: string | undefined;
    if (source === "upload") {
      const asset =
        uploadedAssets.find((a) => a.name === iconName) ||
        uploadedAssets.find((a) => a.filename === iconName);
      iconId = asset?.iconId;
    }

    // Create config
    const config: BatchIconConfig = {
      id: generateId(),
      projectName: project,
      source: source as BatchIconSource,
      iconName,
      iconId,
      stylePresetId: style,
      formatPresetId: formatPreset || undefined,
      iconSize,
    };

    configs.push(config);
  }

  return {
    success: errors.length === 0,
    configs,
    errors,
    warnings,
  };
}

/**
 * Generate example CSV content for download
 */
export function generateExampleCsv(): string {
  const lines = [
    "project,format_preset,source,icon_name,style,icon_size",
    "my-first-app,,feather,home,zendesk-kale,80",
    "settings-app,zendesk-app,zendesk-garden,gear-fill-12,dark-mode,75",
    "dashboard,raycast-extension,remixicon,dashboard-3-line,ocean-blue,85",
    "custom-app,,upload,my-logo.svg,zendesk-kale,90",
  ];
  return lines.join("\n");
}

/**
 * Generate options CSV listing all valid values
 */
export function generateOptionsCsv(): string {
  const entries: CsvOptionEntry[] = [];

  // Add format presets
  const exportPresets = getAllExportPresets();
  for (const preset of exportPresets) {
    entries.push({
      optionType: "format_preset",
      optionId: preset.id,
      optionName: preset.name,
      description: preset.description || "",
    });
  }

  // Add sources
  const sourceDescriptions: Record<BatchIconSource, string> = {
    "zendesk-garden": "Zendesk Garden official icon library",
    feather: "Feather Icons - open source icon set",
    remixicon: "RemixIcon - Remix Design icon set",
    emoji: "Emoji icons",
    upload: "Custom uploaded images/SVGs",
  };

  for (const source of BATCH_ICON_SOURCES) {
    entries.push({
      optionType: "source",
      optionId: source,
      optionName: source,
      description: sourceDescriptions[source],
    });
  }

  // Add style presets
  const stylePresets = getAllStylePresets();
  for (const preset of stylePresets) {
    entries.push({
      optionType: "style",
      optionId: preset.id,
      optionName: preset.name,
      description: preset.isBuiltIn ? "Built-in preset" : "Custom preset",
    });
  }

  // Generate CSV
  const lines = ["option_type,option_id,option_name,description"];
  for (const entry of entries) {
    // Escape quotes in description
    const desc = entry.description.replace(/"/g, '""');
    lines.push(
      `${entry.optionType},${entry.optionId},"${entry.optionName}","${desc}"`
    );
  }

  return lines.join("\n");
}

/**
 * Export configs to CSV format
 */
export function exportConfigsToCsv(configs: BatchIconConfig[]): string {
  const lines = ["project,format_preset,source,icon_name,style,icon_size"];

  for (const config of configs) {
    lines.push(
      [
        config.projectName,
        config.formatPresetId || "",
        config.source,
        config.iconName,
        config.stylePresetId,
        config.iconSize.toString(),
      ].join(",")
    );
  }

  return lines.join("\n");
}

/**
 * Download a string as a file
 */
export function downloadCsvFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get default style preset ID
 */
export function getDefaultStylePresetId(): string {
  return DEFAULT_STYLE_PRESET_ID;
}
