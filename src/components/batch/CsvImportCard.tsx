"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  BatchIconConfig,
  CsvParseResult,
  UploadedAsset,
} from "@/src/types/batch";
import {
  parseBatchCsv,
  generateExampleCsv,
  generateOptionsCsv,
  downloadCsvFile,
} from "@/src/utils/batch-csv";

export interface CsvImportCardProps {
  /** Uploaded assets for validation */
  uploadedAssets: UploadedAsset[];
  /** Called when CSV is successfully parsed */
  onImport: (configs: BatchIconConfig[]) => void;
  className?: string;
}

export function CsvImportCard({
  uploadedAssets,
  onImport,
  className,
}: CsvImportCardProps) {
  const [parseResult, setParseResult] = React.useState<CsvParseResult | null>(
    null
  );
  const [isProcessing, setIsProcessing] = React.useState(false);

  const onDrop = React.useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setIsProcessing(true);
      setParseResult(null);

      try {
        const content = await file.text();
        const result = parseBatchCsv(content, uploadedAssets);
        setParseResult(result);

        if (result.success && result.configs.length > 0) {
          onImport(result.configs);
        }
      } catch (err) {
        console.error("Failed to parse CSV:", err);
        setParseResult({
          success: false,
          configs: [],
          errors: [
            {
              row: 0,
              column: "general",
              message:
                err instanceof Error ? err.message : "Failed to parse CSV",
            },
          ],
          warnings: [],
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [uploadedAssets, onImport]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "text/plain": [".csv", ".txt"],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleDownloadExample = () => {
    const csv = generateExampleCsv();
    downloadCsvFile(csv, "batch-example.csv");
  };

  const handleDownloadOptions = () => {
    const csv = generateOptionsCsv();
    downloadCsvFile(csv, "batch-options.csv");
  };

  const handleClearResult = () => {
    setParseResult(null);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Step 2: Configure Projects</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <div
            {...getRootProps()}
            className={cn(
              "inline-flex",
              isProcessing && "opacity-50 pointer-events-none"
            )}
          >
            <input {...getInputProps()} />
            <Button
              type="button"
              variant={isDragActive ? "default" : "outline"}
              size="sm"
              className="gap-2"
            >
              <Upload className="size-4" />
              {isProcessing ? "Processing..." : "Upload CSV"}
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadExample}
            className="gap-2"
          >
            <Download className="size-4" />
            Example CSV
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadOptions}
            className="gap-2"
          >
            <FileSpreadsheet className="size-4" />
            Options CSV
          </Button>
        </div>

        {/* Parse result feedback */}
        {parseResult && (
          <div className="space-y-2">
            {parseResult.success ? (
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle className="size-4 text-green-500" />
                <AlertDescription className="flex items-center justify-between">
                  <span>
                    Successfully imported {parseResult.configs.length} project
                    {parseResult.configs.length !== 1 ? "s" : ""}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearResult}
                    className="h-6 text-xs"
                  >
                    Dismiss
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">
                      Import failed with {parseResult.errors.length} error
                      {parseResult.errors.length !== 1 ? "s" : ""}:
                    </p>
                    <ul className="list-disc list-inside text-sm space-y-0.5">
                      {parseResult.errors.slice(0, 5).map((error, i) => (
                        <li key={i}>
                          {error.row > 0 && `Row ${error.row}: `}
                          {error.message}
                        </li>
                      ))}
                      {parseResult.errors.length > 5 && (
                        <li>
                          ...and {parseResult.errors.length - 5} more errors
                        </li>
                      )}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Warnings */}
            {parseResult.warnings.length > 0 && (
              <Alert className="border-yellow-500/50 bg-yellow-500/10">
                <AlertTriangle className="size-4 text-yellow-600" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Warnings:</p>
                    <ul className="list-disc list-inside text-sm space-y-0.5">
                      {parseResult.warnings.slice(0, 3).map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                      {parseResult.warnings.length > 3 && (
                        <li>
                          ...and {parseResult.warnings.length - 3} more warnings
                        </li>
                      )}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Help text */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>Example CSV:</strong> Sample CSV with valid rows to get
            started.
          </p>
          <p>
            <strong>Options CSV:</strong> Lists all valid format presets,
            sources, and style presets.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
