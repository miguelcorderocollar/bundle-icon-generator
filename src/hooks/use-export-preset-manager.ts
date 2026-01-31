/**
 * Hook for managing export presets in the share page
 *
 * Handles built-in preset toggling and custom preset CRUD.
 */

import * as React from "react";
import type {
  RestrictionConfig,
  RestrictedExportPreset,
} from "@/src/types/restriction";
import type { ExportPreset } from "@/src/types/preset";
import { BUILTIN_EXPORT_PRESETS } from "@/src/utils/builtin-presets";

export interface CustomExportPresetWithIndex {
  preset: RestrictedExportPreset;
  index: number;
}

export interface UseExportPresetManagerReturn {
  /** Whether the export preset editor modal is open */
  showEditor: boolean;
  /** The preset being edited (undefined for new preset) */
  editingPreset: RestrictedExportPreset | undefined;
  /** The index of the preset being edited (null for new preset) */
  editingPresetIndex: number | null;
  /** Custom presets (those with variants defined) */
  customPresets: CustomExportPresetWithIndex[];
  /** Toggle a built-in preset on/off */
  toggleBuiltInPreset: (presetId: string) => void;
  /** Toggle all built-in presets */
  toggleAllPresets: () => void;
  /** Open editor to create a new custom preset */
  createCustomPreset: () => void;
  /** Open editor to edit an existing custom preset */
  editCustomPreset: (preset: RestrictedExportPreset, index: number) => void;
  /** Save a custom preset (create or update) */
  saveCustomPreset: (
    preset: Omit<ExportPreset, "id" | "isBuiltIn" | "createdAt">
  ) => void;
  /** Delete a custom preset by index */
  deleteCustomPreset: (index: number) => void;
  /** Close the editor modal */
  closeEditor: () => void;
  /** Set whether the editor is open */
  setShowEditor: (show: boolean) => void;
}

export function useExportPresetManager(
  config: RestrictionConfig,
  setConfig: (config: RestrictionConfig) => void
): UseExportPresetManagerReturn {
  const [showEditor, setShowEditor] = React.useState(false);
  const [editingPreset, setEditingPreset] = React.useState<
    RestrictedExportPreset | undefined
  >();
  const [editingPresetIndex, setEditingPresetIndex] = React.useState<
    number | null
  >(null);

  // Get custom presets (those with variants defined)
  const customPresets = React.useMemo(() => {
    if (!config.allowedExportPresets) return [];
    return config.allowedExportPresets
      .map((preset, index) => ({ preset, index }))
      .filter(({ preset }) => preset.variants && preset.variants.length > 0);
  }, [config.allowedExportPresets]);

  // Toggle a built-in preset
  const toggleBuiltInPreset = React.useCallback(
    (presetId: string) => {
      const currentPresets = config.allowedExportPresets || [];
      const existingIndex = currentPresets.findIndex((p) => p.id === presetId);

      if (existingIndex >= 0) {
        // Remove it
        const newPresets = currentPresets.filter((_, i) => i !== existingIndex);
        setConfig({
          ...config,
          allowedExportPresets: newPresets.length > 0 ? newPresets : undefined,
        });
      } else {
        // Add it - find the built-in preset to get name/description
        const builtIn = BUILTIN_EXPORT_PRESETS.find((p) => p.id === presetId);
        if (builtIn) {
          const newPreset: RestrictedExportPreset = {
            id: builtIn.id,
            name: builtIn.name,
            description: builtIn.description,
            // No variants means it references the built-in
          };
          setConfig({
            ...config,
            allowedExportPresets: [...currentPresets, newPreset],
          });
        }
      }
    },
    [config, setConfig]
  );

  // Toggle all built-in presets
  const toggleAllPresets = React.useCallback(() => {
    const currentPresets = config.allowedExportPresets || [];
    if (currentPresets.length === BUILTIN_EXPORT_PRESETS.length) {
      // All selected - deselect all
      setConfig({ ...config, allowedExportPresets: undefined });
    } else {
      // Select all built-in presets
      const allPresets: RestrictedExportPreset[] = BUILTIN_EXPORT_PRESETS.map(
        (p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
        })
      );
      setConfig({ ...config, allowedExportPresets: allPresets });
    }
  }, [config, setConfig]);

  // Create a new custom preset
  const createCustomPreset = React.useCallback(() => {
    setEditingPreset(undefined);
    setEditingPresetIndex(null);
    setShowEditor(true);
  }, []);

  // Edit an existing custom preset
  const editCustomPreset = React.useCallback(
    (preset: RestrictedExportPreset, index: number) => {
      setEditingPreset(preset);
      setEditingPresetIndex(index);
      setShowEditor(true);
    },
    []
  );

  // Save a custom preset (create or update)
  const saveCustomPreset = React.useCallback(
    (preset: Omit<ExportPreset, "id" | "isBuiltIn" | "createdAt">) => {
      const currentPresets = config.allowedExportPresets || [];

      if (editingPresetIndex !== null) {
        // Update existing preset
        const updatedPresets = [...currentPresets];
        updatedPresets[editingPresetIndex] = {
          id: editingPreset?.id || `custom-${Date.now()}`,
          name: preset.name,
          description: preset.description,
          variants: preset.variants,
        };
        setConfig({ ...config, allowedExportPresets: updatedPresets });
      } else {
        // Create new preset
        const newPreset: RestrictedExportPreset = {
          id: `custom-${Date.now()}`,
          name: preset.name,
          description: preset.description,
          variants: preset.variants,
        };
        setConfig({
          ...config,
          allowedExportPresets: [...currentPresets, newPreset],
        });
      }

      setShowEditor(false);
      setEditingPreset(undefined);
      setEditingPresetIndex(null);
    },
    [config, setConfig, editingPreset, editingPresetIndex]
  );

  // Delete a custom preset
  const deleteCustomPreset = React.useCallback(
    (index: number) => {
      const currentPresets = config.allowedExportPresets || [];
      const updatedPresets = currentPresets.filter((_, i) => i !== index);
      setConfig({
        ...config,
        allowedExportPresets:
          updatedPresets.length > 0 ? updatedPresets : undefined,
      });
    },
    [config, setConfig]
  );

  // Close the editor modal
  const closeEditor = React.useCallback(() => {
    setShowEditor(false);
    setEditingPreset(undefined);
    setEditingPresetIndex(null);
  }, []);

  return {
    showEditor,
    editingPreset,
    editingPresetIndex,
    customPresets,
    toggleBuiltInPreset,
    toggleAllPresets,
    createCustomPreset,
    editCustomPreset,
    saveCustomPreset,
    deleteCustomPreset,
    closeEditor,
    setShowEditor,
  };
}
