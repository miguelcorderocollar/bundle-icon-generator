/**
 * Preset storage utilities for managing custom export and style presets
 */

import type {
  ExportPreset,
  StylePreset,
  PresetExportData,
  PresetImportResult,
} from "@/src/types/preset";
import {
  isPresetExportData,
  isExportPreset,
  isStylePreset,
} from "@/src/types/preset";
import {
  BUILTIN_EXPORT_PRESETS,
  BUILTIN_STYLE_PRESETS,
  DEFAULT_EXPORT_PRESET_ID,
  DEFAULT_STYLE_PRESET_ID,
} from "./builtin-presets";

/**
 * Storage keys for presets
 */
const STORAGE_KEYS = {
  EXPORT_PRESETS: "zdk-icon-generator:export-presets",
  STYLE_PRESETS: "zdk-icon-generator:style-presets",
  SELECTED_EXPORT_PRESET: "zdk-icon-generator:selected-export-preset",
  SELECTED_STYLE_PRESET: "zdk-icon-generator:selected-style-preset",
} as const;

/**
 * Current preset export version
 * v2: Added optional colorPalette to StylePreset
 */
const PRESET_EXPORT_VERSION = 2;

// ============================================================================
// Export Presets
// ============================================================================

/**
 * Get all custom (user-created) export presets from localStorage
 */
export function getCustomExportPresets(): ExportPreset[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.EXPORT_PRESETS);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isExportPreset);
  } catch (error) {
    console.error("Failed to load custom export presets:", error);
    return [];
  }
}

/**
 * Get all export presets (built-in + custom)
 */
export function getAllExportPresets(): ExportPreset[] {
  return [...BUILTIN_EXPORT_PRESETS, ...getCustomExportPresets()];
}

/**
 * Get an export preset by ID
 */
export function getExportPreset(id: string): ExportPreset | undefined {
  return getAllExportPresets().find((preset) => preset.id === id);
}

/**
 * Save custom export presets to localStorage
 */
export function saveCustomExportPresets(presets: ExportPreset[]): void {
  if (typeof window === "undefined") return;

  try {
    // Filter to only save non-builtin presets
    const customPresets = presets.filter((p) => !p.isBuiltIn);
    localStorage.setItem(
      STORAGE_KEYS.EXPORT_PRESETS,
      JSON.stringify(customPresets)
    );
  } catch (error) {
    console.error("Failed to save custom export presets:", error);
  }
}

/**
 * Add a new custom export preset
 */
export function addExportPreset(
  preset: Omit<ExportPreset, "id" | "isBuiltIn" | "createdAt">
): ExportPreset {
  const newPreset: ExportPreset = {
    ...preset,
    id: generatePresetId(),
    isBuiltIn: false,
    createdAt: new Date().toISOString(),
  };

  const customPresets = getCustomExportPresets();
  customPresets.push(newPreset);
  saveCustomExportPresets(customPresets);

  return newPreset;
}

/**
 * Update an existing custom export preset
 */
export function updateExportPreset(
  id: string,
  updates: Partial<Omit<ExportPreset, "id" | "isBuiltIn">>
): ExportPreset | undefined {
  const customPresets = getCustomExportPresets();
  const index = customPresets.findIndex((p) => p.id === id);

  if (index === -1) {
    console.warn(`Export preset not found: ${id}`);
    return undefined;
  }

  const updated: ExportPreset = {
    ...customPresets[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  customPresets[index] = updated;
  saveCustomExportPresets(customPresets);

  return updated;
}

/**
 * Delete a custom export preset
 */
export function deleteExportPreset(id: string): boolean {
  const customPresets = getCustomExportPresets();
  const filtered = customPresets.filter((p) => p.id !== id);

  if (filtered.length === customPresets.length) {
    return false; // Nothing was deleted
  }

  saveCustomExportPresets(filtered);

  // Reset selected preset if it was deleted
  if (getSelectedExportPresetId() === id) {
    setSelectedExportPresetId(DEFAULT_EXPORT_PRESET_ID);
  }

  return true;
}

/**
 * Get the currently selected export preset ID
 *
 * Note: This does NOT validate that the preset exists. The ID might reference
 * a preset from a restriction config that isn't in localStorage or built-ins.
 * Validation should happen at the UI layer where effectiveExportPresets is available.
 */
export function getSelectedExportPresetId(): string {
  if (typeof window === "undefined") return DEFAULT_EXPORT_PRESET_ID;

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_EXPORT_PRESET);
    if (!stored) return DEFAULT_EXPORT_PRESET_ID;

    return stored;
  } catch {
    return DEFAULT_EXPORT_PRESET_ID;
  }
}

/**
 * Set the currently selected export preset ID
 */
export function setSelectedExportPresetId(id: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEYS.SELECTED_EXPORT_PRESET, id);
  } catch (error) {
    console.error("Failed to save selected export preset:", error);
  }
}

/**
 * Get the currently selected export preset
 */
export function getSelectedExportPreset(): ExportPreset {
  const id = getSelectedExportPresetId();
  return getExportPreset(id) || BUILTIN_EXPORT_PRESETS[0];
}

// ============================================================================
// Style Presets
// ============================================================================

/**
 * Get all custom (user-created) style presets from localStorage
 */
export function getCustomStylePresets(): StylePreset[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.STYLE_PRESETS);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isStylePreset);
  } catch (error) {
    console.error("Failed to load custom style presets:", error);
    return [];
  }
}

/**
 * Get all style presets (built-in + custom)
 */
export function getAllStylePresets(): StylePreset[] {
  return [...BUILTIN_STYLE_PRESETS, ...getCustomStylePresets()];
}

/**
 * Get a style preset by ID
 */
export function getStylePreset(id: string): StylePreset | undefined {
  return getAllStylePresets().find((preset) => preset.id === id);
}

/**
 * Save custom style presets to localStorage
 */
export function saveCustomStylePresets(presets: StylePreset[]): void {
  if (typeof window === "undefined") return;

  try {
    // Filter to only save non-builtin presets
    const customPresets = presets.filter((p) => !p.isBuiltIn);
    localStorage.setItem(
      STORAGE_KEYS.STYLE_PRESETS,
      JSON.stringify(customPresets)
    );
  } catch (error) {
    console.error("Failed to save custom style presets:", error);
  }
}

/**
 * Add a new custom style preset
 */
export function addStylePreset(
  preset: Omit<StylePreset, "id" | "isBuiltIn" | "createdAt">
): StylePreset {
  const newPreset: StylePreset = {
    ...preset,
    id: generatePresetId(),
    isBuiltIn: false,
    createdAt: new Date().toISOString(),
  };

  const customPresets = getCustomStylePresets();
  customPresets.push(newPreset);
  saveCustomStylePresets(customPresets);

  return newPreset;
}

/**
 * Update an existing custom style preset
 */
export function updateStylePreset(
  id: string,
  updates: Partial<Omit<StylePreset, "id" | "isBuiltIn">>
): StylePreset | undefined {
  const customPresets = getCustomStylePresets();
  const index = customPresets.findIndex((p) => p.id === id);

  if (index === -1) {
    console.warn(`Style preset not found: ${id}`);
    return undefined;
  }

  const updated: StylePreset = {
    ...customPresets[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  customPresets[index] = updated;
  saveCustomStylePresets(customPresets);

  return updated;
}

/**
 * Delete a custom style preset
 */
export function deleteStylePreset(id: string): boolean {
  const customPresets = getCustomStylePresets();
  const filtered = customPresets.filter((p) => p.id !== id);

  if (filtered.length === customPresets.length) {
    return false; // Nothing was deleted
  }

  saveCustomStylePresets(filtered);

  // Reset selected preset if it was deleted
  if (getSelectedStylePresetId() === id) {
    setSelectedStylePresetId(DEFAULT_STYLE_PRESET_ID);
  }

  return true;
}

/**
 * Get the currently selected style preset ID
 */
export function getSelectedStylePresetId(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_STYLE_PRESET);
    if (!stored) return null;

    // Verify the preset exists
    const preset = getStylePreset(stored);
    return preset ? stored : null;
  } catch {
    return null;
  }
}

/**
 * Set the currently selected style preset ID
 */
export function setSelectedStylePresetId(id: string | null): void {
  if (typeof window === "undefined") return;

  try {
    if (id === null) {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_STYLE_PRESET);
    } else {
      localStorage.setItem(STORAGE_KEYS.SELECTED_STYLE_PRESET, id);
    }
  } catch (error) {
    console.error("Failed to save selected style preset:", error);
  }
}

/**
 * Get the currently selected style preset
 */
export function getSelectedStylePreset(): StylePreset | null {
  const id = getSelectedStylePresetId();
  if (!id) return null;
  return getStylePreset(id) || null;
}

// ============================================================================
// Import/Export
// ============================================================================

/**
 * Export all custom presets as a JSON string
 */
export function exportUserPresets(): string {
  const data: PresetExportData = {
    version: PRESET_EXPORT_VERSION,
    exportPresets: getCustomExportPresets(),
    stylePresets: getCustomStylePresets(),
    exportedAt: new Date().toISOString(),
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Download presets as a JSON file
 */
export function downloadPresetsFile(): void {
  const json = exportUserPresets();
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `icon-generator-presets-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import presets from a JSON string
 */
export function importUserPresets(json: string): PresetImportResult {
  try {
    const data = JSON.parse(json);

    if (!isPresetExportData(data)) {
      return {
        success: false,
        exportPresetsImported: 0,
        stylePresetsImported: 0,
        error: "Invalid preset file format",
      };
    }

    const warnings: string[] = [];
    let exportPresetsImported = 0;
    let stylePresetsImported = 0;

    // Import export presets
    if (data.exportPresets && data.exportPresets.length > 0) {
      const existingCustom = getCustomExportPresets();
      const existingIds = new Set([
        ...BUILTIN_EXPORT_PRESETS.map((p) => p.id),
        ...existingCustom.map((p) => p.id),
      ]);

      for (const preset of data.exportPresets) {
        if (!isExportPreset(preset)) continue;

        // Skip built-in presets
        if (preset.isBuiltIn) continue;

        // Check for duplicate IDs
        if (existingIds.has(preset.id)) {
          // Generate a new ID for the imported preset
          const newPreset: ExportPreset = {
            ...preset,
            id: generatePresetId(),
            name: `${preset.name} (imported)`,
            isBuiltIn: false,
            createdAt: new Date().toISOString(),
          };
          existingCustom.push(newPreset);
          existingIds.add(newPreset.id);
          warnings.push(`Renamed duplicate export preset: ${preset.name}`);
        } else {
          existingCustom.push({ ...preset, isBuiltIn: false });
          existingIds.add(preset.id);
        }
        exportPresetsImported++;
      }

      saveCustomExportPresets(existingCustom);
    }

    // Import style presets
    if (data.stylePresets && data.stylePresets.length > 0) {
      const existingCustom = getCustomStylePresets();
      const existingIds = new Set([
        ...BUILTIN_STYLE_PRESETS.map((p) => p.id),
        ...existingCustom.map((p) => p.id),
      ]);

      for (const preset of data.stylePresets) {
        // Skip invalid presets (incompatible format will be automatically filtered)
        if (!isStylePreset(preset)) continue;

        // Skip built-in presets
        if (preset.isBuiltIn) continue;

        // Check for duplicate IDs
        if (existingIds.has(preset.id)) {
          // Generate a new ID for the imported preset
          const newPreset: StylePreset = {
            ...preset,
            id: generatePresetId(),
            name: `${preset.name} (imported)`,
            isBuiltIn: false,
            createdAt: new Date().toISOString(),
          };
          existingCustom.push(newPreset);
          existingIds.add(newPreset.id);
          warnings.push(`Renamed duplicate style preset: ${preset.name}`);
        } else {
          existingCustom.push({ ...preset, isBuiltIn: false });
          existingIds.add(preset.id);
        }
        stylePresetsImported++;
      }

      saveCustomStylePresets(existingCustom);
    }

    return {
      success: true,
      exportPresetsImported,
      stylePresetsImported,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    return {
      success: false,
      exportPresetsImported: 0,
      stylePresetsImported: 0,
      error: error instanceof Error ? error.message : "Failed to parse JSON",
    };
  }
}

/**
 * Import presets from a File object
 */
export async function importPresetsFromFile(
  file: File
): Promise<PresetImportResult> {
  try {
    const text = await file.text();
    return importUserPresets(text);
  } catch (error) {
    return {
      success: false,
      exportPresetsImported: 0,
      stylePresetsImported: 0,
      error: error instanceof Error ? error.message : "Failed to read file",
    };
  }
}

/**
 * Clear all custom presets
 */
export function clearAllCustomPresets(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEYS.EXPORT_PRESETS);
    localStorage.removeItem(STORAGE_KEYS.STYLE_PRESETS);
    setSelectedExportPresetId(DEFAULT_EXPORT_PRESET_ID);
    setSelectedStylePresetId(null);
  } catch (error) {
    console.error("Failed to clear custom presets:", error);
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Generate a unique preset ID
 */
function generatePresetId(): string {
  return `preset-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a unique color palette entry ID
 */
export function generateColorPaletteEntryId(): string {
  return `color-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Check if a preset ID is a built-in preset
 */
export function isBuiltInPreset(id: string): boolean {
  return (
    BUILTIN_EXPORT_PRESETS.some((p) => p.id === id) ||
    BUILTIN_STYLE_PRESETS.some((p) => p.id === id)
  );
}
