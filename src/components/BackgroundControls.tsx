/**
 * Main component for background customization (solid color and gradients)
 */

import * as React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  BackgroundModeToggle,
  type BackgroundMode,
} from "./BackgroundModeToggle";
import { LinearGradientEditor } from "./LinearGradientEditor";
import { RadialGradientEditor } from "./RadialGradientEditor";
import { ColorPicker } from "./ColorPicker";
import type { BackgroundValue, Gradient } from "@/src/utils/gradients";
import {
  isGradient,
  isLinearGradient,
  isRadialGradient,
  isSolidColor,
  createDefaultLinearGradient,
  createDefaultRadialGradient,
} from "@/src/utils/gradients";

export interface BackgroundControlsProps {
  value: BackgroundValue;
  onChange: (value: BackgroundValue) => void;
  className?: string;
}

export function BackgroundControls({
  value,
  onChange,
  className,
}: BackgroundControlsProps) {
  // Determine current mode
  const mode: BackgroundMode = isGradient(value) ? "gradient" : "solid";

  // Current gradient type if in gradient mode
  const gradientType = isGradient(value) ? value.type : "linear";

  // Handle mode change
  const handleModeChange = (newMode: BackgroundMode) => {
    if (newMode === "solid") {
      // Convert to solid color - use first stop color if gradient
      if (isGradient(value)) {
        onChange(value.stops[0]?.color || "#063940"); // KALE_COLORS["900"]
      }
    } else {
      // Convert to gradient - create default linear gradient
      if (isSolidColor(value)) {
        onChange(createDefaultLinearGradient());
      }
    }
  };

  // Handle gradient type change
  const handleGradientTypeChange = (type: "linear" | "radial") => {
    if (type === "linear") {
      onChange(createDefaultLinearGradient());
    } else {
      onChange(createDefaultRadialGradient());
    }
  };

  // Handle gradient change
  const handleGradientChange = (gradient: Gradient) => {
    onChange(gradient);
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Background</Label>
          <BackgroundModeToggle mode={mode} onModeChange={handleModeChange} />
        </div>

        {mode === "solid" ? (
          <ColorPicker
            id="background-color"
            label="Color"
            value={value as string}
            onChange={onChange}
            colorType="background"
          />
        ) : (
          <>
            {/* Gradient Type Selector */}
            <div className="space-y-2">
              <Label className="text-xs">Gradient Type</Label>
              <Select
                value={gradientType}
                onValueChange={handleGradientTypeChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="radial">Radial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Gradient Editor */}
            {isLinearGradient(value) ? (
              <LinearGradientEditor
                gradient={value}
                onGradientChange={handleGradientChange}
              />
            ) : isRadialGradient(value) ? (
              <RadialGradientEditor
                gradient={value}
                onGradientChange={handleGradientChange}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
