"use client";

/**
 * CanvasControlsPane - Source selector + Presets + Background controls for canvas mode
 */

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Library,
  Layers,
  Smile,
  Upload,
  Image as ImageIcon,
  PenTool,
  Settings,
  AlertTriangle,
} from "lucide-react";
import { BackgroundControls } from "./BackgroundControls";
import { ExportPresetSelector } from "./ExportPresetSelector";
import { ExportPresetEditor } from "./ExportPresetEditor";
import { StylePresetSelector } from "./StylePresetSelector";
import { StylePresetEditor } from "./StylePresetEditor";
import { PresetSettingsModal } from "./PresetSettingsModal";
import { usePresets } from "@/src/hooks/use-presets";
import { ICON_PACKS, type IconPack } from "@/src/constants/app";
import type { BackgroundValue } from "@/src/utils/gradients";
import type { ExportPreset, StylePreset } from "@/src/types/preset";
import { useRestriction } from "@/src/contexts/RestrictionContext";
import { RestrictedStyleSelector } from "./RestrictedStyleSelector";
import type { RestrictedStyle } from "@/src/types/restriction";

interface CanvasControlsPaneProps {
  selectedPack: IconPack;
  onPackChange: (pack: IconPack) => void;
  backgroundColor: BackgroundValue;
  onBackgroundColorChange: (color: BackgroundValue) => void;
  /** Callback to apply icon color to all icon/text layers */
  onApplyIconColor?: (color: string) => void;
}

export function CanvasControlsPane({
  selectedPack,
  onPackChange,
  backgroundColor,
  onBackgroundColorChange,
  onApplyIconColor,
}: CanvasControlsPaneProps) {
  // Restriction mode
  const {
    isRestricted,
    allowedStyles,
    isIconPackAllowed,
    allowedExportPresets,
    isLoading: isRestrictionLoading,
  } = useRestriction();

  // Presets hook
  const {
    exportPresets,
    selectedExportPresetId,
    selectExportPreset,
    createExportPreset,
    updateExportPreset,
    deleteExportPreset,
    stylePresets,
    selectedStylePresetId,
    selectStylePreset,
    createStylePreset,
    updateStylePreset,
    deleteStylePreset,
    exportAllPresets,
    importPresets,
    clearCustomPresets,
    hasCustomExportPresets,
    hasCustomStylePresets,
  } = usePresets();

  // Export preset editor state
  const [showExportEditor, setShowExportEditor] = React.useState(false);
  const [editingExportPreset, setEditingExportPreset] = React.useState<
    ExportPreset | undefined
  >();

  // Style preset editor state
  const [showStyleEditor, setShowStyleEditor] = React.useState(false);
  const [editingStylePreset, setEditingStylePreset] = React.useState<
    StylePreset | undefined
  >();

  // Determine the effective presets list (restricted or all)
  const effectiveExportPresets = allowedExportPresets ?? exportPresets;

  // Determine the actual selected preset from the effective list
  const actualSelectedExportPreset = React.useMemo(() => {
    return effectiveExportPresets.find((p) => p.id === selectedExportPresetId);
  }, [effectiveExportPresets, selectedExportPresetId]);

  // Check if selected export preset has SVG variants (canvas doesn't support SVG)
  const hasSvgVariants = React.useMemo(() => {
    if (!actualSelectedExportPreset) return false;
    return actualSelectedExportPreset.variants.some((v) => v.format === "svg");
  }, [actualSelectedExportPreset]);

  // Auto-select first allowed export preset if current is not allowed
  React.useEffect(() => {
    if (!isRestricted || !allowedExportPresets) return;

    // Check if current preset is in the allowed list
    const isCurrentAllowed = allowedExportPresets.some(
      (p) => p.id === selectedExportPresetId
    );

    if (!isCurrentAllowed && allowedExportPresets.length > 0) {
      selectExportPreset(allowedExportPresets[0].id);
    }
  }, [
    isRestricted,
    allowedExportPresets,
    selectedExportPresetId,
    selectExportPreset,
  ]);

  // Handle applying a style preset
  const handleApplyStylePreset = React.useCallback(
    (preset: StylePreset) => {
      onBackgroundColorChange(preset.backgroundColor);
      // Apply icon color to canvas layers
      if (onApplyIconColor) {
        onApplyIconColor(preset.iconColor);
      }
    },
    [onBackgroundColorChange, onApplyIconColor]
  );

  // Handle applying a restricted style
  const handleApplyRestrictedStyle = React.useCallback(
    (style: RestrictedStyle) => {
      onBackgroundColorChange(style.backgroundColor);
      // Apply icon color to canvas layers
      if (onApplyIconColor) {
        onApplyIconColor(style.iconColor);
      }
    },
    [onBackgroundColorChange, onApplyIconColor]
  );

  // Export preset handlers
  const handleCreateExportPreset = () => {
    setEditingExportPreset(undefined);
    setShowExportEditor(true);
  };

  const handleEditExportPreset = (preset: ExportPreset) => {
    setEditingExportPreset(preset);
    setShowExportEditor(true);
  };

  const handleSaveExportPreset = (
    preset: Omit<ExportPreset, "id" | "isBuiltIn" | "createdAt">
  ) => {
    if (editingExportPreset) {
      updateExportPreset(editingExportPreset.id, preset);
    } else {
      const newPreset = createExportPreset(preset);
      selectExportPreset(newPreset.id);
    }
  };

  // Style preset handlers
  const handleCreateStylePreset = () => {
    setEditingStylePreset(undefined);
    setShowStyleEditor(true);
  };

  const handleEditStylePreset = (preset: StylePreset) => {
    setEditingStylePreset(preset);
    setShowStyleEditor(true);
  };

  const handleSaveStylePreset = (
    preset: Omit<StylePreset, "id" | "isBuiltIn" | "createdAt">
  ) => {
    if (editingStylePreset) {
      updateStylePreset(editingStylePreset.id, preset);
    } else {
      const newPreset = createStylePreset(preset);
      selectStylePreset(newPreset.id);
      handleApplyStylePreset(newPreset as StylePreset);
    }
  };

  const handlePackChange = (value: string) => {
    onPackChange(value as IconPack);
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">Controls</CardTitle>
        {!isRestrictionLoading && !isRestricted ? (
          <PresetSettingsModal
            exportPresets={exportPresets}
            stylePresets={stylePresets}
            onCreateExportPreset={createExportPreset}
            onUpdateExportPreset={updateExportPreset}
            onDeleteExportPreset={deleteExportPreset}
            onCreateStylePreset={createStylePreset}
            onUpdateStylePreset={updateStylePreset}
            onDeleteStylePreset={deleteStylePreset}
            onExportPresets={exportAllPresets}
            onImportPresets={importPresets}
            onClearPresets={clearCustomPresets}
            hasCustomPresets={hasCustomExportPresets || hasCustomStylePresets}
            trigger={
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            }
          />
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 overflow-y-auto">
        {/* Source Selector */}
        <div className="space-y-2">
          <Label htmlFor="source-select">Source</Label>
          <Select value={selectedPack} onValueChange={handlePackChange}>
            <SelectTrigger id="source-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {isIconPackAllowed(ICON_PACKS.ALL) && (
                <SelectItem value={ICON_PACKS.ALL}>
                  <span className="flex items-center gap-2">
                    <Layers className="size-4" />
                    All Icons
                  </span>
                </SelectItem>
              )}
              {isIconPackAllowed(ICON_PACKS.GARDEN) && (
                <SelectItem value={ICON_PACKS.GARDEN}>
                  <span className="flex items-center gap-2">
                    <Library className="size-4" />
                    Garden
                  </span>
                </SelectItem>
              )}
              {isIconPackAllowed(ICON_PACKS.FEATHER) && (
                <SelectItem value={ICON_PACKS.FEATHER}>
                  <span className="flex items-center gap-2">
                    <Library className="size-4" />
                    Feather
                  </span>
                </SelectItem>
              )}
              {isIconPackAllowed(ICON_PACKS.REMIXICON) && (
                <SelectItem value={ICON_PACKS.REMIXICON}>
                  <span className="flex items-center gap-2">
                    <Library className="size-4" />
                    RemixIcon
                  </span>
                </SelectItem>
              )}
              {isIconPackAllowed(ICON_PACKS.EMOJI) && (
                <SelectItem value={ICON_PACKS.EMOJI}>
                  <span className="flex items-center gap-2">
                    <Smile className="size-4" />
                    Emoji
                  </span>
                </SelectItem>
              )}
              {isIconPackAllowed(ICON_PACKS.CUSTOM_SVG) && (
                <SelectItem value={ICON_PACKS.CUSTOM_SVG}>
                  <span className="flex items-center gap-2">
                    <Upload className="size-4" />
                    Custom SVG
                  </span>
                </SelectItem>
              )}
              {isIconPackAllowed(ICON_PACKS.CUSTOM_IMAGE) && (
                <SelectItem value={ICON_PACKS.CUSTOM_IMAGE}>
                  <span className="flex items-center gap-2">
                    <ImageIcon className="size-4" />
                    Custom Image
                  </span>
                </SelectItem>
              )}
              {isIconPackAllowed(ICON_PACKS.CANVAS) && (
                <SelectItem value={ICON_PACKS.CANVAS}>
                  <span className="flex items-center gap-2">
                    <PenTool className="size-4" />
                    Canvas Editor
                  </span>
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Select a different source to exit canvas mode.
          </p>
        </div>

        <Separator />

        {/* Export Preset Selection */}
        <ExportPresetSelector
          presets={effectiveExportPresets}
          selectedPresetId={selectedExportPresetId}
          onSelectPreset={selectExportPreset}
          onCreatePreset={!isRestrictionLoading && !isRestricted ? handleCreateExportPreset : undefined}
          onEditPreset={!isRestrictionLoading && !isRestricted ? handleEditExportPreset : undefined}
          onDeletePreset={!isRestrictionLoading && !isRestricted ? deleteExportPreset : undefined}
        />

        {/* SVG Warning for Canvas Mode */}
        {hasSvgVariants && (
          <Alert
            variant="default"
            className="border-amber-500/50 bg-amber-500/10"
          >
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-xs">
              Canvas mode only exports raster formats. SVG files in this preset
              will be skipped.
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        {/* Style Controls - different UI for restricted vs normal mode */}
        {!isRestrictionLoading && isRestricted ? (
          /* Restricted mode - show simplified style selector with color palette */
          <RestrictedStyleSelector
            styles={allowedStyles}
            currentBackground={backgroundColor}
            currentIconColor="#ffffff"
            onStyleSelect={handleApplyRestrictedStyle}
            showColorPalette={true}
            onColorSelect={onApplyIconColor}
          />
        ) : (
          <>
            {/* Style Preset Selection */}
            <StylePresetSelector
              presets={stylePresets}
              selectedPresetId={selectedStylePresetId}
              onSelectPreset={selectStylePreset}
              onApplyPreset={handleApplyStylePreset}
              onCreatePreset={handleCreateStylePreset}
              onEditPreset={handleEditStylePreset}
              onDeletePreset={deleteStylePreset}
            />

            <Separator />

            {/* Background Controls */}
            <BackgroundControls
              value={backgroundColor}
              onChange={onBackgroundColorChange}
            />
          </>
        )}
      </CardContent>

      {/* Export Preset Editor Modal */}
      <ExportPresetEditor
        open={showExportEditor}
        onOpenChange={setShowExportEditor}
        preset={editingExportPreset}
        onSave={handleSaveExportPreset}
        mode={editingExportPreset ? "edit" : "create"}
      />

      {/* Style Preset Editor Modal */}
      <StylePresetEditor
        open={showStyleEditor}
        onOpenChange={setShowStyleEditor}
        preset={editingStylePreset}
        onSave={handleSaveStylePreset}
        mode={editingStylePreset ? "edit" : "create"}
      />
    </Card>
  );
}
