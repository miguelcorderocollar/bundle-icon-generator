/**
 * Reusable compact color picker with optional swatch tray
 */

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getRecentColors,
  addColorToHistory,
  type ColorType,
} from "@/src/utils/color-history";
import { useDebouncedColorState } from "@/src/hooks/use-debounced-color-state";
import type { ColorPaletteEntry } from "@/src/types/preset";

const FULL_HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export interface ColorPickerProps {
  id: string;
  label?: string;
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
  /**
   * Controlled expansion state for the swatch tray.
   * If undefined, expansion is managed internally.
   */
  expanded?: boolean;
  /** Controlled expansion callback for grouped contexts. */
  onExpandedChange?: (expanded: boolean) => void;
}

function colorInputValue(value: string): string {
  return FULL_HEX_PATTERN.test(value) ? value : "#000000";
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
  expanded,
  onExpandedChange,
}: ColorPickerProps) {
  const [recentColors, setRecentColors] = React.useState<string[]>([]);
  const [internalExpanded, setInternalExpanded] = React.useState(false);

  const {
    localValue,
    debouncedValue,
    setColorValue,
    setHexValue,
    commitValue,
  } = useDebouncedColorState({
    value,
    onChange,
  });

  React.useEffect(() => {
    if (colorType) {
      setRecentColors(getRecentColors(colorType));
    }
  }, [colorType]);

  React.useEffect(() => {
    if (colorType && debouncedValue && FULL_HEX_PATTERN.test(debouncedValue)) {
      addColorToHistory(colorType, debouncedValue);
      setRecentColors(getRecentColors(colorType));
    }
  }, [debouncedValue, colorType]);

  const hasPresetColors = Boolean(paletteColors?.length);
  const hasRecentColors = Boolean(colorType && recentColors.length > 0);
  const hasTrayContent = hasPresetColors || hasRecentColors;
  const showSectionLabels = hasPresetColors && hasRecentColors;

  const isExpanded = expanded ?? internalExpanded;
  const setExpanded = React.useCallback(
    (nextExpanded: boolean) => {
      if (expanded === undefined) {
        setInternalExpanded(nextExpanded);
      }
      onExpandedChange?.(nextExpanded);
    },
    [expanded, onExpandedChange]
  );

  React.useEffect(() => {
    if (!hasTrayContent && internalExpanded && expanded === undefined) {
      setInternalExpanded(false);
    }
  }, [expanded, hasTrayContent, internalExpanded]);

  const handleSwatchSelect = (color: string) => {
    commitValue(color);
  };

  const renderLabelRow = () => {
    if (!label && !isCustomSvg) {
      return null;
    }

    return (
      <div className="flex items-center gap-2">
        {label ? <Label htmlFor={id}>{label}</Label> : null}
        {isCustomSvg ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Color customization replaces all{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    fill
                  </code>{" "}
                  and{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    stroke
                  </code>{" "}
                  colors in the SVG, except for{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    none
                  </code>
                  ,{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    transparent
                  </code>
                  , and gradient/pattern references.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null}
      </div>
    );
  };

  const swatchBaseClass =
    "size-7 rounded-md border border-input transition-colors hover:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1";

  if (restrictedMode && hasPresetColors) {
    return (
      <div className={cn("space-y-2", className)}>
        {renderLabelRow()}
        <TooltipProvider>
          <div className="flex flex-wrap gap-1.5">
            {paletteColors!.map((entry) => (
              <Tooltip key={entry.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => handleSwatchSelect(entry.color)}
                    className={cn(
                      swatchBaseClass,
                      localValue.toLowerCase() === entry.color.toLowerCase() &&
                        "ring-2 ring-primary ring-offset-1"
                    )}
                    style={{ backgroundColor: entry.color }}
                    aria-label={`Select ${entry.name} (${entry.color})`}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{entry.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">
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
      {renderLabelRow()}

      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={colorInputValue(localValue)}
          onChange={(e) => setColorValue(e.target.value)}
          className="h-9 w-9 cursor-pointer rounded-md border border-input bg-background p-0"
          aria-label={label || "Pick a color"}
        />
        <Input
          id={`${id}-hex`}
          value={localValue}
          onChange={(e) => setHexValue(e.target.value)}
          className="h-9 flex-1 px-2.5 font-mono text-xs sm:text-sm"
          placeholder="#ffffff"
          maxLength={7}
        />
        {hasTrayContent ? (
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-controls={`${id}-swatch-tray`}
            aria-label={
              isExpanded ? "Hide color swatches" : "Show color swatches"
            }
          >
            {isExpanded ? <ChevronUp /> : <ChevronDown />}
          </Button>
        ) : null}
      </div>

      {hasTrayContent && isExpanded ? (
        <div
          id={`${id}-swatch-tray`}
          className="space-y-2 rounded-md border border-border/70 bg-muted/20 p-2"
        >
          {hasPresetColors ? (
            <div className="space-y-1.5">
              {showSectionLabels ? (
                <p className="text-xs text-muted-foreground">Preset colors</p>
              ) : null}
              <TooltipProvider>
                <div className="flex flex-wrap gap-1.5">
                  {paletteColors!.map((entry) => (
                    <Tooltip key={entry.id}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => handleSwatchSelect(entry.color)}
                          className={cn(
                            swatchBaseClass,
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
                        <p className="font-mono text-xs text-muted-foreground">
                          {entry.color}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TooltipProvider>
            </div>
          ) : null}

          {hasRecentColors ? (
            <div className="space-y-1.5">
              {showSectionLabels ? (
                <p className="text-xs text-muted-foreground">Recent colors</p>
              ) : null}
              <div className="flex flex-wrap gap-1.5">
                {recentColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleSwatchSelect(color)}
                    className={cn(
                      swatchBaseClass,
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
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
