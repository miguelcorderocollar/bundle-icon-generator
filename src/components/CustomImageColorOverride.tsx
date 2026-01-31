/**
 * Color override controls for custom PNG images with uniform colors
 * Allows users to replace the detected color with a new one
 */

"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Palette, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getColorAnalysis,
  getColorOverride,
  storeColorOverride,
  type ColorAnalysisResult,
} from "@/src/utils/image-color-analysis";
import { ColorPicker } from "./ColorPicker";

export interface CustomImageColorOverrideProps {
  /** The custom image ID */
  imageId: string;
  /** Callback when override color changes */
  onOverrideChange?: (overrideColor: string | null) => void;
  /** Key to trigger re-reading color analysis (incremented when analysis completes) */
  analysisKey?: number;
  className?: string;
}

export function CustomImageColorOverride({
  imageId,
  onOverrideChange,
  analysisKey,
  className,
}: CustomImageColorOverrideProps) {
  const [colorAnalysis, setColorAnalysis] =
    React.useState<ColorAnalysisResult | null>(null);
  const [overrideEnabled, setOverrideEnabled] = React.useState(false);
  const [overrideColor, setOverrideColor] = React.useState<string>("#ffffff");

  // Load color analysis and existing override on mount or when imageId/analysisKey changes
  React.useEffect(() => {
    const analysis = getColorAnalysis(imageId);
    setColorAnalysis(analysis);

    const existingOverride = getColorOverride(imageId);
    if (existingOverride) {
      setOverrideEnabled(true);
      setOverrideColor(existingOverride);
    } else {
      setOverrideEnabled(false);
      // Default to detected color or white
      setOverrideColor(analysis?.dominantColor ?? "#ffffff");
    }
  }, [imageId, analysisKey]);

  // Don't show if no analysis or not uniform color
  if (!colorAnalysis || !colorAnalysis.hasUniformColor) {
    return null;
  }

  const handleToggleOverride = (enabled: boolean) => {
    setOverrideEnabled(enabled);
    if (enabled) {
      storeColorOverride(imageId, overrideColor);
      onOverrideChange?.(overrideColor);
    } else {
      storeColorOverride(imageId, null);
      onOverrideChange?.(null);
    }
  };

  const handleColorChange = (color: string) => {
    setOverrideColor(color);
    if (overrideEnabled) {
      storeColorOverride(imageId, color);
      onOverrideChange?.(color);
    }
  };

  const handleResetToOriginal = () => {
    setOverrideEnabled(false);
    storeColorOverride(imageId, null);
    onOverrideChange?.(null);
    setOverrideColor(colorAnalysis.dominantColor);
  };

  const uniformityPercent = Math.round(colorAnalysis.uniformity * 100);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with detected color info */}
      <div className="flex items-center gap-2">
        <Palette className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Color Override</Label>
      </div>

      {/* Detected color display */}
      <div className="flex items-center gap-3 rounded-md bg-muted/50 p-3">
        <div
          className="h-8 w-8 rounded border border-border shrink-0"
          style={{ backgroundColor: colorAnalysis.dominantColor }}
          title={colorAnalysis.dominantColor}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Detected Color</p>
          <p className="text-xs text-muted-foreground">
            {colorAnalysis.dominantColor.toUpperCase()} ({uniformityPercent}%
            uniform)
          </p>
        </div>
      </div>

      {/* Override toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="color-override-toggle" className="text-sm">
          Override icon color
        </Label>
        <Switch
          id="color-override-toggle"
          checked={overrideEnabled}
          onCheckedChange={handleToggleOverride}
        />
      </div>

      {/* Override color picker */}
      {overrideEnabled && (
        <div className="space-y-3">
          <ColorPicker
            id="custom-image-override-color"
            label="New Color"
            value={overrideColor}
            onChange={handleColorChange}
            colorType="icon"
          />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetToOriginal}
            className="h-7 text-xs"
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset to original
          </Button>
        </div>
      )}

      {/* Explanation */}
      <p className="text-xs text-muted-foreground">
        This PNG has a uniform color that can be replaced. Enable the override
        to change the icon color while preserving transparency.
      </p>
    </div>
  );
}
