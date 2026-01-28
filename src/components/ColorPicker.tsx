/**
 * Reusable color picker component with hex input and recent colors
 */

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getRecentColors,
  addColorToHistory,
  type ColorType,
} from "@/src/utils/color-history";
import { useDebouncedValue } from "@/src/hooks/use-debounced-value";
import type { ColorPaletteEntry } from "@/src/types/preset";

export interface ColorPickerProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  colorType?: ColorType;
  isCustomSvg?: boolean;
  /** Optional color palette from the active style preset */
  paletteColors?: ColorPaletteEntry[];
  /**
   * When true, only palette colors can be selected (no free color picker).
   * Used in restricted mode to limit color choices.
   */
  restrictedMode?: boolean;
}

export function ColorPicker({
  id,
  label,
  value,
  onChange,
  className,
  colorType,
  isCustomSvg = false,
  paletteColors,
  restrictedMode = false,
}: ColorPickerProps) {
  const [recentColors, setRecentColors] = React.useState<string[]>([]);

  // Local state for immediate UI updates
  const [localValue, setLocalValue] = React.useState(value);
  const lastPropValueRef = React.useRef(value);

  // Debounce value changes to avoid excessive re-renders while typing/adjusting
  const debouncedLocalValue = useDebouncedValue(localValue, 300);

  // Load recent colors on mount and when colorType changes
  React.useEffect(() => {
    if (colorType) {
      setRecentColors(getRecentColors(colorType));
    }
  }, [colorType]);

  // Update parent when debounced value changes (but only if it's different from prop)
  React.useEffect(() => {
    if (debouncedLocalValue !== lastPropValueRef.current) {
      lastPropValueRef.current = debouncedLocalValue;
      onChange(debouncedLocalValue);
    }
  }, [debouncedLocalValue, onChange]);

  // Sync local state when prop changes externally
  React.useEffect(() => {
    if (value !== lastPropValueRef.current) {
      lastPropValueRef.current = value;
      setLocalValue(value);
    }
  }, [value]);

  // Save color to history when debounced value changes (only if it's a valid hex color)
  React.useEffect(() => {
    if (
      colorType &&
      debouncedLocalValue &&
      /^#[0-9A-Fa-f]{6}$/.test(debouncedLocalValue)
    ) {
      addColorToHistory(colorType, debouncedLocalValue);
      // Refresh recent colors to show the updated list
      setRecentColors(getRecentColors(colorType));
    }
  }, [debouncedLocalValue, colorType]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    // Basic validation - allow partial input
    if (hex === "" || /^#[0-9A-Fa-f]{0,6}$/.test(hex)) {
      setLocalValue(hex);
    }
  };

  const handleRecentColorClick = (color: string) => {
    setLocalValue(color);
  };

  // Restricted mode: only show palette color swatches
  if (restrictedMode && paletteColors && paletteColors.length > 0) {
    return (
      <div className={cn("space-y-2", className)}>
        <Label>{label}</Label>
        <TooltipProvider>
          <div className="flex gap-2 flex-wrap">
            {paletteColors.map((entry) => (
              <Tooltip key={entry.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      setLocalValue(entry.color);
                      // In restricted mode, update immediately
                      lastPropValueRef.current = entry.color;
                      onChange(entry.color);
                    }}
                    className={cn(
                      "h-8 w-8 rounded-md border-2 transition-all",
                      "hover:scale-110 hover:ring-2 hover:ring-ring",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      localValue.toLowerCase() === entry.color.toLowerCase() &&
                        "ring-2 ring-primary ring-offset-1"
                    )}
                    style={{ backgroundColor: entry.color }}
                    aria-label={`Select ${entry.name} (${entry.color})`}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{entry.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {entry.color}
                  </p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Label htmlFor={id}>{label}</Label>
        {isCustomSvg && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Color customization replaces all{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    fill
                  </code>{" "}
                  and{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    stroke
                  </code>{" "}
                  colors in the SVG, except for{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    none
                  </code>
                  ,{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    transparent
                  </code>
                  , and gradient/pattern references.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="flex gap-2">
        <input
          id={id}
          type="color"
          value={localValue}
          onChange={handleColorChange}
          className="h-10 w-20 cursor-pointer rounded-md border"
        />
        <Input
          id={`${id}-hex`}
          value={localValue}
          onChange={handleHexChange}
          className="flex-1 font-mono"
          placeholder="#ffffff"
          maxLength={7}
        />
      </div>
      {paletteColors && paletteColors.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Preset colors</p>
          <TooltipProvider>
            <div className="flex gap-2 flex-wrap">
              {paletteColors.map((entry) => (
                <Tooltip key={entry.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleRecentColorClick(entry.color)}
                      className={cn(
                        "h-8 w-8 rounded-md border-2 transition-all",
                        "hover:scale-110 hover:ring-2 hover:ring-ring",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        localValue.toLowerCase() ===
                          entry.color.toLowerCase() &&
                          "ring-2 ring-primary ring-offset-1"
                      )}
                      style={{ backgroundColor: entry.color }}
                      aria-label={`Select ${entry.name} (${entry.color})`}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{entry.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {entry.color}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </div>
      )}
      {colorType && recentColors.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Recent colors</p>
          <div className="flex gap-2 flex-wrap">
            {recentColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleRecentColorClick(color)}
                className={cn(
                  "h-8 w-8 rounded-md border-2 transition-all",
                  "hover:scale-110 hover:ring-2 hover:ring-ring",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  localValue.toLowerCase() === color.toLowerCase() &&
                    "ring-2 ring-primary ring-offset-1"
                )}
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
