"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download } from "lucide-react";
import { PngPreview } from "@/src/components/PngPreview";
import { SvgPreview } from "@/src/components/SvgPreview";
import { EmptyState } from "@/src/components/EmptyState";
import { PreviewHeader } from "@/src/components/PreviewHeader";
import { calculateRequiredSvgFiles, hasSvgRequirements } from "@/src/utils/locations";
import { PREVIEW_TYPES } from "@/src/constants/app";
import type { AppLocation } from "@/src/types/app-location";
import type { IconGeneratorState } from "@/src/hooks/use-icon-generator";
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
  const iconMetadata = useIconMetadata(selectedIconId);

  const requiredSvgFiles = React.useMemo(
    () => calculateRequiredSvgFiles(selectedLocations),
    [selectedLocations]
  );

  const hasSvgFiles = hasSvgRequirements(selectedLocations);
  const hasPngFiles = true; // PNG files are always generated
  const canExport = hasPngFiles || hasSvgFiles;
  const hasSelection = selectedIconId !== undefined;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Preview</CardTitle>
        <PreviewHeader iconMetadata={iconMetadata} />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden p-6">
        {/* Preview Content Area - Scrollable */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {!hasSelection ? (
            <EmptyState
              title="No icon selected"
              description="Select an icon from the search pane to see a preview here."
            />
          ) : hasPngFiles && hasSvgFiles ? (
            // Show tabs if both PNG and SVG are available
            <Tabs defaultValue={PREVIEW_TYPES.PNG} className="flex h-full flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value={PREVIEW_TYPES.PNG}>PNG</TabsTrigger>
                <TabsTrigger value={PREVIEW_TYPES.SVG}>SVG</TabsTrigger>
              </TabsList>

              <TabsContent
                value={PREVIEW_TYPES.PNG}
                className="mt-4 flex-1 overflow-hidden data-[state=active]:flex"
              >
                <PngPreview iconId={selectedIconId} state={state} />
              </TabsContent>

              <TabsContent
                value={PREVIEW_TYPES.SVG}
                className="mt-4 flex-1 overflow-hidden data-[state=active]:flex"
              >
                <SvgPreview svgFiles={requiredSvgFiles} iconId={selectedIconId} state={state} />
              </TabsContent>
            </Tabs>
          ) : hasPngFiles ? (
            // Show only PNG preview if no SVG files needed
            <PngPreview iconId={selectedIconId} state={state} />
          ) : (
            // No previews available
            <EmptyState
              title="Select app locations"
              description="Select app locations to see previews"
            />
          )}
        </div>

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
