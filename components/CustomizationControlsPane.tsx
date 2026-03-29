"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Settings,
  Palette,
  SlidersHorizontal,
  SquareRoundCorner,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ColorPicker } from "@/src/components/ColorPicker";
import { EffectSlider } from "@/src/components/EffectSlider";
import { BackgroundControls } from "@/src/components/BackgroundControls";
import { StylePresetEditor } from "@/src/components/StylePresetEditor";
import { PresetSettingsModal } from "@/src/components/PresetSettingsModal";
import { StylePresetSelector } from "@/src/components/StylePresetSelector";
import {
  DEFAULT_APPEARANCE,
  DEFAULT_COLORS,
  ICON_GRID,
} from "@/src/constants/app";
import { useDebouncedValue } from "@/src/hooks/use-debounced-value";
import { usePresets } from "@/src/hooks/use-presets";
import type { BackgroundValue } from "@/src/utils/gradients";
import type { StylePreset } from "@/src/types/preset";
import { isCustomImageIcon } from "@/src/utils/locations";
import { useRestriction } from "@/src/contexts/RestrictionContext";
import { RestrictedStyleSelector } from "@/src/components/RestrictedStyleSelector";
import type { RestrictedStyle } from "@/src/types/restriction";
import { CustomImageColorOverride } from "@/src/components/CustomImageColorOverride";

export interface CustomizationControlsPaneProps {
  backgroundColor?: BackgroundValue;
  onBackgroundColorChange?: (color: BackgroundValue) => void;
  iconColor?: string;
  onIconColorChange?: (color: string) => void;
  cornerRadius?: number;
  onCornerRadiusChange?: (radius: number) => void;
  borderEnabled?: boolean;
  onBorderEnabledChange?: (enabled: boolean) => void;
  borderColor?: string;
  onBorderColorChange?: (color: string) => void;
  borderWidth?: number;
  onBorderWidthChange?: (width: number) => void;
  iconSize?: number;
  onIconSizeChange?: (size: number) => void;
  svgIconSize?: number;
  onSvgIconSizeChange?: (size: number) => void;
  selectedIconId?: string;
  /** Callback when custom image color override changes */
  onCustomImageColorOverride?: (overrideColor: string | null) => void;
  /** Key to trigger re-reading color analysis (incremented when analysis completes) */
  colorAnalysisKey?: number;
}

export function CustomizationControlsPane({
  backgroundColor = DEFAULT_COLORS.BACKGROUND,
  onBackgroundColorChange,
  iconColor = DEFAULT_COLORS.ICON,
  onIconColorChange,
  cornerRadius = DEFAULT_APPEARANCE.CORNER_RADIUS,
  onCornerRadiusChange,
  borderEnabled = DEFAULT_APPEARANCE.BORDER_ENABLED,
  onBorderEnabledChange,
  borderColor = DEFAULT_APPEARANCE.BORDER_COLOR,
  onBorderColorChange,
  borderWidth = DEFAULT_APPEARANCE.BORDER_WIDTH,
  onBorderWidthChange,
  iconSize = ICON_GRID.DEFAULT_ICON_SIZE,
  onIconSizeChange,
  svgIconSize = ICON_GRID.DEFAULT_ICON_SIZE,
  onSvgIconSizeChange,
  selectedIconId,
  onCustomImageColorOverride,
  colorAnalysisKey,
}: CustomizationControlsPaneProps) {
  // Restriction mode
  const {
    isRestricted,
    allowedStyles,
    allowedExportPresets,
    isLoading: isRestrictionLoading,
  } = useRestriction();

  // Presets hook
  const {
    exportPresets,
    selectedExportPresetId,
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

  // Style preset editor state
  const [showStyleEditor, setShowStyleEditor] = React.useState(false);
  const [editingStylePreset, setEditingStylePreset] = React.useState<
    StylePreset | undefined
  >();
  const [openSection, setOpenSection] = React.useState<string | undefined>(
    "colors"
  );

  // Check if current icon is a custom image
  const isCustomImage = isCustomImageIcon(selectedIconId);

  // Check whether the currently active export preset includes SVG variants
  const hasSvgVariants = React.useMemo(() => {
    const effectiveExportPresets = allowedExportPresets ?? exportPresets;
    const activePreset =
      effectiveExportPresets.find(
        (preset) => preset.id === selectedExportPresetId
      ) ?? effectiveExportPresets[0];

    if (!activePreset) {
      return false;
    }

    return activePreset.variants.some((variant) => variant.format === "svg");
  }, [allowedExportPresets, exportPresets, selectedExportPresetId]);

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
      if (onCornerRadiusChange) {
        onCornerRadiusChange(preset.cornerRadius);
      }
      if (onBorderEnabledChange) {
        onBorderEnabledChange(preset.borderEnabled);
      }
      if (onBorderColorChange) {
        onBorderColorChange(preset.borderColor);
      }
      if (onBorderWidthChange) {
        onBorderWidthChange(preset.borderWidth);
      }
    },
    [
      onBackgroundColorChange,
      onIconColorChange,
      onCornerRadiusChange,
      onBorderEnabledChange,
      onBorderColorChange,
      onBorderWidthChange,
    ]
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
      if (selectedStylePresetId === editingStylePreset.id) {
        handleApplyStylePreset({
          ...editingStylePreset,
          ...preset,
        });
      }
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
      <CardContent className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {!isRestrictionLoading &&
        !isRestricted &&
        (onBackgroundColorChange || onIconColorChange) ? (
          <div className="pb-1">
            <StylePresetSelector
              presets={stylePresets}
              selectedPresetId={selectedStylePresetId}
              onSelectPreset={selectStylePreset}
              onApplyPreset={handleApplyStylePreset}
              onCreatePreset={handleCreateStylePreset}
              onEditPreset={handleEditStylePreset}
              onDeletePreset={deleteStylePreset}
            />
          </div>
        ) : null}

        <Accordion
          type="single"
          collapsible
          value={openSection}
          onValueChange={setOpenSection}
          className="space-y-3"
        >
          {onIconSizeChange ? (
            <AccordionItem value="size">
              <AccordionTrigger>
                <AccordionSectionHeader
                  icon={SlidersHorizontal}
                  title="Icon Size"
                />
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <EffectSlider
                    id="icon-size"
                    label={
                      hasSvgVariants && !isCustomImage ? "PNG Size" : "Size"
                    }
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

                  {hasSvgVariants && !isCustomImage && onSvgIconSizeChange ? (
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
                  ) : null}
                </div>
              </AccordionContent>
            </AccordionItem>
          ) : null}

          {!isRestrictionLoading &&
          !isRestricted &&
          onCornerRadiusChange &&
          onBorderEnabledChange &&
          onBorderWidthChange ? (
            <AccordionItem value="shape">
              <AccordionTrigger>
                <AccordionSectionHeader
                  icon={SquareRoundCorner}
                  title="Frame Shape"
                />
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-5">
                  <EffectSlider
                    id="corner-radius"
                    label="Corner Radius"
                    value={cornerRadius}
                    onChange={onCornerRadiusChange}
                    min={0}
                    max={100}
                    step={1}
                    unit="%"
                  />

                  <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
                    <label
                      htmlFor="border-enabled"
                      className="text-sm font-medium"
                    >
                      Border
                    </label>
                    <Switch
                      id="border-enabled"
                      checked={borderEnabled}
                      onCheckedChange={onBorderEnabledChange}
                    />
                  </div>

                  {borderEnabled ? (
                    <EffectSlider
                      id="border-width"
                      label="Border Width"
                      value={borderWidth}
                      onChange={onBorderWidthChange}
                      min={0}
                      max={40}
                      step={1}
                      unit="px"
                    />
                  ) : null}

                  {hasSvgVariants ? (
                    <p className="text-xs text-muted-foreground">
                      Transparent location SVG exports ignore background shape
                      and border.
                    </p>
                  ) : null}
                </div>
              </AccordionContent>
            </AccordionItem>
          ) : null}

          <AccordionItem value="colors">
            <AccordionTrigger>
              <AccordionSectionHeader icon={Palette} title="Colors" />
            </AccordionTrigger>
            <AccordionContent>
              {!isRestrictionLoading && isRestricted ? (
                <RestrictedStyleSelector
                  styles={allowedStyles}
                  currentBackground={backgroundColor}
                  currentIconColor={iconColor}
                  onStyleSelect={handleApplyRestrictedStyle}
                />
              ) : (
                <div className="space-y-5">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Palette className="h-4 w-4 text-muted-foreground" />
                      Foreground
                    </div>
                    {onIconColorChange &&
                    !selectedIconId?.startsWith("emoji-") &&
                    !isCustomImage ? (
                      <ColorPicker
                        id="icon-color"
                        label="Icon Color"
                        value={iconColor}
                        onChange={onIconColorChange}
                        colorType="icon"
                        isCustomSvg={selectedIconId?.startsWith("custom-svg-")}
                        paletteColors={selectedStylePreset?.colorPalette}
                      />
                    ) : null}
                    {borderEnabled && onBorderColorChange ? (
                      <ColorPicker
                        id="border-color"
                        label="Border Color"
                        value={borderColor}
                        onChange={onBorderColorChange}
                        colorType="icon"
                        paletteColors={selectedStylePreset?.colorPalette}
                      />
                    ) : null}
                  </div>

                  {isCustomImage && selectedIconId ? (
                    <CustomImageColorOverride
                      imageId={selectedIconId}
                      onOverrideChange={onCustomImageColorOverride}
                      analysisKey={colorAnalysisKey}
                    />
                  ) : null}
                  {onBackgroundColorChange ? (
                    <div className="space-y-4 border-t border-border/60 pt-4">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Palette className="h-4 w-4 text-muted-foreground" />
                        Surface
                      </div>
                      <BackgroundControls
                        value={backgroundColor}
                        onChange={onBackgroundColorChange}
                      />
                    </div>
                  ) : null}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>

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

interface AccordionSectionHeaderProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}

function AccordionSectionHeader({
  icon: Icon,
  title,
}: AccordionSectionHeaderProps) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="rounded-lg bg-accent/55 p-2 text-accent-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold">{title}</div>
      </div>
    </div>
  );
}
