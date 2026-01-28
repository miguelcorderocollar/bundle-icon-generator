/**
 * Preset import/export panel component
 */

import * as React from "react";
import {
  Download,
  Upload,
  Trash2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { PresetImportResult } from "@/src/types/preset";

export interface PresetImportExportProps {
  hasCustomPresets: boolean;
  onExport: () => void;
  onImport: (file: File) => Promise<PresetImportResult>;
  onClearAll: () => void;
  className?: string;
}

export function PresetImportExport({
  hasCustomPresets,
  onExport,
  onImport,
  onClearAll,
  className,
}: PresetImportExportProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] =
    React.useState<PresetImportResult | null>(null);
  const [isImporting, setIsImporting] = React.useState(false);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const result = await onImport(file);
      setImportResult(result);
    } catch (error) {
      setImportResult({
        success: false,
        exportPresetsImported: 0,
        stylePresetsImported: 0,
        error: error instanceof Error ? error.message : "Import failed",
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">Preset Management</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Export, import, or clear your custom presets
          </p>
        </div>

        <Separator />

        {/* Import result alert */}
        {importResult && (
          <Alert variant={importResult.success ? "default" : "destructive"}>
            {importResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {importResult.success ? "Import Successful" : "Import Failed"}
            </AlertTitle>
            <AlertDescription>
              {importResult.success ? (
                <>
                  Imported {importResult.exportPresetsImported} export preset
                  {importResult.exportPresetsImported !== 1 ? "s" : ""} and{" "}
                  {importResult.stylePresetsImported} style preset
                  {importResult.stylePresetsImported !== 1 ? "s" : ""}.
                  {importResult.warnings &&
                    importResult.warnings.length > 0 && (
                      <ul className="mt-2 list-disc list-inside text-xs">
                        {importResult.warnings.map((warning, i) => (
                          <li key={i}>{warning}</li>
                        ))}
                      </ul>
                    )}
                </>
              ) : (
                <>{importResult.error}</>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Export button */}
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={onExport}
            disabled={!hasCustomPresets}
            className="w-full justify-start"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Custom Presets
          </Button>
          {!hasCustomPresets && (
            <p className="text-xs text-muted-foreground">
              No custom presets to export
            </p>
          )}
        </div>

        {/* Import button */}
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={handleImportClick}
            disabled={isImporting}
            className="w-full justify-start"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? "Importing..." : "Import Presets"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Import presets from a JSON file
          </p>
        </div>

        <Separator />

        {/* Clear all button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={!hasCustomPresets}
              className="w-full justify-start"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Custom Presets
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear all custom presets?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all your custom export and style
                presets. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onClearAll}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Clear All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
