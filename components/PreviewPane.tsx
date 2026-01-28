"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Monitor } from "lucide-react";
import { EmptyState } from "@/src/components/EmptyState";
import { PreviewHeader } from "@/src/components/PreviewHeader";
import { PresetPreview } from "@/src/components/PresetPreview";
import { renderPng, renderPngFromImage } from "@/src/utils/renderer";
import { getIconById } from "@/src/utils/icon-catalog";
import {
  CanvasEditor,
  LayersPanel,
  LayerProperties,
  AddLayerModal,
} from "@/src/components";
import { ICON_PACKS } from "@/src/constants/app";
import type { AppLocation } from "@/src/types/app-location";
import type { IconGeneratorState } from "@/src/hooks/use-icon-generator";
import type { CanvasEditorState } from "@/src/types/canvas";
import type { CanvasEditorActions } from "@/src/hooks/use-canvas-editor";
import { useCanvasEditor } from "@/src/hooks/use-canvas-editor";
import { usePresets } from "@/src/hooks/use-presets";
import { ExportModal } from "@/src/components/ExportModal";
import { useIconMetadata } from "@/src/hooks/use-icon-metadata";
import { isCustomImageIcon } from "@/src/utils/locations";
import { useRestriction } from "@/src/contexts/RestrictionContext";
import type { ColorPaletteEntry } from "@/src/types/preset";

export interface PreviewPaneProps {
  selectedLocations?: AppLocation[];
  selectedIconId?: string;
  state?: IconGeneratorState;
  /** Canvas state passed from parent (for shared state with CanvasControlsPane) */
  canvasState?: CanvasEditorState;
  /** Canvas actions passed from parent */
  canvasActions?: CanvasEditorActions;
}

export function PreviewPane({
  selectedLocations = [],
  selectedIconId,
  state,
  canvasState: externalCanvasState,
  canvasActions: externalCanvasActions,
}: PreviewPaneProps) {
  const [isExportModalOpen, setIsExportModalOpen] = React.useState(false);
  const [isAddLayerModalOpen, setIsAddLayerModalOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [editPreviewUrl, setEditPreviewUrl] = React.useState<string | null>(
    null
  );
  const iconMetadata = useIconMetadata(selectedIconId);

  // Presets hook
  const { exportPresets, selectedExportPresetId, selectedStylePreset } =
    usePresets();

  // Restriction mode
  const { isRestricted, allowedStyles, allowedExportPresets } =
    useRestriction();

  // Determine the effective export presets list and selected preset
  const effectiveExportPresets = allowedExportPresets ?? exportPresets;
  const actualSelectedExportPreset = React.useMemo(() => {
    return effectiveExportPresets.find((p) => p.id === selectedExportPresetId);
  }, [effectiveExportPresets, selectedExportPresetId]);

  // Find the currently active restricted style based on background color
  const activeRestrictedStyle = React.useMemo(() => {
    if (!isRestricted || allowedStyles.length === 0 || !state) {
      return null;
    }

    // Match by background color
    const currentBg = state.backgroundColor;
    const matchedStyle = allowedStyles.find((style) => {
      if (
        typeof currentBg === "string" &&
        typeof style.backgroundColor === "string"
      ) {
        return currentBg.toLowerCase() === style.backgroundColor.toLowerCase();
      }
      if (
        typeof currentBg === "object" &&
        typeof style.backgroundColor === "object"
      ) {
        return (
          JSON.stringify(currentBg) === JSON.stringify(style.backgroundColor)
        );
      }
      return false;
    });

    return matchedStyle || allowedStyles[0];
  }, [isRestricted, allowedStyles, state]);

  // Compute color palette for canvas layers in restricted mode
  // Uses ONLY the currently active style's icon color + accent colors
  const restrictedColorPalette = React.useMemo(():
    | ColorPaletteEntry[]
    | null => {
    if (!isRestricted || !activeRestrictedStyle) {
      return null;
    }

    const palette: ColorPaletteEntry[] = [];

    // Add the main icon color
    palette.push({
      id: "active-style-icon",
      name: "Primary",
      color: activeRestrictedStyle.iconColor,
    });

    // Add accent colors from this style's color palette
    if (activeRestrictedStyle.colorPalette) {
      activeRestrictedStyle.colorPalette.forEach((accentColor, colorIndex) => {
        palette.push({
          id: `active-style-accent-${colorIndex}`,
          name: accentColor.name,
          color: accentColor.color,
        });
      });
    }

    return palette;
  }, [isRestricted, activeRestrictedStyle]);

  // Canvas editor state - use external if provided, otherwise create internal
  const internalCanvas = useCanvasEditor();
  const canvasState = externalCanvasState ?? internalCanvas.state;
  const canvasActions = externalCanvasActions ?? internalCanvas.actions;
  const selectedLayer = canvasState.layers.find(
    (l) => l.id === canvasState.selectedLayerId
  );

  // Check if mobile
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Generate edit preview (single large icon)
  React.useEffect(() => {
    if (!selectedIconId || !state) {
      setEditPreviewUrl(null);
      return;
    }

    let cancelled = false;
    let currentUrl: string | null = null;

    async function generateEditPreview() {
      try {
        if (!selectedIconId || !state) return;

        const isCustomImg = isCustomImageIcon(selectedIconId);

        if (isCustomImg) {
          const imageDataUrl =
            typeof window !== "undefined"
              ? sessionStorage.getItem(selectedIconId)
              : null;
          if (!imageDataUrl || cancelled) return;

          const blob = await renderPngFromImage({
            imageDataUrl,
            backgroundColor: state.backgroundColor,
            size: state.iconSize,
            width: 512,
            height: 512,
          });
          if (cancelled) return;
          currentUrl = URL.createObjectURL(blob);
          setEditPreviewUrl(currentUrl);
        } else {
          const icon = await getIconById(selectedIconId);
          if (!icon || cancelled) return;

          const blob = await renderPng({
            icon,
            backgroundColor: state.backgroundColor,
            iconColor: state.iconColor,
            size: state.iconSize,
            width: 512,
            height: 512,
          });
          if (cancelled) return;
          currentUrl = URL.createObjectURL(blob);
          setEditPreviewUrl(currentUrl);
        }
      } catch (error) {
        console.error("Error generating edit preview:", error);
      }
    }

    generateEditPreview();

    return () => {
      cancelled = true;
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [selectedIconId, state]);

  const isCanvasMode = state?.selectedPack === ICON_PACKS.CANVAS;
  const isCustomImage = isCustomImageIcon(selectedIconId);

  // Memoize resolved icon color for AddLayerModal to ensure consistent color
  const currentIconColor = React.useMemo(() => {
    return (
      selectedStylePreset?.iconColor ??
      (typeof state?.iconColor === "string" ? state.iconColor : "#ffffff")
    );
  }, [selectedStylePreset?.iconColor, state?.iconColor]);

  // Calculate export info from selected preset
  const exportInfo = React.useMemo(() => {
    if (!actualSelectedExportPreset) {
      return { total: 0, skipped: 0, exportable: 0 };
    }

    let skipped = 0;
    for (const v of actualSelectedExportPreset.variants) {
      if (isCanvasMode && (v.format === "svg" || v.format === "ico")) {
        skipped++;
      } else if (isCustomImage && (v.format === "svg" || v.format === "ico")) {
        skipped++;
      }
    }

    return {
      total: actualSelectedExportPreset.variants.length,
      skipped,
      exportable: actualSelectedExportPreset.variants.length - skipped,
    };
  }, [actualSelectedExportPreset, isCanvasMode, isCustomImage]);

  const canExport = isCanvasMode
    ? canvasState.layers.length > 0 && exportInfo.exportable > 0
    : exportInfo.exportable > 0;
  const hasSelection = isCanvasMode
    ? canvasState.layers.length > 0
    : selectedIconId !== undefined;

  // Sync background color from main state to canvas state
  React.useEffect(() => {
    if (isCanvasMode && state?.backgroundColor) {
      canvasActions.setBackgroundColor(state.backgroundColor);
    }
  }, [isCanvasMode, state?.backgroundColor, canvasActions]);

  // Canvas mode
  if (isCanvasMode) {
    // Mobile warning
    if (isMobile) {
      return (
        <Card className="flex h-full flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle>Canvas Editor</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col items-center justify-center p-6">
            <Monitor className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Desktop Recommended</h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              The Canvas Editor works best on larger screens. Please use a
              desktop or tablet for the best experience.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="flex h-full flex-col">
        <CardHeader className="flex-shrink-0 pb-2">
          <CardTitle>Canvas Editor</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col overflow-hidden p-4 pt-0">
          {/* Canvas Editor - no tabs, just the editor */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="pr-3 space-y-4">
              {/* Two column layout: Canvas + Controls */}
              <div className="flex gap-4">
                {/* Left: Canvas preview */}
                <div className="flex-shrink-0">
                  <CanvasEditor
                    state={canvasState}
                    actions={canvasActions}
                    onAddLayerClick={() => setIsAddLayerModalOpen(true)}
                  />
                </div>

                {/* Right: Layers + Properties */}
                <div className="flex-1 min-w-0 space-y-3">
                  {/* Layers panel */}
                  <LayersPanel state={canvasState} actions={canvasActions} />

                  {/* Properties panel */}
                  <LayerProperties
                    layer={selectedLayer}
                    actions={canvasActions}
                    paletteColors={
                      restrictedColorPalette ??
                      selectedStylePreset?.colorPalette
                    }
                    restrictedColorMode={isRestricted}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Export Button - sticky at bottom */}
          <div className="flex-shrink-0 border-t pt-3 mt-3 space-y-2">
            <div className="text-xs text-muted-foreground">
              {canvasState.layers.length > 0
                ? `Will export ${exportInfo.exportable} file${exportInfo.exportable !== 1 ? "s" : ""}${exportInfo.skipped > 0 ? ` (${exportInfo.skipped} skipped)` : ""}`
                : "Add layers to enable export"}
            </div>
            <Button
              className="w-full"
              size="lg"
              disabled={!canExport}
              onClick={() => setIsExportModalOpen(true)}
            >
              <Download className="mr-2 size-4" />
              Export ZIP
            </Button>
          </div>
        </CardContent>

        {/* Add Layer Modal */}
        <AddLayerModal
          open={isAddLayerModalOpen}
          onOpenChange={setIsAddLayerModalOpen}
          actions={canvasActions}
          iconColor={currentIconColor}
        />

        {/* Export Modal */}
        {state && (
          <ExportModal
            open={isExportModalOpen}
            onOpenChange={setIsExportModalOpen}
            state={state}
            selectedLocations={selectedLocations}
            canvasState={canvasState}
          />
        )}
      </Card>
    );
  }

  // Standard mode with Edit/Preview tabs
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-shrink-0 pb-2">
        <CardTitle>Preview</CardTitle>
        <PreviewHeader iconMetadata={iconMetadata} />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col overflow-hidden p-4 pt-0">
        <Tabs defaultValue="edit" className="flex flex-1 flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {/* Edit Tab - Single large icon preview for working */}
          <TabsContent
            value="edit"
            className="flex-1 overflow-hidden mt-3 min-h-0 data-[state=inactive]:hidden"
          >
            {!hasSelection ? (
              <EmptyState
                title="No icon selected"
                description="Select an icon from the search pane to see a preview here."
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="flex aspect-square w-full max-w-[320px] items-center justify-center rounded-lg border-2 border-dashed bg-muted/20 p-2">
                  {editPreviewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={editPreviewUrl}
                      alt="Icon preview"
                      className="max-w-full max-h-full rounded"
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Loading...
                    </span>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Preview Tab - All export variants */}
          <TabsContent
            value="preview"
            className="flex-1 overflow-hidden mt-3 min-h-0 data-[state=inactive]:hidden"
          >
            {!hasSelection ? (
              <EmptyState
                title="No icon selected"
                description="Select an icon from the search pane to see a preview here."
              />
            ) : actualSelectedExportPreset ? (
              <PresetPreview
                preset={actualSelectedExportPreset}
                iconId={selectedIconId}
                state={state}
                isCanvasMode={false}
              />
            ) : (
              <EmptyState
                title="No preset selected"
                description="Select an export preset to see previews."
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Export Button - Sticky at bottom */}
        <div className="flex-shrink-0 border-t pt-3 mt-3 space-y-2">
          {canExport && hasSelection && (
            <div className="text-xs text-muted-foreground">
              Will export {exportInfo.exportable} file
              {exportInfo.exportable !== 1 ? "s" : ""}
              {exportInfo.skipped > 0 && ` (${exportInfo.skipped} skipped)`}
            </div>
          )}
          <Button
            className="w-full"
            size="lg"
            disabled={!canExport || !hasSelection}
            onClick={() => setIsExportModalOpen(true)}
          >
            <Download className="mr-2 size-4" />
            Export ZIP
          </Button>
        </div>
      </CardContent>
      {state && (
        <ExportModal
          open={isExportModalOpen}
          onOpenChange={setIsExportModalOpen}
          state={state}
          selectedLocations={selectedLocations}
        />
      )}
    </Card>
  );
}
