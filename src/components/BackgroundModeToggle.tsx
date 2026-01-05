/**
 * Toggle component for switching between solid color and gradient background modes
 * Uses shadcn ToggleGroup component for proper accessibility and styling
 */

import * as React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export type BackgroundMode = "solid" | "gradient";

export interface BackgroundModeToggleProps {
  mode: BackgroundMode;
  onModeChange: (mode: BackgroundMode) => void;
  className?: string;
}

export function BackgroundModeToggle({
  mode,
  onModeChange,
  className,
}: BackgroundModeToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={mode}
      onValueChange={(value) => {
        if (value) {
          onModeChange(value as BackgroundMode);
        }
      }}
      className={cn("w-auto", className)}
      variant="outline"
      size="sm"
    >
      <ToggleGroupItem value="solid" aria-label="Solid color">
        Solid
      </ToggleGroupItem>
      <ToggleGroupItem value="gradient" aria-label="Gradient">
        Gradient
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
