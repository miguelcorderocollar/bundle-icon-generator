/**
 * Restriction mode type definitions
 *
 * These types define the structure for URL-based restriction configurations
 * that lock users to specific style presets and icon packs.
 */

import type { BackgroundValue } from "@/src/utils/gradients";
import { ICON_PACKS, type IconPack } from "@/src/constants/app";
import type { ExportVariantConfig } from "./preset";

/**
 * A color palette entry for accent colors
 */
export interface RestrictedColorPaletteEntry {
  /** Display name for this color */
  name: string;
  /** Hex color value */
  color: string;
}

/**
 * A restricted style preset defining allowed background and icon color combinations
 */
export interface RestrictedStyle {
  /** Display name for this style option */
  name: string;
  /** Background color or gradient */
  backgroundColor: BackgroundValue;
  /** Icon/foreground color (hex) */
  iconColor: string;
  /** Optional color palette for accent colors (used in canvas mode) */
  colorPalette?: RestrictedColorPaletteEntry[];
}

/**
 * A restricted export preset - either a reference to a built-in preset or a custom definition
 */
export interface RestrictedExportPreset {
  /** Unique identifier (use built-in ID like "zendesk-app" or custom ID) */
  id: string;
  /** Display name */
  name: string;
  /** Description */
  description?: string;
  /**
   * Export variants - if undefined, looks up built-in preset by id.
   * If provided, uses these custom variants.
   */
  variants?: ExportVariantConfig[];
}

/**
 * Configuration for restricted mode
 * This is the structure encoded in the URL parameter
 */
export interface RestrictionConfig {
  /** Schema version for future migrations */
  version: 1;
  /** Allowed style presets (bg + icon color combinations) */
  styles: RestrictedStyle[];
  /** Allowed icon sources (if undefined or empty, all packs are allowed) */
  allowedIconPacks?: IconPack[];
  /**
   * Default icon pack to select on initial load.
   * Must be one of the allowedIconPacks (or any pack if allowedIconPacks is undefined).
   * If not specified, uses the first allowed pack.
   */
  defaultIconPack?: IconPack;
  /**
   * Allowed export presets (if undefined or empty, all presets are allowed).
   * Can reference built-in presets by id or define custom presets inline.
   */
  allowedExportPresets?: RestrictedExportPreset[];
}

/**
 * Type guard for RestrictedColorPaletteEntry
 */
export function isRestrictedColorPaletteEntry(
  value: unknown
): value is RestrictedColorPaletteEntry {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const entry = value as RestrictedColorPaletteEntry;
  return (
    typeof entry.name === "string" &&
    entry.name.length > 0 &&
    typeof entry.color === "string" &&
    /^#[0-9A-Fa-f]{6}$/.test(entry.color)
  );
}

/**
 * Type guard for RestrictedStyle
 */
export function isRestrictedStyle(value: unknown): value is RestrictedStyle {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const style = value as RestrictedStyle;

  // Check required fields
  if (
    typeof style.name !== "string" ||
    style.name.length === 0 ||
    !(
      typeof style.backgroundColor === "string" ||
      (typeof style.backgroundColor === "object" &&
        style.backgroundColor !== null &&
        "type" in style.backgroundColor)
    ) ||
    typeof style.iconColor !== "string"
  ) {
    return false;
  }

  // Validate colorPalette if present
  if (style.colorPalette !== undefined) {
    if (!Array.isArray(style.colorPalette)) {
      return false;
    }
    for (const entry of style.colorPalette) {
      if (!isRestrictedColorPaletteEntry(entry)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Type guard for RestrictedExportPreset
 */
export function isRestrictedExportPreset(
  value: unknown
): value is RestrictedExportPreset {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const preset = value as RestrictedExportPreset;

  // id and name are required
  if (
    typeof preset.id !== "string" ||
    preset.id.length === 0 ||
    typeof preset.name !== "string" ||
    preset.name.length === 0
  ) {
    return false;
  }

  // description is optional but must be string if present
  if (
    preset.description !== undefined &&
    typeof preset.description !== "string"
  ) {
    return false;
  }

  // variants is optional but must be array if present
  if (preset.variants !== undefined) {
    if (!Array.isArray(preset.variants)) {
      return false;
    }
    // Basic validation of variant structure
    for (const variant of preset.variants) {
      if (
        typeof variant !== "object" ||
        variant === null ||
        typeof variant.filename !== "string" ||
        typeof variant.width !== "number" ||
        typeof variant.height !== "number" ||
        typeof variant.format !== "string"
      ) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Valid icon pack values for validation
 */
const VALID_ICON_PACKS: IconPack[] = Object.values(ICON_PACKS) as IconPack[];

/**
 * Type guard for IconPack
 */
export function isValidIconPack(value: unknown): value is IconPack {
  return (
    typeof value === "string" && VALID_ICON_PACKS.includes(value as IconPack)
  );
}

/**
 * Type guard for RestrictionConfig
 */
export function isRestrictionConfig(
  value: unknown
): value is RestrictionConfig {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const config = value as RestrictionConfig;

  // Check version
  if (config.version !== 1) {
    return false;
  }

  // Check styles array
  if (!Array.isArray(config.styles) || config.styles.length === 0) {
    return false;
  }

  // Validate each style
  for (const style of config.styles) {
    if (!isRestrictedStyle(style)) {
      return false;
    }
  }

  // Validate allowedIconPacks if present
  if (config.allowedIconPacks !== undefined) {
    if (!Array.isArray(config.allowedIconPacks)) {
      return false;
    }
    for (const pack of config.allowedIconPacks) {
      if (!isValidIconPack(pack)) {
        return false;
      }
    }
  }

  // Validate defaultIconPack if present
  if (config.defaultIconPack !== undefined) {
    if (!isValidIconPack(config.defaultIconPack)) {
      return false;
    }
    // If allowedIconPacks is defined, defaultIconPack must be in the list
    if (
      config.allowedIconPacks &&
      !config.allowedIconPacks.includes(config.defaultIconPack)
    ) {
      return false;
    }
  }

  // Validate allowedExportPresets if present
  if (config.allowedExportPresets !== undefined) {
    if (!Array.isArray(config.allowedExportPresets)) {
      return false;
    }
    for (const preset of config.allowedExportPresets) {
      if (!isRestrictedExportPreset(preset)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Create a default restriction config
 */
export function createDefaultRestrictionConfig(): RestrictionConfig {
  return {
    version: 1,
    styles: [
      {
        name: "Zendesk Default",
        backgroundColor: "#063940",
        iconColor: "#ffffff",
      },
    ],
    allowedIconPacks: undefined,
  };
}
