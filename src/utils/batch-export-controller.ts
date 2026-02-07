/**
 * Batch export controller for packaging multiple app icon bundles
 */

import JSZip from "jszip";
import type {
  BatchIconConfig,
  BatchManifest,
  BatchManifestProject,
  BatchValidationResult,
  BatchExportProgress,
  UploadedAsset,
} from "@/src/types/batch";
import type { IconGeneratorState } from "@/src/hooks/use-icon-generator";
import { ICON_PACKS, type IconPack } from "@/src/constants/app";
import type { ExportVariantConfig } from "@/src/types/preset";
import { generateExportAssets, type ExportVariantSpec } from "./renderer";
import { renderRasterFromImage } from "./renderer";
import { getIconById } from "./icon-catalog";
import { getStylePreset, getExportPreset } from "./preset-storage";
import { sanitizeProjectName } from "@/src/hooks/use-batch-generator";
import type { BatchIconSource } from "@/src/types/batch";

/**
 * Map BatchIconSource to IconPack
 */
function sourceToIconPack(source: BatchIconSource): IconPack {
  switch (source) {
    case "zendesk-garden":
      return ICON_PACKS.GARDEN;
    case "feather":
      return ICON_PACKS.FEATHER;
    case "remixicon":
      return ICON_PACKS.REMIXICON;
    case "emoji":
      return ICON_PACKS.EMOJI;
    case "upload":
      return ICON_PACKS.CUSTOM_IMAGE;
    default:
      return ICON_PACKS.ALL;
  }
}

/**
 * Batch export result
 */
export interface BatchExportResult {
  /** ZIP blob */
  zipBlob: Blob;
  /** Manifest data */
  manifest: BatchManifest;
  /** Number of projects exported */
  projectCount: number;
  /** Errors that occurred (non-fatal) */
  warnings: string[];
}

/**
 * Batch export options
 */
export interface BatchExportOptions {
  /** Global default format preset (used when config doesn't specify one) */
  globalFormatPresetId: string;
  /** Uploaded assets for resolving custom images */
  uploadedAssets: UploadedAsset[];
  /** Progress callback */
  onProgress?: (progress: BatchExportProgress) => void;
}

/**
 * Convert ExportVariantConfig to ExportVariantSpec
 */
function toVariantSpec(config: ExportVariantConfig): ExportVariantSpec {
  return {
    filename: config.filename,
    width: config.width,
    height: config.height,
    format: config.format,
    quality: config.quality,
    description: config.description,
    maxSize: config.maxSize,
  };
}

/**
 * Validate batch configurations before export
 */
export function validateBatchConfigs(
  configs: BatchIconConfig[],
  uploadedAssets: UploadedAsset[]
): BatchValidationResult {
  const errors = new Map<string, string[]>();
  const globalErrors: string[] = [];

  if (configs.length === 0) {
    globalErrors.push("No projects configured");
    return { valid: false, errors, globalErrors };
  }

  // Check for duplicate project names
  const projectNames = new Set<string>();
  const duplicates = new Set<string>();

  for (const config of configs) {
    const sanitized = sanitizeProjectName(config.projectName);
    if (projectNames.has(sanitized)) {
      duplicates.add(sanitized);
    }
    projectNames.add(sanitized);
  }

  if (duplicates.size > 0) {
    globalErrors.push(
      `Duplicate project names: ${Array.from(duplicates).join(", ")}`
    );
  }

  // Validate each config
  for (const config of configs) {
    const configErrors: string[] = [];

    // Check project name
    if (!config.projectName.trim()) {
      configErrors.push("Project name is required");
    }

    // Check icon selection
    if (!config.iconName) {
      configErrors.push("Icon is required");
    }

    // Check style preset
    if (!config.stylePresetId) {
      configErrors.push("Style preset is required");
    } else {
      const stylePreset = getStylePreset(config.stylePresetId);
      if (!stylePreset) {
        configErrors.push(`Style preset not found: ${config.stylePresetId}`);
      }
    }

    // For uploads, check asset exists
    if (config.source === "upload") {
      const asset = uploadedAssets.find(
        (a) => a.name === config.iconName || a.filename === config.iconName
      );
      if (!asset) {
        configErrors.push(`Uploaded asset not found: ${config.iconName}`);
      }
    }

    if (configErrors.length > 0) {
      errors.set(config.id, configErrors);
    }
  }

  return {
    valid: errors.size === 0 && globalErrors.length === 0,
    errors,
    globalErrors,
  };
}

/**
 * Resolve icon ID for a batch config
 */
async function resolveIconId(
  config: BatchIconConfig,
  uploadedAssets: UploadedAsset[]
): Promise<string | null> {
  if (config.source === "upload") {
    const asset = uploadedAssets.find(
      (a) => a.name === config.iconName || a.filename === config.iconName
    );
    return asset?.iconId ?? null;
  }

  // For catalog icons, the iconName might be the full ID or just the name
  // Try to find by direct ID first
  const directIcon = await getIconById(config.iconName);
  if (directIcon) {
    return directIcon.id;
  }

  // Try to find by constructing ID from source and name
  const possibleIds = [
    `${config.source}-${config.iconName}`,
    config.iconName,
    // Add common patterns
    `${config.source}-${config.iconName}-fill`,
    `${config.source}-${config.iconName}-stroke`,
    `${config.source}-${config.iconName}-fill-12`,
    `${config.source}-${config.iconName}-fill-16`,
  ];

  for (const id of possibleIds) {
    const icon = await getIconById(id);
    if (icon && icon.pack === config.source) {
      return icon.id;
    }
  }

  return null;
}

/**
 * Generate batch export ZIP
 */
export async function generateBatchExportZip(
  configs: BatchIconConfig[],
  options: BatchExportOptions
): Promise<BatchExportResult> {
  const { globalFormatPresetId, uploadedAssets, onProgress } = options;
  const warnings: string[] = [];
  const manifestProjects: BatchManifestProject[] = [];

  // Validate first
  const validation = validateBatchConfigs(configs, uploadedAssets);
  if (!validation.valid) {
    const allErrors = [
      ...validation.globalErrors,
      ...Array.from(validation.errors.entries()).flatMap(([id, errs]) =>
        errs.map((e) => `${id}: ${e}`)
      ),
    ];
    throw new Error(`Validation failed: ${allErrors.join("; ")}`);
  }

  onProgress?.({
    phase: "validating",
    currentIndex: 0,
    totalItems: configs.length,
  });

  // Create main ZIP
  const zip = new JSZip();

  // Process each config
  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    const folderName = sanitizeProjectName(config.projectName);

    onProgress?.({
      phase: "rendering",
      currentIndex: i,
      totalItems: configs.length,
      currentItemName: config.projectName,
    });

    try {
      // Resolve style preset
      const stylePreset = getStylePreset(config.stylePresetId);
      if (!stylePreset) {
        warnings.push(`${config.projectName}: Style preset not found, skipped`);
        continue;
      }

      // Resolve format preset
      const formatPresetId = config.formatPresetId || globalFormatPresetId;
      const formatPreset = getExportPreset(formatPresetId);
      if (!formatPreset) {
        warnings.push(
          `${config.projectName}: Format preset not found, using default`
        );
      }

      // Get variants from format preset
      const variants: ExportVariantSpec[] = formatPreset
        ? formatPreset.variants.map(toVariantSpec)
        : [
            { filename: "logo.png", width: 320, height: 320, format: "png" },
            {
              filename: "logo-small.png",
              width: 128,
              height: 128,
              format: "png",
            },
          ];

      // Create folder for this project
      const folder = zip.folder(folderName);
      if (!folder) {
        warnings.push(`${config.projectName}: Failed to create folder`);
        continue;
      }

      // Handle uploaded assets differently
      if (config.source === "upload") {
        const asset = uploadedAssets.find(
          (a) => a.name === config.iconName || a.filename === config.iconName
        );

        if (!asset) {
          warnings.push(`${config.projectName}: Uploaded asset not found`);
          continue;
        }

        // Filter to raster formats only for custom images
        const rasterVariants = variants.filter(
          (v) =>
            v.format === "png" || v.format === "jpeg" || v.format === "webp"
        );

        for (const variant of rasterVariants) {
          const rasterFormat: "png" | "jpeg" | "webp" =
            variant.format === "jpeg" || variant.format === "webp"
              ? variant.format
              : "png";

          const blob = await renderRasterFromImage({
            imageDataUrl: asset.dataUrl,
            backgroundColor: stylePreset.backgroundColor,
            size: config.iconSize,
            width: variant.width,
            height: variant.height,
            format: rasterFormat,
            quality: variant.quality ? variant.quality / 100 : undefined,
            maxFileSize: variant.maxSize ? variant.maxSize * 1024 : undefined,
          });

          folder.file(variant.filename, blob);
        }
      } else {
        // Resolve icon ID for catalog icons
        const iconId = await resolveIconId(config, uploadedAssets);
        if (!iconId) {
          warnings.push(
            `${config.projectName}: Icon not found: ${config.iconName}`
          );
          continue;
        }

        const icon = await getIconById(iconId);
        if (!icon) {
          warnings.push(`${config.projectName}: Icon metadata not found`);
          continue;
        }

        // Build IconGeneratorState-like object
        const state: IconGeneratorState = {
          selectedLocations: [],
          selectedIconId: iconId,
          backgroundColor: stylePreset.backgroundColor,
          iconColor: stylePreset.iconColor,
          searchQuery: "",
          selectedPack: sourceToIconPack(config.source),
          iconSize: config.iconSize,
          svgIconSize: config.iconSize,
        };

        // Generate assets
        const assets = await generateExportAssets(icon, state, variants);

        // Add to folder
        for (const [filename, blob] of assets.entries()) {
          folder.file(filename, blob);
        }
      }

      // Add to manifest
      manifestProjects.push({
        name: folderName,
        source: config.source,
        iconName: config.iconName,
        style: config.stylePresetId,
        formatPreset: formatPresetId,
        iconSize: config.iconSize,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      warnings.push(`${config.projectName}: Export failed - ${message}`);
    }
  }

  onProgress?.({
    phase: "packaging",
    currentIndex: configs.length,
    totalItems: configs.length,
  });

  // Create manifest
  const manifest: BatchManifest = {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    projectCount: manifestProjects.length,
    projects: manifestProjects,
  };

  // Add manifest to ZIP
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  // Generate ZIP blob
  const zipBlob = await zip.generateAsync({ type: "blob" });

  onProgress?.({
    phase: "complete",
    currentIndex: configs.length,
    totalItems: configs.length,
  });

  return {
    zipBlob,
    manifest,
    projectCount: manifestProjects.length,
    warnings,
  };
}

/**
 * Download batch export ZIP
 */
export function downloadBatchZip(blob: Blob): void {
  const date = new Date().toISOString().split("T")[0];
  const filename = `batch-export-${date}.zip`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
