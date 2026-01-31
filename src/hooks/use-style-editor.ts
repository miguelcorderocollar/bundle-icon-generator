/**
 * Hook for style preset editing in the share page
 *
 * Manages style CRUD operations and color palette editing.
 */

import * as React from "react";
import type {
  RestrictionConfig,
  RestrictedStyle,
  RestrictedColorPaletteEntry,
} from "@/src/types/restriction";

export interface UseStyleEditorReturn {
  /** Index of the currently editing style (null if none) */
  editingStyleIndex: number | null;
  /** The currently editing style object (null if none) */
  editingStyle: RestrictedStyle | null;
  /** Add a new style to the config */
  addStyle: () => void;
  /** Remove a style by index */
  removeStyle: (index: number) => void;
  /** Update a style by index */
  updateStyle: (index: number, updates: Partial<RestrictedStyle>) => void;
  /** Set the editing index */
  setEditingIndex: (index: number | null) => void;
  /** Add a color to the current style's palette */
  addPaletteColor: () => void;
  /** Remove a color from the current style's palette */
  removePaletteColor: (colorIndex: number) => void;
  /** Update a color in the current style's palette */
  updatePaletteColor: (
    colorIndex: number,
    updates: Partial<RestrictedColorPaletteEntry>
  ) => void;
}

export function useStyleEditor(
  config: RestrictionConfig,
  setConfig: (config: RestrictionConfig) => void
): UseStyleEditorReturn {
  const [editingStyleIndex, setEditingStyleIndex] = React.useState<
    number | null
  >(null);

  // Get the currently editing style
  const editingStyle =
    editingStyleIndex !== null ? config.styles[editingStyleIndex] : null;

  // Add a new style
  const addStyle = React.useCallback(() => {
    const newStyle: RestrictedStyle = {
      name: `Style ${config.styles.length + 1}`,
      backgroundColor: "#063940",
      iconColor: "#ffffff",
    };
    setConfig({
      ...config,
      styles: [...config.styles, newStyle],
    });
    setEditingStyleIndex(config.styles.length);
  }, [config, setConfig]);

  // Remove a style
  const removeStyle = React.useCallback(
    (index: number) => {
      if (config.styles.length <= 1) {
        return; // Must have at least one style
      }
      const newStyles = config.styles.filter((_, i) => i !== index);
      setConfig({ ...config, styles: newStyles });
      if (editingStyleIndex === index) {
        setEditingStyleIndex(null);
      } else if (editingStyleIndex !== null && editingStyleIndex > index) {
        setEditingStyleIndex(editingStyleIndex - 1);
      }
    },
    [config, setConfig, editingStyleIndex]
  );

  // Update a style
  const updateStyle = React.useCallback(
    (index: number, updates: Partial<RestrictedStyle>) => {
      const newStyles = [...config.styles];
      newStyles[index] = { ...newStyles[index], ...updates };
      setConfig({ ...config, styles: newStyles });
    },
    [config, setConfig]
  );

  // Add a color to the palette
  const addPaletteColor = React.useCallback(() => {
    if (editingStyleIndex === null) return;
    const style = config.styles[editingStyleIndex];
    const currentPalette = style.colorPalette || [];
    const newColor: RestrictedColorPaletteEntry = {
      name: `Color ${currentPalette.length + 1}`,
      color: "#808080",
    };
    updateStyle(editingStyleIndex, {
      colorPalette: [...currentPalette, newColor],
    });
  }, [config, editingStyleIndex, updateStyle]);

  // Remove a color from the palette
  const removePaletteColor = React.useCallback(
    (colorIndex: number) => {
      if (editingStyleIndex === null) return;
      const style = config.styles[editingStyleIndex];
      const currentPalette = style.colorPalette || [];
      updateStyle(editingStyleIndex, {
        colorPalette: currentPalette.filter((_, i) => i !== colorIndex),
      });
    },
    [config, editingStyleIndex, updateStyle]
  );

  // Update a color in the palette
  const updatePaletteColor = React.useCallback(
    (colorIndex: number, updates: Partial<RestrictedColorPaletteEntry>) => {
      if (editingStyleIndex === null) return;
      const style = config.styles[editingStyleIndex];
      const currentPalette = style.colorPalette || [];
      const newPalette = [...currentPalette];
      newPalette[colorIndex] = { ...newPalette[colorIndex], ...updates };
      updateStyle(editingStyleIndex, { colorPalette: newPalette });
    },
    [config, editingStyleIndex, updateStyle]
  );

  // Set editing index
  const setEditingIndex = React.useCallback((index: number | null) => {
    setEditingStyleIndex(index);
  }, []);

  return {
    editingStyleIndex,
    editingStyle,
    addStyle,
    removeStyle,
    updateStyle,
    setEditingIndex,
    addPaletteColor,
    removePaletteColor,
    updatePaletteColor,
  };
}
