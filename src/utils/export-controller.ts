/**
 * Export controller for packaging assets into ZIP
 */

import JSZip from "jszip";
import type { IconMetadata } from "../types/icon";
import type { IconGeneratorState } from "../hooks/use-icon-generator";
import type { AppLocation } from "../types/app-location";
import type { ExportMetadata, ExportVariant } from "../types/export";
import { getRequiredExportVariants } from "../types/export";
import { generateExportAssets } from "./renderer";
import { getIconById } from "./icon-catalog";

/**
 * Export result
 */
export interface ExportResult {
  /** ZIP blob */
  zipBlob: Blob;
  /** Export metadata */
  metadata: ExportMetadata;
  /** List of exported filenames */
  filenames: string[];
}

/**
 * Generate export ZIP from current state
 */
export async function generateExportZip(
  state: IconGeneratorState,
  selectedLocations: AppLocation[]
): Promise<ExportResult> {
  if (!state.selectedIconId) {
    throw new Error("No icon selected");
  }

  // Get icon metadata
  const icon = await getIconById(state.selectedIconId);
  if (!icon) {
    throw new Error(`Icon not found: ${state.selectedIconId}`);
  }

  // Get required export variants
  const variants = getRequiredExportVariants(selectedLocations);

  // Generate all assets
  const assets = await generateExportAssets(icon, state, variants);

  // Create ZIP
  const zip = new JSZip();

  // Add all assets to ZIP
  const filenames: string[] = [];
  for (const [filename, blob] of assets.entries()) {
    zip.file(filename, blob);
    filenames.push(filename);
  }

  // Create metadata
  const metadata: ExportMetadata = {
    exportedAt: new Date().toISOString(),
    iconId: icon.id,
    iconName: icon.name,
    customization: {
      backgroundColor: state.backgroundColor,
      iconColor: state.iconColor,
      iconSize: state.iconSize,
    },
    locations: selectedLocations,
    variants: filenames,
  };

  // Add metadata as JSON (optional, for debugging)
  zip.file("export-metadata.json", JSON.stringify(metadata, null, 2));

  // Generate ZIP blob
  const zipBlob = await zip.generateAsync({ type: "blob" });

  return {
    zipBlob,
    metadata,
    filenames,
  };
}

/**
 * Download ZIP file
 */
export function downloadZip(blob: Blob, filename: string = "zendesk-icons.zip"): void {
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
 * Validate export readiness
 */
export interface ExportValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateExport(
  state: IconGeneratorState,
  selectedLocations: AppLocation[]
): ExportValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check icon selection
  if (!state.selectedIconId) {
    errors.push("No icon selected");
  }

  // Check location selection
  if (selectedLocations.length === 0) {
    warnings.push("No app locations selected - only default PNGs will be exported");
  }

  // Check color contrast (basic validation)
  const bgLuminance = getLuminance(state.backgroundColor);
  const iconLuminance = getLuminance(state.iconColor);
  const contrast = Math.abs(bgLuminance - iconLuminance);
  if (contrast < 0.3) {
    warnings.push("Low contrast between background and icon colors - may affect legibility");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculate relative luminance for contrast checking
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

