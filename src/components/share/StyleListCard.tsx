"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Trash2 } from "lucide-react";
import type { RestrictedStyle } from "@/src/types/restriction";
import type { ShareMode } from "@/src/hooks/use-share-config";
import {
  isGradient,
  gradientToCss,
  isSolidColor,
  type BackgroundValue,
} from "@/src/utils/gradients";

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

export interface StyleListCardProps {
  /** Array of styles */
  styles: RestrictedStyle[];
  /** Index of the currently editing style */
  editingStyleIndex: number | null;
  /** Current share mode */
  shareMode: ShareMode;
  /** Add a new style */
  onAddStyle: () => void;
  /** Remove a style by index */
  onRemoveStyle: (index: number) => void;
  /** Set the editing index */
  onSelectStyle: (index: number) => void;
}

/**
 * Card component displaying the list of style presets
 */
export function StyleListCard({
  styles,
  editingStyleIndex,
  shareMode,
  onAddStyle,
  onRemoveStyle,
  onSelectStyle,
}: StyleListCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            {shareMode === "restricted"
              ? "Style Presets"
              : "Style Presets to Share"}
          </span>
          <Button size="sm" variant="outline" onClick={onAddStyle}>
            <Plus className="mr-2 h-4 w-4" />
            Add Style
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {styles.map((style, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
              editingStyleIndex === index
                ? "border-primary bg-accent"
                : "hover:bg-accent/50"
            }`}
            onClick={() => onSelectStyle(index)}
          >
            {/* Preview */}
            <div
              className="h-12 w-12 rounded-md flex items-center justify-center shrink-0"
              style={{
                background: getBackgroundCss(style.backgroundColor),
              }}
            >
              <div
                className="h-6 w-6 rounded-full"
                style={{ backgroundColor: style.iconColor }}
              />
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{style.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {isSolidColor(style.backgroundColor)
                  ? style.backgroundColor
                  : isGradient(style.backgroundColor)
                    ? `${style.backgroundColor.type} gradient`
                    : "Custom"}
              </p>
            </div>

            {/* Delete */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveStyle(index);
                    }}
                    disabled={styles.length <= 1}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {styles.length <= 1
                    ? "At least one style required"
                    : "Remove style"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
