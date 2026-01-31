/**
 * Hook for managing preset editor state and handlers
 *
 * Used by components that need to create/edit export and style presets
 */

import * as React from "react";
import type { ExportPreset, StylePreset } from "@/src/types/preset";

export interface UseExportPresetHandlersReturn {
  /** Whether the export preset editor modal is open */
  showEditor: boolean;
  /** The preset being edited (undefined for new preset) */
  editingPreset: ExportPreset | undefined;
  /** Open editor to create a new preset */
  handleCreate: () => void;
  /** Open editor to edit an existing preset */
  handleEdit: (preset: ExportPreset) => void;
  /** Save the preset (handles both create and update) */
  handleSave: (
    preset: Omit<ExportPreset, "id" | "isBuiltIn" | "createdAt">
  ) => void;
  /** Close the editor */
  handleClose: () => void;
  /** Set editor visibility */
  setShowEditor: (show: boolean) => void;
}

export interface UseStylePresetHandlersReturn {
  /** Whether the style preset editor modal is open */
  showEditor: boolean;
  /** The preset being edited (undefined for new preset) */
  editingPreset: StylePreset | undefined;
  /** Open editor to create a new preset */
  handleCreate: () => void;
  /** Open editor to edit an existing preset */
  handleEdit: (preset: StylePreset) => void;
  /** Save the preset (handles both create and update) */
  handleSave: (
    preset: Omit<StylePreset, "id" | "isBuiltIn" | "createdAt">
  ) => void;
  /** Close the editor */
  handleClose: () => void;
  /** Set editor visibility */
  setShowEditor: (show: boolean) => void;
}

/**
 * Hook for export preset editor state
 */
export function useExportPresetHandlers(
  createPreset: (
    preset: Omit<ExportPreset, "id" | "isBuiltIn" | "createdAt">
  ) => ExportPreset,
  updatePreset: (id: string, updates: Partial<ExportPreset>) => void,
  selectPreset: (id: string) => void
): UseExportPresetHandlersReturn {
  const [showEditor, setShowEditor] = React.useState(false);
  const [editingPreset, setEditingPreset] = React.useState<
    ExportPreset | undefined
  >();

  const handleCreate = React.useCallback(() => {
    setEditingPreset(undefined);
    setShowEditor(true);
  }, []);

  const handleEdit = React.useCallback((preset: ExportPreset) => {
    setEditingPreset(preset);
    setShowEditor(true);
  }, []);

  const handleSave = React.useCallback(
    (preset: Omit<ExportPreset, "id" | "isBuiltIn" | "createdAt">) => {
      if (editingPreset) {
        updatePreset(editingPreset.id, preset);
      } else {
        const newPreset = createPreset(preset);
        selectPreset(newPreset.id);
      }
      setShowEditor(false);
      setEditingPreset(undefined);
    },
    [editingPreset, createPreset, updatePreset, selectPreset]
  );

  const handleClose = React.useCallback(() => {
    setShowEditor(false);
    setEditingPreset(undefined);
  }, []);

  return {
    showEditor,
    editingPreset,
    handleCreate,
    handleEdit,
    handleSave,
    handleClose,
    setShowEditor,
  };
}

/**
 * Hook for style preset editor state
 */
export function useStylePresetHandlers(
  createPreset: (
    preset: Omit<StylePreset, "id" | "isBuiltIn" | "createdAt">
  ) => StylePreset,
  updatePreset: (id: string, updates: Partial<StylePreset>) => void,
  selectPreset: (id: string) => void,
  onApplyPreset?: (preset: StylePreset) => void
): UseStylePresetHandlersReturn {
  const [showEditor, setShowEditor] = React.useState(false);
  const [editingPreset, setEditingPreset] = React.useState<
    StylePreset | undefined
  >();

  const handleCreate = React.useCallback(() => {
    setEditingPreset(undefined);
    setShowEditor(true);
  }, []);

  const handleEdit = React.useCallback((preset: StylePreset) => {
    setEditingPreset(preset);
    setShowEditor(true);
  }, []);

  const handleSave = React.useCallback(
    (preset: Omit<StylePreset, "id" | "isBuiltIn" | "createdAt">) => {
      if (editingPreset) {
        updatePreset(editingPreset.id, preset);
      } else {
        const newPreset = createPreset(preset);
        selectPreset(newPreset.id);
        if (onApplyPreset) {
          onApplyPreset(newPreset);
        }
      }
      setShowEditor(false);
      setEditingPreset(undefined);
    },
    [editingPreset, createPreset, updatePreset, selectPreset, onApplyPreset]
  );

  const handleClose = React.useCallback(() => {
    setShowEditor(false);
    setEditingPreset(undefined);
  }, []);

  return {
    showEditor,
    editingPreset,
    handleCreate,
    handleEdit,
    handleSave,
    handleClose,
    setShowEditor,
  };
}
