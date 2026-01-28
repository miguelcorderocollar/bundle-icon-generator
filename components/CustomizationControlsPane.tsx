"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Settings, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ColorPicker } from "@/src/components/ColorPicker";
import { EffectSlider } from "@/src/components/EffectSlider";
import { BackgroundControls } from "@/src/components/BackgroundControls";
import { ExportPresetSelector } from "@/src/components/ExportPresetSelector";
import { ExportPresetEditor } from "@/src/components/ExportPresetEditor";
import { StylePresetSelector } from "@/src/components/StylePresetSelector";
import { StylePresetEditor } from "@/src/components/StylePresetEditor";
import { PresetSettingsModal } from "@/src/components/PresetSettingsModal";
import { DEFAULT_COLORS, ICON_GRID } from "@/src/constants/app";
import { useDebouncedValue } from "@/src/hooks/use-debounced-value";
import { usePresets } from "@/src/hooks/use-presets";
import type { BackgroundValue } from "@/src/utils/gradients";
import type { ExportPreset, StylePreset } from "@/src/types/preset";
import { isCustomImageIcon } from "@/src/utils/locations";
import { useRestriction } from "@/src/contexts/RestrictionContext";
import { RestrictedStyleSelector } from "@/src/components/RestrictedStyleSelector";
import type { RestrictedStyle } from "@/src/types/restriction";

export interface CustomizationControlsPaneProps {
  backgroundColor?: BackgroundValue;
  onBackgroundColorChange?: (color: BackgroundValue) => void;
  iconColor?: string;
  onIconColorChange?: (color: string) => void;
  iconSize?: number;
  onIconSizeChange?: (size: number) => void;
  svgIconSize?: number;
  onSvgIconSizeChange?: (size: number) => void;
  selectedIconId?: string;
}

export function CustomizationControlsPane({
  backgroundColor = DEFAULT_COLORS.BACKGROUND,
  onBackgroundColorChange,
  iconColor = DEFAULT_COLORS.ICON,
  onIconColorChange,
  iconSize = ICON_GRID.DEFAULT_ICON_SIZE,
  onIconSizeChange,
  svgIconSize = ICON_GRID.DEFAULT_ICON_SIZE,
  onSvgIconSizeChange,
  selectedIconId,
}: CustomizationControlsPaneProps) {
  // Restriction mode
  const { isRestricted, allowedStyles, allowedExportPresets, isLoading: isRestrictionLoading } =
    useRestriction();

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

  // Check if current icon is a custom image
  const isCustomImage = isCustomImageIcon(selectedIconId);

  // Determine the effective presets list (restricted or all)
  const effectiveExportPresets = allowedExportPresets ?? exportPresets;

  // Determine the actual selected preset from the effective list
  const actualSelectedExportPreset = React.useMemo(() => {
    return effectiveExportPresets.find((p) => p.id === selectedExportPresetId);
  }, [effectiveExportPresets, selectedExportPresetId]);

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

  // Check if selected export preset has SVG variants
  const hasSvgVariants = React.useMemo(() => {
    if (!actualSelectedExportPreset) return false;
    return actualSelectedExportPreset.variants.some((v) => v.format === "svg");
  }, [actualSelectedExportPreset]);

  // Get the selected style preset (for accessing color palette)
  const selectedStylePreset = React.useMemo(() => {
    if (!selectedStylePresetId) return null;
    return stylePresets.find((p) => p.id === selectedStylePresetId) || null;
  }, [selectedStylePresetId, stylePresets]);

  // Handle applying a style preset
  const handleApplyStylePreset = React.useCallback(
    (preset: StylePreset) => {
      if (onBackgroundColorChange) {
        onBackgroundColorChange(preset.backgroundColor);
      }
      if (onIconColorChange) {
        onIconColorChange(preset.iconColor);
      }
    },
    [onBackgroundColorChange, onIconColorChange]
  );

  // Handle applying a restricted style
  const handleApplyRestrictedStyle = React.useCallback(
    (style: RestrictedStyle) => {
      if (onBackgroundColorChange) {
        onBackgroundColorChange(style.backgroundColor);
      }
      if (onIconColorChange) {
        onIconColorChange(style.iconColor);
      }
    },
    [onBackgroundColorChange, onIconColorChange]
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

  // Debounce icon size changes to prevent lag while dragging slider
  const [localIconSize, setLocalIconSize] = React.useState(iconSize);
  const debouncedIconSize = useDebouncedValue(localIconSize, 300);
  const lastPropSizeRef = React.useRef(iconSize);

  // Debounce SVG icon size changes
  const [localSvgIconSize, setLocalSvgIconSize] = React.useState(svgIconSize);
  const debouncedSvgIconSize = useDebouncedValue(localSvgIconSize, 300);
  const lastPropSvgSizeRef = React.useRef(svgIconSize);

  // Update parent when debounced value changes
  React.useEffect(() => {
    if (onIconSizeChange && debouncedIconSize !== lastPropSizeRef.current) {
      lastPropSizeRef.current = debouncedIconSize;
      onIconSizeChange(debouncedIconSize);
    }
  }, [debouncedIconSize, onIconSizeChange]);

  React.useEffect(() => {
    if (
      onSvgIconSizeChange &&
      debouncedSvgIconSize !== lastPropSvgSizeRef.current
    ) {
      lastPropSvgSizeRef.current = debouncedSvgIconSize;
      onSvgIconSizeChange(debouncedSvgIconSize);
    }
  }, [debouncedSvgIconSize, onSvgIconSizeChange]);

  // Sync local state when prop changes externally
  React.useEffect(() => {
    if (iconSize !== lastPropSizeRef.current) {
      lastPropSizeRef.current = iconSize;
      setLocalIconSize(iconSize);
    }
  }, [iconSize]);

  React.useEffect(() => {
    if (svgIconSize !== lastPropSvgSizeRef.current) {
      lastPropSvgSizeRef.current = svgIconSize;
      setLocalSvgIconSize(svgIconSize);
    }
  }, [svgIconSize]);

  const handleIconSizeChange = (value: number) => {
    setLocalIconSize(value);
  };

  const handleSvgIconSizeChange = (value: number) => {
    setLocalSvgIconSize(value);
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Customization</CardTitle>
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
      <CardContent className="flex flex-1 flex-col gap-6 overflow-y-auto">
        {/* Export Preset Selection */}
        <ExportPresetSelector
          presets={effectiveExportPresets}
          selectedPresetId={selectedExportPresetId}
          onSelectPreset={selectExportPreset}
          onCreatePreset={!isRestrictionLoading && !isRestricted ? handleCreateExportPreset : undefined}
          onEditPreset={!isRestrictionLoading && !isRestricted ? handleEditExportPreset : undefined}
          onDeletePreset={!isRestrictionLoading && !isRestricted ? deleteExportPreset : undefined}
        />

        {/* SVG Warning for Custom Images */}
        {isCustomImage && hasSvgVariants && (
          <Alert
            variant="default"
            className="border-amber-500/50 bg-amber-500/10"
          >
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-xs">
              Custom images cannot be exported as SVG. SVG files in this preset
              will be skipped during export.
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        {/* Style Preset Selection - hidden in restricted mode */}
        {!isRestrictionLoading && !isRestricted && (onBackgroundColorChange || onIconColorChange) ? (
          <>
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
          </>
        ) : null}

        {/* Icon Size */}
        {onIconSizeChange && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Icon Size</h3>
            <EffectSlider
              id="icon-size"
              label={hasSvgVariants && !isCustomImage ? "PNG Size" : "Size"}
              value={localIconSize}
              onChange={handleIconSizeChange}
              min={ICON_GRID.MIN_ICON_SIZE}
              max={200}
              step={4}
              unit="px"
            />
            <p className="text-xs text-muted-foreground">
              Controls the size of the icon within the export canvas.
            </p>

            {/* SVG Icon Size - only shown when preset has SVG variants and not custom image */}
            {hasSvgVariants && !isCustomImage && onSvgIconSizeChange && (
              <>
                <EffectSlider
                  id="svg-icon-size"
                  label="SVG Size"
                  value={localSvgIconSize}
                  onChange={handleSvgIconSizeChange}
                  min={ICON_GRID.MIN_ICON_SIZE}
                  max={300}
                  step={4}
                  unit="px"
                />
                <p className="text-xs text-muted-foreground">
                  Controls the size of the icon within SVG files.
                </p>
              </>
            )}
          </div>
        )}

        <Separator />

        {/* Color Controls */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Colors</h3>
          {!isRestrictionLoading && isRestricted ? (
            /* Restricted mode - show simplified style selector */
            <RestrictedStyleSelector
              styles={allowedStyles}
              currentBackground={backgroundColor}
              currentIconColor={iconColor}
              onStyleSelect={handleApplyRestrictedStyle}
            />
          ) : (
            /* Normal mode - show full color controls */
            <>
              {onIconColorChange &&
                !selectedIconId?.startsWith("emoji-") &&
                !isCustomImage && (
                  <ColorPicker
                    id="icon-color"
                    label="Icon Color"
                    value={iconColor}
                    onChange={onIconColorChange}
                    colorType="icon"
                    isCustomSvg={selectedIconId?.startsWith("custom-svg-")}
                    paletteColors={selectedStylePreset?.colorPalette}
                  />
                )}
              {onBackgroundColorChange && (
                <BackgroundControls
                  value={backgroundColor}
                  onChange={onBackgroundColorChange}
                />
              )}
            </>
          )}
        </div>
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
