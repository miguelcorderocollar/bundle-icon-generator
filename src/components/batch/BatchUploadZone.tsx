"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, X, AlertCircle, FileImage, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UploadedAsset } from "@/src/types/batch";

/** Maximum file size in bytes (2MB) */
const MAX_FILE_SIZE = 2 * 1024 * 1024;

/** Accepted file types */
const ACCEPTED_TYPES = {
  "image/svg+xml": [".svg"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
};

export interface BatchUploadZoneProps {
  /** Currently uploaded assets */
  uploadedAssets: UploadedAsset[];
  /** Called when a new asset is uploaded */
  onUpload: (asset: Omit<UploadedAsset, "iconId">) => void;
  /** Called when an asset is removed */
  onRemove: (name: string) => void;
  /** Called to clear all assets */
  onClearAll: () => void;
  className?: string;
}

/**
 * Extract name from filename (without extension)
 */
function getNameFromFilename(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  return lastDot > 0 ? filename.substring(0, lastDot) : filename;
}

/**
 * Detect if file is SVG or raster image
 */
function detectAssetType(file: File): "svg" | "image" {
  return file.type === "image/svg+xml" ? "svg" : "image";
}

export function BatchUploadZone({
  uploadedAssets,
  onUpload,
  onRemove,
  onClearAll,
  className,
}: BatchUploadZoneProps) {
  const [error, setError] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const existingNames = React.useMemo(
    () => new Set(uploadedAssets.map((a) => a.name)),
    [uploadedAssets]
  );

  const onDrop = React.useCallback(
    async (
      acceptedFiles: File[],
      fileRejections: Array<{
        file: File;
        errors: readonly { code: string; message: string }[];
      }>
    ) => {
      setError(null);

      // Handle rejected files
      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        const errorCode = rejection.errors[0]?.code;

        if (errorCode === "file-too-large") {
          setError(`File is too large. Maximum size is 2MB.`);
        } else if (errorCode === "file-invalid-type") {
          setError(
            "Invalid file type. Please upload SVG, PNG, JPG, or WebP files."
          );
        } else {
          setError("Failed to upload file. Please try again.");
        }
        return;
      }

      if (acceptedFiles.length === 0) return;

      setIsProcessing(true);

      try {
        for (const file of acceptedFiles) {
          const name = getNameFromFilename(file.name);

          // Check for duplicate names
          if (existingNames.has(name)) {
            setError(
              `Asset with name "${name}" already exists. Remove it first or rename the file.`
            );
            continue;
          }

          const type = detectAssetType(file);

          // Read file as data URL
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(file);
          });

          // For SVGs, also extract the raw content
          let svgContent: string | undefined;
          if (type === "svg") {
            svgContent = await file.text();
          }

          onUpload({
            name,
            filename: file.name,
            type,
            dataUrl,
            svgContent,
          });
        }
      } catch (err) {
        console.error("Failed to process files:", err);
        setError("Failed to process files. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    },
    [existingNames, onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Step 1: Upload Assets</CardTitle>
          {uploadedAssets.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="h-7 text-xs"
            >
              <X className="mr-1 size-3" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer",
            isDragActive && "border-primary bg-primary/5",
            isProcessing && "opacity-50 pointer-events-none",
            !isDragActive && "hover:border-muted-foreground/50",
            "border-muted-foreground/25"
          )}
        >
          <input {...getInputProps()} />

          <div className="flex flex-col items-center gap-2 text-center">
            {isDragActive ? (
              <>
                <Upload className="size-8 text-primary" />
                <p className="text-sm font-medium">Drop files here</p>
              </>
            ) : (
              <>
                <Upload className="size-8 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {isProcessing
                    ? "Processing..."
                    : "Drag & drop images/SVGs here"}
                </p>
                <p className="text-xs text-muted-foreground">
                  or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  SVG, PNG, JPG, or WebP (max 2MB each)
                </p>
              </>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Uploaded assets list */}
        {uploadedAssets.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Uploaded ({uploadedAssets.length}):
            </p>
            <div className="flex flex-wrap gap-2">
              {uploadedAssets.map((asset) => (
                <Badge
                  key={asset.name}
                  variant="secondary"
                  className="flex items-center gap-1.5 py-1 px-2"
                >
                  {asset.type === "svg" ? (
                    <FileCode className="size-3" />
                  ) : (
                    <FileImage className="size-3" />
                  )}
                  <span className="max-w-[150px] truncate">{asset.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(asset.name);
                    }}
                    className="ml-1 rounded-full hover:bg-muted p-0.5"
                    aria-label={`Remove ${asset.name}`}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Help text */}
        {uploadedAssets.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Upload images/SVGs to reference them in CSV by filename. Optional if
            only using built-in icons.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
