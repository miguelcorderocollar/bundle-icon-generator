/**
 * Component for displaying and selecting gradient presets
 */

import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Gradient } from "@/src/utils/gradients";
import { GRADIENT_PRESETS, gradientToCss } from "@/src/utils/gradients";

export interface GradientPresetListProps {
  selectedPreset?: string;
  onPresetSelect: (preset: Gradient) => void;
  className?: string;
}

export function GradientPresetList({
  selectedPreset,
  onPresetSelect,
  className,
}: GradientPresetListProps) {
  const presetEntries = Object.entries(GRADIENT_PRESETS);

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-xs">Presets</Label>
      <div className="grid grid-cols-4 gap-2">
        {presetEntries.map(([name, gradient]) => (
          <button
            key={name}
            type="button"
            onClick={() => onPresetSelect(gradient)}
            className={cn(
              "aspect-square rounded-md border-2 transition-all",
              "hover:scale-105 hover:ring-2 hover:ring-ring",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selectedPreset === name && "ring-2 ring-primary ring-offset-1"
            )}
            style={{ background: gradientToCss(gradient) }}
            aria-label={`Select ${name} gradient`}
            title={name}
          />
        ))}
      </div>
    </div>
  );
}

