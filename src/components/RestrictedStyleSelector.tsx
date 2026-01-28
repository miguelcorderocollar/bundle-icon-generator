/**
 * Component for selecting from restricted style presets
 *
 * This component is shown instead of the full color picker/gradient editor
 * when the app is in restricted mode.
 */

"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RestrictedStyle } from "@/src/types/restriction";
import type { BackgroundValue } from "@/src/utils/gradients";
import { isGradient, gradientToCss, isSolidColor } from "@/src/utils/gradients";

export interface RestrictedStyleSelectorProps {
  /** Available restricted styles */
  styles: RestrictedStyle[];
  /** Current background value */
  currentBackground: BackgroundValue;
  /** Current icon color */
  currentIconColor: string;
  /** Callback when a style is selected */
  onStyleSelect: (style: RestrictedStyle) => void;
  /** Optional class name */
  className?: string;
  /** Whether to show color palette for canvas mode */
  showColorPalette?: boolean;
  /** Callback when a color from the palette is selected (for canvas mode) */
  onColorSelect?: (color: string) => void;
}

/**
 * Get CSS string for a background value
 */
function getBackgroundCss(value: BackgroundValue): string {
  if (isSolidColor(value)) {
    return value;
  }
  if (isGradient(value)) {
    return gradientToCss(value);
  }
  return "#063940";
}

/**
 * Check if two background values are equal
 */
function backgroundsEqual(a: BackgroundValue, b: BackgroundValue): boolean {
  if (typeof a === "string" && typeof b === "string") {
    return a.toLowerCase() === b.toLowerCase();
  }
  if (isGradient(a) && isGradient(b)) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return false;
}

/**
 * Check if a style matches the current state
 */
function isStyleActive(
  style: RestrictedStyle,
  currentBackground: BackgroundValue,
  currentIconColor: string
): boolean {
  return (
    backgroundsEqual(style.backgroundColor, currentBackground) &&
    style.iconColor.toLowerCase() === currentIconColor.toLowerCase()
  );
}

export function RestrictedStyleSelector({
  styles,
  currentBackground,
  currentIconColor,
  onStyleSelect,
  className,
  showColorPalette = false,
  onColorSelect,
}: RestrictedStyleSelectorProps) {
  // Track the currently selected style for showing its color palette
  const [selectedStyleIndex, setSelectedStyleIndex] = React.useState<number>(0);

  // Find which style is currently active based on background
  React.useEffect(() => {
    const activeIndex = styles.findIndex((style) =>
      backgroundsEqual(style.backgroundColor, currentBackground)
    );
    if (activeIndex !== -1) {
      setSelectedStyleIndex(activeIndex);
    }
  }, [styles, currentBackground]);

  const selectedStyle = styles[selectedStyleIndex];

  // Collect all available colors for the color palette
  const availableColors = React.useMemo(() => {
    if (!selectedStyle) return [];
    const colors: { name: string; color: string }[] = [
      { name: "Primary", color: selectedStyle.iconColor },
    ];
    if (selectedStyle.colorPalette) {
      selectedStyle.colorPalette.forEach((entry) => {
        colors.push({ name: entry.name, color: entry.color });
      });
    }
    return colors;
  }, [selectedStyle]);

  const handleStyleClick = (style: RestrictedStyle, index: number) => {
    setSelectedStyleIndex(index);
    onStyleSelect(style);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <Label>Style</Label>
        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">(Restricted)</span>
      </div>

      <TooltipProvider>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {styles.map((style, index) => {
            const isActive = isStyleActive(
              style,
              currentBackground,
              currentIconColor
            );
            const backgroundCss = getBackgroundCss(style.backgroundColor);

            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => handleStyleClick(style, index)}
                    className={cn(
                      "relative flex aspect-square flex-col items-center justify-center",
                      "rounded-lg border-2 p-2 transition-all",
                      "hover:scale-105 hover:ring-2 hover:ring-ring",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive
                        ? "border-primary ring-2 ring-primary ring-offset-1"
                        : "border-border"
                    )}
                    style={{ background: backgroundCss }}
                    aria-label={`Select ${style.name} style`}
                    aria-pressed={isActive}
                  >
                    {/* Icon preview circle */}
                    <div
                      className="h-8 w-8 rounded-full border-2 border-white/20"
                      style={{ backgroundColor: style.iconColor }}
                    />
                    {/* Style name */}
                    <span
                      className="mt-2 text-xs font-medium"
                      style={{
                        color: style.iconColor,
                        textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                      }}
                    >
                      {style.name}
                    </span>
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                        <svg
                          className="h-3 w-3 text-primary-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="font-medium">{style.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Icon: {style.iconColor}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Background:{" "}
                      {isSolidColor(style.backgroundColor)
                        ? style.backgroundColor
                        : isGradient(style.backgroundColor)
                          ? `${style.backgroundColor.type} gradient`
                          : "Custom"}
                    </p>
                    {style.colorPalette && style.colorPalette.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        +{style.colorPalette.length} accent color(s)
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      {/* Color Palette for Canvas Mode */}
      {showColorPalette && onColorSelect && availableColors.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm">Layer Colors</Label>
          <p className="text-xs text-muted-foreground">
            Click a color to apply it to selected layers.
          </p>
          <TooltipProvider>
            <div className="flex flex-wrap gap-2">
              {availableColors.map((entry, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onColorSelect(entry.color)}
                      className={cn(
                        "h-10 w-10 rounded-md border-2 transition-all",
                        "hover:scale-110 hover:ring-2 hover:ring-ring",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      )}
                      style={{ backgroundColor: entry.color }}
                      aria-label={`Apply ${entry.name} color`}
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

      <p className="text-xs text-muted-foreground">
        This session has restricted styling options. To unlock all options,
        clear your browser cache and reload without the restriction URL.
      </p>
    </div>
  );
}
