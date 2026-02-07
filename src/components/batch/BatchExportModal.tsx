"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  AlertTriangle,
} from "lucide-react";

/**
 * Simple progress bar component
 */
function ProgressBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <div
      className={`h-2 w-full bg-muted rounded-full overflow-hidden ${className || ""}`}
    >
      <div
        className="h-full bg-primary transition-all duration-300 ease-in-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
import type {
  BatchExportProgress,
  BatchValidationResult,
} from "@/src/types/batch";

export interface BatchExportModalProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Called when dialog should close */
  onOpenChange: (open: boolean) => void;
  /** Current export progress */
  progress: BatchExportProgress | null;
  /** Validation result before export */
  validationResult: BatchValidationResult | null;
  /** Warnings from export */
  warnings: string[];
  /** Called to start export */
  onExport: () => void;
  /** Called to download the exported ZIP */
  onDownload: () => void;
  /** Whether download is available */
  canDownload: boolean;
}

export function BatchExportModal({
  open,
  onOpenChange,
  progress,
  validationResult,
  warnings,
  onExport,
  onDownload,
  canDownload,
}: BatchExportModalProps) {
  const isExporting =
    progress?.phase === "validating" ||
    progress?.phase === "rendering" ||
    progress?.phase === "packaging";
  const isComplete = progress?.phase === "complete";
  const hasError = progress?.phase === "error";
  const hasValidationErrors = validationResult && !validationResult.valid;

  // Calculate progress percentage
  const progressPercent = React.useMemo(() => {
    if (!progress) return 0;
    if (progress.phase === "validating") return 5;
    if (progress.phase === "packaging") return 95;
    if (progress.phase === "complete") return 100;
    if (progress.phase === "error") return 0;
    // Rendering phase
    if (progress.totalItems === 0) return 10;
    return 10 + (progress.currentIndex / progress.totalItems) * 85;
  }, [progress]);

  const getPhaseLabel = () => {
    if (!progress) return "";
    switch (progress.phase) {
      case "validating":
        return "Validating configurations...";
      case "rendering":
        return `Rendering ${progress.currentItemName || `project ${progress.currentIndex + 1}`}...`;
      case "packaging":
        return "Creating ZIP file...";
      case "complete":
        return "Export complete!";
      case "error":
        return "Export failed";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isComplete
              ? "Export Complete"
              : hasError
                ? "Export Failed"
                : "Export Batch"}
          </DialogTitle>
          {!isComplete && !hasError && (
            <DialogDescription>
              Export all configured projects as a single ZIP file with separate
              folders for each project.
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Validation errors */}
          {hasValidationErrors && !isExporting && !isComplete && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>
                <div className="space-y-2">
                  {validationResult.globalErrors.map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                  {validationResult.errors.size > 0 && (
                    <ScrollArea className="max-h-[150px]">
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {Array.from(validationResult.errors.entries()).map(
                          ([id, errors]) => (
                            <li key={id}>
                              {errors.map((err, i) => (
                                <span key={i}>
                                  {err}
                                  {i < errors.length - 1 ? ", " : ""}
                                </span>
                              ))}
                            </li>
                          )
                        )}
                      </ul>
                    </ScrollArea>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Export progress */}
          {isExporting && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span className="text-sm">{getPhaseLabel()}</span>
              </div>
              <ProgressBar value={progressPercent} />
              <p className="text-xs text-muted-foreground text-center">
                {progress?.currentIndex} / {progress?.totalItems} projects
              </p>
            </div>
          )}

          {/* Success state */}
          {isComplete && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-2 py-4">
                <CheckCircle className="size-12 text-green-500" />
                <p className="text-lg font-medium">Export Complete!</p>
                <p className="text-sm text-muted-foreground">
                  {progress?.totalItems} project
                  {progress?.totalItems !== 1 ? "s" : ""} exported successfully
                </p>
              </div>

              {warnings.length > 0 && (
                <Alert className="border-yellow-500/50 bg-yellow-500/10">
                  <AlertTriangle className="size-4 text-yellow-600" />
                  <AlertDescription>
                    <p className="font-medium mb-1">Warnings:</p>
                    <ScrollArea className="max-h-[100px]">
                      <ul className="list-disc list-inside text-sm space-y-0.5">
                        {warnings.map((warning, i) => (
                          <li key={i}>{warning}</li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Error state */}
          {hasError && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>
                {progress?.error || "An error occurred during export"}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          {!isExporting && !isComplete && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={onExport}
                disabled={hasValidationErrors ?? false}
              >
                <Download className="size-4 mr-2" />
                Export
              </Button>
            </>
          )}

          {isExporting && (
            <Button variant="outline" disabled>
              Exporting...
            </Button>
          )}

          {(isComplete || hasError) && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {canDownload && (
                <Button onClick={onDownload}>
                  <Download className="size-4 mr-2" />
                  Download ZIP
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
