/**
 * Export modal component with preview and download functionality
 */

"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, AlertCircle, Loader2 } from "lucide-react";
import type { IconGeneratorState } from "../hooks/use-icon-generator";
import type { AppLocation } from "../types/app-location";
import type { CanvasEditorState } from "../types/canvas";
import {
  generateExportZip,
  downloadZip,
  validateExport,
} from "../utils/export-controller";
import { getRequiredExportVariants } from "../types/export";
import { isCustomImageIcon } from "../utils/locations";
import { ICON_PACKS } from "../constants/app";

export interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: IconGeneratorState;
  selectedLocations: AppLocation[];
  /** Canvas state for canvas mode exports */
  canvasState?: CanvasEditorState;
}

export function ExportModal({
  open,
  onOpenChange,
  state,
  selectedLocations,
  canvasState,
}: ExportModalProps) {
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportError, setExportError] = React.useState<string | null>(null);
  const [validation, setValidation] = React.useState<ReturnType<
    typeof validateExport
  > | null>(null);

  const isCanvasMode = state.selectedPack === ICON_PACKS.CANVAS;

  React.useEffect(() => {
    if (open) {
      // For canvas mode, validate differently
      if (isCanvasMode && canvasState) {
        if (canvasState.layers.length === 0) {
          setValidation({
            valid: false,
            errors: ["No layers in canvas. Add at least one layer to export."],
            warnings: [],
          });
        } else {
          setValidation({ valid: true, errors: [], warnings: [] });
        }
      } else {
        const validationResult = validateExport(state, selectedLocations);
        setValidation(validationResult);
      }
      setExportError(null);
    }
  }, [open, state, selectedLocations, isCanvasMode, canvasState]);

  const isCustomImage = isCustomImageIcon(state.selectedIconId);

  // For custom images or canvas mode, filter out SVG variants
  const variants = React.useMemo(() => {
    const allVariants = getRequiredExportVariants(selectedLocations);
    if (isCustomImage || isCanvasMode) {
      return allVariants.filter((v) => v.format === "png");
    }
    return allVariants;
  }, [selectedLocations, isCustomImage, isCanvasMode]);

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      const result = await generateExportZip(
        state,
        selectedLocations,
        canvasState
      );
      downloadZip(result.zipBlob, "zendesk-icons.zip");
      onOpenChange(false);
    } catch (error) {
      console.error("Export error:", error);
      setExportError(
        error instanceof Error ? error.message : "Failed to generate export"
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Icon Assets</DialogTitle>
          <DialogDescription>
            Review the export details and download your Zendesk-compliant icon
            bundle.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Export Summary */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Export Summary</h4>
            <div className="rounded-md bg-muted p-3 text-sm">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Files to export:
                  </span>
                  <span className="font-medium">
                    {variants.length} file{variants.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PNG files:</span>
                  <span className="font-medium">
                    {variants.filter((v) => v.format === "png").length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SVG files:</span>
                  <span className="font-medium">
                    {variants.filter((v) => v.format === "svg").length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* File List */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Files</h4>
            <div className="max-h-[200px] overflow-y-auto rounded-md border p-3">
              <ul className="space-y-1 text-sm font-mono">
                {variants.map((variant) => (
                  <li
                    key={variant.filename}
                    className="flex items-center justify-between"
                  >
                    <span>{variant.filename}</span>
                    <span className="text-xs text-muted-foreground">
                      {variant.width}×{variant.height}{" "}
                      {variant.format.toUpperCase()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Validation Errors */}
          {validation && validation.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Export Errors</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Validation Warnings */}
          {validation && validation.warnings.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warnings</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Export Error */}
          {exportError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Export Failed</AlertTitle>
              <AlertDescription>{exportError}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || !validation?.valid}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download ZIP
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
