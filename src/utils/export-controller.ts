/**
 * Export controller for packaging assets into ZIP
 */

import JSZip from "jszip";
import type { IconGeneratorState } from "../hooks/use-icon-generator";
import type { AppLocation } from "../types/app-location";
import type { CanvasEditorState } from "../types/canvas";
import type { ExportMetadata } from "../types/export";
import { getRequiredExportVariants } from "../types/export";
import { generateExportAssets, renderPngFromImage } from "./renderer";
import { generateCanvasExportAssets } from "./canvas-export";
import { getIconById } from "./icon-catalog";
import { isSolidColor, isGradient } from "./gradients";
import { isCustomImageIcon, hasSvgRequirements } from "./locations";
import { ICON_PACKS } from "../constants/app";

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
  selectedLocations: AppLocation[],
  canvasState?: CanvasEditorState
): Promise<ExportResult> {
  const isCanvasMode = state.selectedPack === ICON_PACKS.CANVAS;

  // Canvas mode export
  if (isCanvasMode && canvasState) {
    return generateCanvasExportZip(state, canvasState);
  }

  if (!state.selectedIconId) {
    throw new Error("No icon selected");
  }

  const isCustomImage = isCustomImageIcon(state.selectedIconId);

  // Get required export variants
  let variants = getRequiredExportVariants(selectedLocations);

  // For custom images, filter out SVG variants (they can only export PNG)
  if (isCustomImage) {
    variants = variants.filter((v) => v.format === "png");
  }

  // Create ZIP
  const zip = new JSZip();
  const filenames: string[] = [];

  if (isCustomImage) {
    // Custom image export - use renderPngFromImage directly
    const imageDataUrl =
      typeof window !== "undefined"
        ? sessionStorage.getItem(state.selectedIconId)
        : null;

    if (!imageDataUrl) {
      throw new Error("Custom image data not found");
    }

    for (const variant of variants) {
      const blob = await renderPngFromImage({
        imageDataUrl,
        backgroundColor: state.backgroundColor,
        size: state.iconSize,
        width: variant.width,
        height: variant.height,
      });
      zip.file(variant.filename, blob);
      filenames.push(variant.filename);
    }

    // Create metadata for custom image
    const metadata: ExportMetadata = {
      exportedAt: new Date().toISOString(),
      iconId: state.selectedIconId,
      iconName: "Custom Image",
      customization: {
        backgroundColor: state.backgroundColor,
        iconColor: state.iconColor,
        iconSize: state.iconSize,
      },
      locations: selectedLocations,
      variants: filenames,
    };

    // Add metadata as JSON
    zip.file("export-metadata.json", JSON.stringify(metadata, null, 2));

    // Generate ZIP blob
    const zipBlob = await zip.generateAsync({ type: "blob" });

    return {
      zipBlob,
      metadata,
      filenames,
    };
  }

  // Standard icon export
  const icon = await getIconById(state.selectedIconId);
  if (!icon) {
    throw new Error(`Icon not found: ${state.selectedIconId}`);
  }

  // Generate all assets
  const assets = await generateExportAssets(icon, state, variants);

  // Add all assets to ZIP
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
 * Generate export ZIP for canvas mode
 */
async function generateCanvasExportZip(
  state: IconGeneratorState,
  canvasState: CanvasEditorState
): Promise<ExportResult> {
  if (canvasState.layers.length === 0) {
    throw new Error("No layers in canvas");
  }

  // Canvas mode only exports PNG files (logo.png and logo-small.png)
  const variants = [
    { filename: "logo.png", width: 1024, height: 1024, format: "png" as const },
    {
      filename: "logo-small.png",
      width: 512,
      height: 512,
      format: "png" as const,
    },
  ];

  // Create ZIP
  const zip = new JSZip();
  const filenames: string[] = [];

  // Generate canvas assets
  const assets = await generateCanvasExportAssets(canvasState, variants);

  // Add all assets to ZIP
  for (const [filename, blob] of assets.entries()) {
    zip.file(filename, blob);
    filenames.push(filename);
  }

  // Create metadata
  const metadata: ExportMetadata = {
    exportedAt: new Date().toISOString(),
    iconId: "canvas",
    iconName: "Canvas Composition",
    customization: {
      backgroundColor: state.backgroundColor,
      iconColor: state.iconColor,
      iconSize: state.iconSize,
    },
    locations: [],
    variants: filenames,
  };

  // Add metadata as JSON
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
export function downloadZip(
  blob: Blob,
  filename: string = "zendesk-icons.zip"
): void {
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

  const isCustomImage = isCustomImageIcon(state.selectedIconId);

  // Check location selection
  if (selectedLocations.length === 0) {
    warnings.push(
      "No app locations selected - only default PNGs will be exported"
    );
  }

  // Check for custom image with SVG locations (should be prevented by UI, but double-check)
  if (isCustomImage && hasSvgRequirements(selectedLocations)) {
    warnings.push(
      "Custom images cannot be exported as SVG. SVG locations will be skipped."
    );
  }

  // Check custom image info
  if (isCustomImage) {
    warnings.push(
      "Custom image will be exported as PNG only (logo.png and logo-small.png)"
    );
  }

  // Check color contrast (basic validation) - skip for custom images
  if (!isCustomImage) {
    // For gradients, use the first stop color for contrast check
    const bgColor = isSolidColor(state.backgroundColor)
      ? state.backgroundColor
      : isGradient(state.backgroundColor)
        ? state.backgroundColor.stops[0]?.color || "#000000"
        : "#000000";
    const bgLuminance = getLuminance(bgColor);
    const iconLuminance = getLuminance(state.iconColor);
    const contrast = Math.abs(bgLuminance - iconLuminance);
    if (contrast < 0.3) {
      warnings.push(
        "Low contrast between background and icon colors - may affect legibility"
      );
    }
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
