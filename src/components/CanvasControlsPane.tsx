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
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Library,
  Layers,
  Smile,
  Upload,
  Image as ImageIcon,
  PenTool,
  Settings,
  Palette,
  Sparkles,
} from "lucide-react";
import { BackgroundControls } from "./BackgroundControls";
import { StylePresetSelector } from "./StylePresetSelector";
import { StylePresetEditor } from "./StylePresetEditor";
import { PresetSettingsModal } from "./PresetSettingsModal";
import { usePresets } from "@/src/hooks/use-presets";
import { ICON_PACKS, type IconPack } from "@/src/constants/app";
import type { BackgroundValue } from "@/src/utils/gradients";
import type { StylePreset } from "@/src/types/preset";
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
    isLoading: isRestrictionLoading,
  } = useRestriction();

  // Presets hook
  const {
    exportPresets,
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
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent/55 p-2 text-accent-foreground">
              <Layers className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold">Source</div>
            </div>
          </div>
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
        </div>

        <Accordion
          type="single"
          collapsible
          value={openSection}
          onValueChange={setOpenSection}
          className="space-y-3"
        >
          {!isRestrictionLoading && !isRestricted ? (
            <AccordionItem value="style">
              <AccordionTrigger>
                <AccordionSectionHeader icon={Sparkles} title="Style Presets" />
              </AccordionTrigger>
              <AccordionContent>
                <StylePresetSelector
                  presets={stylePresets}
                  selectedPresetId={selectedStylePresetId}
                  onSelectPreset={selectStylePreset}
                  onApplyPreset={handleApplyStylePreset}
                  onCreatePreset={handleCreateStylePreset}
                  onEditPreset={handleEditStylePreset}
                  onDeletePreset={deleteStylePreset}
                />
              </AccordionContent>
            </AccordionItem>
          ) : null}

          <AccordionItem value="colors">
            <AccordionTrigger>
              <AccordionSectionHeader icon={Palette} title="Canvas Colors" />
            </AccordionTrigger>
            <AccordionContent>
              {!isRestrictionLoading && isRestricted ? (
                <RestrictedStyleSelector
                  styles={allowedStyles}
                  currentBackground={backgroundColor}
                  currentIconColor="#ffffff"
                  onStyleSelect={handleApplyRestrictedStyle}
                  showColorPalette={true}
                  onColorSelect={onApplyIconColor}
                />
              ) : (
                <BackgroundControls
                  value={backgroundColor}
                  onChange={onBackgroundColorChange}
                />
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
