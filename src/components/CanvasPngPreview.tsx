"use client";

/**
 * CanvasPngPreview - Renders PNG previews from canvas state
 */

import * as React from "react";
import { Loader2 } from "lucide-react";
import type { CanvasEditorState, CanvasLayer } from "@/src/types/canvas";
import { renderCanvasToPng } from "@/src/utils/canvas-export";

interface CanvasPngPreviewProps {
  canvasState: CanvasEditorState;
}

/**
 * Serialize a layer to capture all render-affecting properties
 */
function serializeLayer(layer: CanvasLayer): object {
  const base = {
    id: layer.id,
    type: layer.type,
    left: layer.left,
    top: layer.top,
    scaleX: layer.scaleX,
    scaleY: layer.scaleY,
    angle: layer.angle,
    opacity: layer.opacity,
    visible: layer.visible,
  };

  switch (layer.type) {
    case "icon":
      return { ...base, iconId: layer.iconId, color: layer.color };
    case "image":
      return { ...base, imageDataUrl: layer.imageDataUrl };
    case "text":
      return {
        ...base,
        text: layer.text,
        fontFamily: layer.fontFamily,
        fontSize: layer.fontSize,
        color: layer.color,
        bold: layer.bold,
        italic: layer.italic,
      };
  }
}

export function CanvasPngPreview({ canvasState }: CanvasPngPreviewProps) {
  const [previewUrls, setPreviewUrls] = React.useState<{
    logo: string | null;
    logoSmall: string | null;
  }>({ logo: null, logoSmall: null });
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Keep a ref to the latest canvasState to avoid stale closure issues
  const canvasStateRef = React.useRef(canvasState);
  React.useEffect(() => {
    canvasStateRef.current = canvasState;
  }, [canvasState]);

  // Create a stable hash of all render-affecting state
  // Depend on the entire canvasState to ensure all changes are detected
  const stateHash = React.useMemo(() => {
    return JSON.stringify({
      layers: canvasState.layers.map(serializeLayer),
      backgroundColor: canvasState.backgroundColor,
    });
  }, [canvasState]);

  // Generate preview when canvas state changes
  React.useEffect(() => {
    const currentState = canvasStateRef.current;
    if (currentState.layers.length === 0) {
      setPreviewUrls({ logo: null, logoSmall: null });
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const generatePreviews = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Use the ref to get the latest state
        const stateToRender = canvasStateRef.current;

        // Generate 320x320 preview for logo.png (scaled down from 1024)
        const logoBlob = await renderCanvasToPng(stateToRender, 320);
        const logoUrl = URL.createObjectURL(logoBlob);

        // Generate 128x128 preview for logo-small.png (scaled down from 512)
        const logoSmallBlob = await renderCanvasToPng(stateToRender, 128);
        const logoSmallUrl = URL.createObjectURL(logoSmallBlob);

        if (!cancelled) {
          // Revoke old URLs
          if (previewUrls.logo) URL.revokeObjectURL(previewUrls.logo);
          if (previewUrls.logoSmall) URL.revokeObjectURL(previewUrls.logoSmall);

          setPreviewUrls({ logo: logoUrl, logoSmall: logoSmallUrl });
        } else {
          URL.revokeObjectURL(logoUrl);
          URL.revokeObjectURL(logoSmallUrl);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error generating canvas preview:", err);
          setError("Failed to generate preview");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    // Debounce preview generation
    const timeoutId = setTimeout(generatePreviews, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
    // stateHash captures all render-affecting properties, canvasState needed for rendering
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateHash]);

  // Cleanup URLs on unmount
  React.useEffect(() => {
    return () => {
      if (previewUrls.logo) URL.revokeObjectURL(previewUrls.logo);
      if (previewUrls.logoSmall) URL.revokeObjectURL(previewUrls.logoSmall);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Generating preview...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-48 text-destructive">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* logo.png preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">logo.png</span>
          <span className="text-xs text-muted-foreground">1024×1024</span>
        </div>
        <div className="flex justify-center">
          {previewUrls.logo ? (
            <img
              src={previewUrls.logo}
              alt="Logo preview"
              className="border border-border rounded-lg"
              style={{ width: 200, height: 200 }}
            />
          ) : (
            <div className="w-[200px] h-[200px] bg-muted rounded-lg flex items-center justify-center">
              <span className="text-sm text-muted-foreground">No preview</span>
            </div>
          )}
        </div>
      </div>

      {/* logo-small.png preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">logo-small.png</span>
          <span className="text-xs text-muted-foreground">512×512</span>
        </div>
        <div className="flex justify-center">
          {previewUrls.logoSmall ? (
            <img
              src={previewUrls.logoSmall}
              alt="Logo small preview"
              className="border border-border rounded-lg"
              style={{ width: 100, height: 100 }}
            />
          ) : (
            <div className="w-[100px] h-[100px] bg-muted rounded-lg flex items-center justify-center">
              <span className="text-xs text-muted-foreground">No preview</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
