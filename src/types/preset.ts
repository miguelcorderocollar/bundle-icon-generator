/**
 * Preset type definitions for export and style presets
 */

import type { BackgroundValue } from "@/src/utils/gradients";

/**
 * Supported export formats
 */
export type ExportFormat = "png" | "jpeg" | "webp" | "svg" | "ico";

/**
 * Single export variant configuration
 */
export interface ExportVariantConfig {
  /** Filename pattern - can use {size} placeholder */
  filename: string;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Output format */
  format: ExportFormat;
  /** Quality for JPEG/WebP (0-100), optional for PNG/SVG */
  quality?: number;
  /** Description of this variant's purpose */
  description?: string;
}

/**
 * Export preset - a collection of export variants for a specific platform
 */
export interface ExportPreset {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description of the preset's purpose */
  description: string;
  /** Array of export variants */
  variants: ExportVariantConfig[];
  /** Whether this is a built-in preset (cannot be deleted) */
  isBuiltIn: boolean;
  /** Creation timestamp (ISO string) */
  createdAt?: string;
  /** Last update timestamp (ISO string) */
  updatedAt?: string;
}

/**
 * Named color entry in a palette for brand colors
 */
export interface ColorPaletteEntry {
  /** Unique identifier for the color */
  id: string;
  /** Display name (e.g., "Primary", "Secondary") */
  name: string;
  /** Hex color value */
  color: string;
}

/**
 * Style preset - background and icon color combination
 */
export interface StylePreset {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Background color or gradient */
  backgroundColor: BackgroundValue;
  /** Icon/foreground color */
  iconColor: string;
  /** Whether this is a built-in preset (cannot be deleted) */
  isBuiltIn: boolean;
  /** Optional color palette for easy brand color access */
  colorPalette?: ColorPaletteEntry[];
  /** Creation timestamp (ISO string) */
  createdAt?: string;
  /** Last update timestamp (ISO string) */
  updatedAt?: string;
}

/**
 * Import/export data structure for presets
 */
export interface PresetExportData {
  /** Schema version for future migrations */
  version: number;
  /** Custom export presets */
  exportPresets: ExportPreset[];
  /** Custom style presets */
  stylePresets: StylePreset[];
  /** Export timestamp */
  exportedAt: string;
}

/**
 * Result of importing presets
 */
export interface PresetImportResult {
  /** Whether the import was successful */
  success: boolean;
  /** Number of export presets imported */
  exportPresetsImported: number;
  /** Number of style presets imported */
  stylePresetsImported: number;
  /** Error message if import failed */
  error?: string;
  /** Warnings (e.g., duplicates skipped) */
  warnings?: string[];
}

/**
 * Type guard for ExportPreset
 */
export function isExportPreset(value: unknown): value is ExportPreset {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value &&
    "variants" in value &&
    Array.isArray((value as ExportPreset).variants)
  );
}

/**
 * Type guard for ColorPaletteEntry
 */
export function isColorPaletteEntry(
  value: unknown
): value is ColorPaletteEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as ColorPaletteEntry).id === "string" &&
    "name" in value &&
    typeof (value as ColorPaletteEntry).name === "string" &&
    "color" in value &&
    typeof (value as ColorPaletteEntry).color === "string"
  );
}

/**
 * Type guard for StylePreset
 */
export function isStylePreset(value: unknown): value is StylePreset {
  if (
    typeof value !== "object" ||
    value === null ||
    !("id" in value) ||
    !("name" in value) ||
    !("backgroundColor" in value) ||
    !("iconColor" in value)
  ) {
    return false;
  }

  // Validate colorPalette if present
  const preset = value as StylePreset;
  if (preset.colorPalette !== undefined) {
    if (!Array.isArray(preset.colorPalette)) {
      return false;
    }
    // Validate each entry in the palette
    for (const entry of preset.colorPalette) {
      if (!isColorPaletteEntry(entry)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Type guard for ExportVariantConfig
 */
export function isExportVariantConfig(
  value: unknown
): value is ExportVariantConfig {
  return (
    typeof value === "object" &&
    value !== null &&
    "filename" in value &&
    "width" in value &&
    "height" in value &&
    "format" in value
  );
}

/**
 * Type guard for PresetExportData
 */
export function isPresetExportData(value: unknown): value is PresetExportData {
  return (
    typeof value === "object" &&
    value !== null &&
    "version" in value &&
    "exportPresets" in value &&
    "stylePresets" in value &&
    Array.isArray((value as PresetExportData).exportPresets) &&
    Array.isArray((value as PresetExportData).stylePresets)
  );
}

/**
 * Valid export formats list
 */
export const EXPORT_FORMATS: ExportFormat[] = [
  "png",
  "jpeg",
  "webp",
  "svg",
  "ico",
];

/**
 * Check if a format supports quality setting
 */
export function formatSupportsQuality(format: ExportFormat): boolean {
  return format === "jpeg" || format === "webp";
}

/**
 * Check if a format supports transparency
 */
export function formatSupportsTransparency(format: ExportFormat): boolean {
  return format === "png" || format === "webp" || format === "svg";
}

/**
 * Get MIME type for export format
 */
export function getFormatMimeType(format: ExportFormat): string {
  switch (format) {
    case "png":
      return "image/png";
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    case "ico":
      return "image/x-icon";
  }
}

/**
 * Get file extension for export format
 */
export function getFormatExtension(format: ExportFormat): string {
  switch (format) {
    case "jpeg":
      return "jpg";
    default:
      return format;
  }
}
