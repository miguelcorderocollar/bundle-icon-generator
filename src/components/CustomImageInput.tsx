"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, X, AlertCircle, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Maximum file size in bytes (2MB) */
const MAX_FILE_SIZE = 2 * 1024 * 1024;

/** Accepted image MIME types */
const ACCEPTED_IMAGE_TYPES = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
};

export interface CustomImageInputProps {
  /** Called when an image is selected with the custom image ID */
  onSelect?: (imageId: string) => void;
  /** Whether the input is disabled (e.g., when SVG locations are selected) */
  disabled?: boolean;
  /** Message to show when disabled */
  disabledMessage?: string;
  className?: string;
}

export function CustomImageInput({
  onSelect,
  disabled = false,
  disabledMessage,
  className,
}: CustomImageInputProps) {
  const [imageDataUrl, setImageDataUrl] = React.useState<string | null>(null);
  const [imageName, setImageName] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const onDrop = React.useCallback(
    (
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
            "Invalid file type. Please upload a PNG, JPG, or WebP image."
          );
        } else {
          setError("Failed to upload file. Please try again.");
        }
        return;
      }

      // Handle accepted file
      const file = acceptedFiles[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setImageDataUrl(dataUrl);
        setImageName(file.name);

        // Generate unique ID and store in sessionStorage
        const imageId = `custom-image-${Date.now()}`;
        if (typeof window !== "undefined") {
          sessionStorage.setItem(imageId, dataUrl);
        }

        onSelect?.(imageId);
      };
      reader.onerror = () => {
        setError("Failed to read file. Please try again.");
      };
      reader.readAsDataURL(file);
    },
    [onSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_IMAGE_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
    disabled,
  });

  const handleClear = () => {
    setImageDataUrl(null);
    setImageName(null);
    setError(null);
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full min-h-0 space-y-4 overflow-y-auto",
        className
      )}
    >
      {/* Disabled warning */}
      {disabled && disabledMessage && (
        <Alert>
          <AlertCircle className="size-4" />
          <AlertDescription>{disabledMessage}</AlertDescription>
        </Alert>
      )}

      {/* Upload area */}
      <div className="space-y-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <Label>Upload Image</Label>
          {imageDataUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-7 text-xs"
            >
              <X className="mr-1 size-3" />
              Clear
            </Button>
          )}
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer",
            isDragActive && "border-primary bg-primary/5",
            disabled && "opacity-50 cursor-not-allowed",
            !disabled && !isDragActive && "hover:border-muted-foreground/50",
            imageDataUrl
              ? "border-primary/50 bg-primary/5"
              : "border-muted-foreground/25"
          )}
        >
          <input {...getInputProps()} />

          {imageDataUrl ? (
            <div className="flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageDataUrl}
                alt="Uploaded preview"
                className="max-h-32 max-w-full rounded-md object-contain"
              />
              <p className="text-sm text-muted-foreground break-words max-w-full text-center">
                {imageName}
              </p>
              <p className="text-xs text-muted-foreground">
                Drop a new image to replace
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              {isDragActive ? (
                <>
                  <Upload className="size-8 text-primary" />
                  <p className="text-sm font-medium">Drop image here</p>
                </>
              ) : (
                <>
                  <ImageIcon className="size-8 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {disabled ? "Upload disabled" : "Drag & drop an image here"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    PNG, JPG, or WebP (max 2MB)
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Info about PNG-only export */}
      <Alert className="flex-shrink-0">
        <ImageIcon className="size-4" />
        <AlertDescription>
          Custom images can only be used for PNG exports (logo.png,
          logo-small.png). SVG locations require vector icons.
        </AlertDescription>
      </Alert>
    </div>
  );
}
