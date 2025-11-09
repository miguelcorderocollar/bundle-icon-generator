/**
 * Reusable color picker component with hex input and recent colors
 */

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getRecentColors, addColorToHistory, type ColorType } from "@/src/utils/color-history";
import { useDebouncedValue } from "@/src/hooks/use-debounced-value";

export interface ColorPickerProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  colorType?: ColorType;
}

export function ColorPicker({
  id,
  label,
  value,
  onChange,
  className,
  colorType,
}: ColorPickerProps) {
  const [recentColors, setRecentColors] = React.useState<string[]>([]);
  
  // Debounce value changes to avoid saving incomplete colors while typing
  const debouncedValue = useDebouncedValue(value, 500);

  // Load recent colors on mount and when colorType changes
  React.useEffect(() => {
    if (colorType) {
      setRecentColors(getRecentColors(colorType));
    }
  }, [colorType]);

  // Save color to history when debounced value changes (only if it's a valid hex color)
  React.useEffect(() => {
    if (colorType && debouncedValue && /^#[0-9A-Fa-f]{6}$/.test(debouncedValue)) {
      addColorToHistory(colorType, debouncedValue);
      // Refresh recent colors to show the updated list
      setRecentColors(getRecentColors(colorType));
    }
  }, [debouncedValue, colorType]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    // Basic validation - allow partial input
    if (hex === "" || /^#[0-9A-Fa-f]{0,6}$/.test(hex)) {
      onChange(hex);
    }
  };

  const handleRecentColorClick = (color: string) => {
    onChange(color);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={handleColorChange}
          className="h-10 w-20 cursor-pointer rounded-md border"
        />
        <Input
          id={`${id}-hex`}
          value={value}
          onChange={handleHexChange}
          className="flex-1 font-mono"
          placeholder="#ffffff"
          maxLength={7}
        />
      </div>
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
                  value.toLowerCase() === color.toLowerCase() && "ring-2 ring-primary ring-offset-1"
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

