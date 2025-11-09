/**
 * SVG preview component showing location-specific SVG files
 */

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PreviewPlaceholder } from "./PreviewPlaceholder";
import { SVG_SPECS } from "@/src/constants/app";
import type { IconGeneratorState } from "../hooks/use-icon-generator";
import { renderSvg } from "../utils/renderer";
import { getIconById } from "../utils/icon-catalog";
import { useDebouncedValue } from "../hooks/use-debounced-value";

export interface SvgPreviewProps {
  svgFiles: string[];
  iconId?: string;
  state?: IconGeneratorState;
}

export function SvgPreview({ svgFiles, iconId, state }: SvgPreviewProps) {
  const [svgUrls, setSvgUrls] = React.useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = React.useState(false);

  // Debounce expensive state changes (colors, size) but keep iconId and svgFiles immediate
  const debouncedBackgroundColor = useDebouncedValue(state?.backgroundColor ?? "", 300);
  const debouncedIconColor = useDebouncedValue(state?.iconColor ?? "", 300);
  const debouncedIconSize = useDebouncedValue(state?.iconSize ?? 64, 300);

  // Create a debounced state object for rendering
  const debouncedState = React.useMemo(() => {
    if (!state) return undefined;
    return {
      ...state,
      backgroundColor: debouncedBackgroundColor,
      iconColor: debouncedIconColor,
      iconSize: debouncedIconSize,
    };
  }, [state, debouncedBackgroundColor, debouncedIconColor, debouncedIconSize]);

  // Debounce svgFiles array changes (when locations change)
  // Use join to create a stable string for comparison
  const svgFilesKey = React.useMemo(() => svgFiles.join(","), [svgFiles]);
  const debouncedSvgFilesKey = useDebouncedValue(svgFilesKey, 200);
  const debouncedSvgFiles = React.useMemo(
    () => debouncedSvgFilesKey ? debouncedSvgFilesKey.split(",").filter(Boolean) : [],
    [debouncedSvgFilesKey]
  );

  React.useEffect(() => {
    if (!iconId || !debouncedState || debouncedSvgFiles.length === 0) {
      setSvgUrls(new Map());
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    async function generatePreviews() {
      try {
        if (!iconId || !debouncedState) return;
        const icon = await getIconById(iconId);
        if (!icon || cancelled) return;

        const newUrls = new Map<string, string>();

        for (const filename of debouncedSvgFiles) {
          if (cancelled) break;

          // Render SVG at constant 30×30 artboard size for consistent preview
          // Use iconSize to control the icon density within the fixed artboard
          const artboardSize = SVG_SPECS.PADDED_SIZE;
          const displaySize = SVG_SPECS.DISPLAY_SIZE;
          const previewSize = 64; // Half size for preview visibility

          // Map iconSize (48-200px) to padding (0-6px range)
          // Higher iconSize = less padding = larger icon within the artboard
          const minSize = 48;
          const maxSize = 200;
          const maxPadding = 6;
          const padding = Math.max(0, Math.min(maxPadding, maxPadding - (debouncedState.iconSize - minSize) / (maxSize - minSize) * maxPadding));

          const svgString = renderSvg({
            icon,
            backgroundColor: debouncedState.backgroundColor,
            iconColor: debouncedState.iconColor,
            size: artboardSize,
            padding,
            outputSize: previewSize, // Use 64px output for preview
          });

          const blob = new Blob([svgString], { type: "image/svg+xml" });
          const url = URL.createObjectURL(blob);
          newUrls.set(filename, url);
        }

        if (!cancelled) {
          setSvgUrls(newUrls);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error generating SVG previews:", error);
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    generatePreviews();

    return () => {
      cancelled = true;
      svgUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [iconId, debouncedState, debouncedSvgFiles.join(",")]);

  if (svgFiles.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground text-center">
          No SVG files required for selected locations
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 pr-4">
        {svgFiles.map((filename) => {
          const svgUrl = svgUrls.get(filename);
          return (
            <div key={filename} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium font-mono">{filename}</h3>
                <span className="text-xs text-muted-foreground">
                  {SVG_SPECS.DISPLAY_SIZE}×{SVG_SPECS.DISPLAY_SIZE}
                </span>
              </div>
              <div className="flex aspect-square w-full max-w-[64px] items-center justify-center rounded-lg border-2 border-dashed bg-muted/20 p-2">
                {isLoading ? (
                  <span className="text-xs text-muted-foreground">Generating preview...</span>
                ) : svgUrl ? (
                  <img src={svgUrl} alt={filename} className="max-w-full max-h-full" />
                ) : (
                  <span className="text-xs text-muted-foreground">Preview will appear here</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{SVG_SPECS.DESCRIPTION}</p>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

