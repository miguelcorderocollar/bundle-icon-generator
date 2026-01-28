"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Monitor } from "lucide-react";
import { PngPreview } from "@/src/components/PngPreview";
import { SvgPreview } from "@/src/components/SvgPreview";
import { EmptyState } from "@/src/components/EmptyState";
import { PreviewHeader } from "@/src/components/PreviewHeader";
import {
  CanvasEditor,
  LayersPanel,
  LayerProperties,
  AddLayerModal,
} from "@/src/components";
import { CanvasPngPreview } from "@/src/components/CanvasPngPreview";
import {
  calculateRequiredSvgFiles,
  hasSvgRequirements,
} from "@/src/utils/locations";
import { ICON_PACKS, PREVIEW_TYPES } from "@/src/constants/app";
import type { AppLocation } from "@/src/types/app-location";
import type { IconGeneratorState } from "@/src/hooks/use-icon-generator";
import { useCanvasEditor } from "@/src/hooks/use-canvas-editor";
import { ExportModal } from "@/src/components/ExportModal";
import { useIconMetadata } from "@/src/hooks/use-icon-metadata";

export interface PreviewPaneProps {
  selectedLocations?: AppLocation[];
  selectedIconId?: string;
  state?: IconGeneratorState;
}

export function PreviewPane({
  selectedLocations = [],
  selectedIconId,
  state,
}: PreviewPaneProps) {
  const [isExportModalOpen, setIsExportModalOpen] = React.useState(false);
  const [isAddLayerModalOpen, setIsAddLayerModalOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const iconMetadata = useIconMetadata(selectedIconId);

  // Canvas editor state
  const {
    state: canvasState,
    actions: canvasActions,
    selectedLayer,
  } = useCanvasEditor();

  // Check if mobile
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const requiredSvgFiles = React.useMemo(
    () => calculateRequiredSvgFiles(selectedLocations),
    [selectedLocations]
  );

  const isCanvasMode = state?.selectedPack === ICON_PACKS.CANVAS;
  const hasSvgFiles = hasSvgRequirements(selectedLocations);
  const hasPngFiles = true;
  const canExport = isCanvasMode
    ? canvasState.layers.length > 0
    : hasPngFiles || hasSvgFiles;
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
          {/* Canvas Editor with Tabs */}
          <Tabs defaultValue="canvas" className="flex flex-1 flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
              <TabsTrigger value="canvas">Canvas</TabsTrigger>
              <TabsTrigger value="png">PNG Preview</TabsTrigger>
            </TabsList>

            <TabsContent
              value="canvas"
              className="flex-1 overflow-hidden mt-3 min-h-0 data-[state=inactive]:hidden"
            >
              <ScrollArea className="h-full">
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
                      <LayersPanel
                        state={canvasState}
                        actions={canvasActions}
                      />

                      {/* Properties panel */}
                      <LayerProperties
                        layer={selectedLayer}
                        actions={canvasActions}
                      />
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent
              value="png"
              className="flex-1 overflow-hidden mt-3 min-h-0 data-[state=inactive]:hidden"
            >
              <ScrollArea className="h-full">
                <div className="pr-3">
                  {canvasState.layers.length > 0 ? (
                    <CanvasPngPreview canvasState={canvasState} />
                  ) : (
                    <EmptyState
                      title="No layers"
                      description="Add layers to the canvas to see a preview."
                    />
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Export Button - sticky at bottom */}
          <div className="flex-shrink-0 border-t pt-3 mt-3 space-y-2">
            <div className="text-xs text-muted-foreground">
              {canvasState.layers.length > 0
                ? "Will export 2 PNG files (no SVG in canvas mode)"
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
          iconColor={
            typeof state?.iconColor === "string" ? state.iconColor : "#ffffff"
          }
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

  // Standard mode
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Preview</CardTitle>
        <PreviewHeader iconMetadata={iconMetadata} />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden p-6">
        {/* Preview Content Area - Scrollable */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="pr-3">
            {!hasSelection ? (
              <EmptyState
                title="No icon selected"
                description="Select an icon from the search pane to see a preview here."
              />
            ) : hasPngFiles && hasSvgFiles ? (
              <Tabs defaultValue={PREVIEW_TYPES.PNG} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value={PREVIEW_TYPES.PNG}>PNG</TabsTrigger>
                  <TabsTrigger value={PREVIEW_TYPES.SVG}>SVG</TabsTrigger>
                </TabsList>

                <TabsContent value={PREVIEW_TYPES.PNG} className="mt-4">
                  <PngPreview iconId={selectedIconId} state={state} />
                </TabsContent>

                <TabsContent value={PREVIEW_TYPES.SVG} className="mt-4">
                  <SvgPreview
                    svgFiles={requiredSvgFiles}
                    iconId={selectedIconId}
                    state={state}
                  />
                </TabsContent>
              </Tabs>
            ) : hasPngFiles ? (
              <PngPreview iconId={selectedIconId} state={state} />
            ) : (
              <EmptyState
                title="Select app locations"
                description="Select app locations to see previews"
              />
            )}
          </div>
        </ScrollArea>

        {/* Export Button - Sticky at bottom */}
        <div className="flex-shrink-0 border-t pt-4 mt-auto space-y-2">
          {canExport && (
            <div className="text-xs text-muted-foreground">
              {hasPngFiles && hasSvgFiles
                ? `Will export ${2 + requiredSvgFiles.length} files`
                : hasPngFiles
                  ? "Will export 2 PNG files"
                  : `Will export ${requiredSvgFiles.length} SVG files`}
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
