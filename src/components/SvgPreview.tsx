/**
 * SVG preview component showing location-specific SVG files
 */

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SVG_SPECS } from "@/src/constants/app";
import type { IconGeneratorState } from "../hooks/use-icon-generator";
import { renderSvg } from "../utils/renderer";
import { getIconById } from "../utils/icon-catalog";
import { useDebouncedValue } from "../hooks/use-debounced-value";
import type { BackgroundValue } from "../utils/gradients";
import { DEFAULT_COLORS } from "@/src/constants/app";

/**
 * Zendesk location SVG filenames that require transparent backgrounds
 */
const ZENDESK_LOCATION_SVG_FILES = [
  "icon_top_bar.svg",
  "icon_ticket_editor.svg",
  "icon_nav_bar.svg",
];

export interface SvgPreviewProps {
  svgFiles: string[];
  iconId?: string;
  state?: IconGeneratorState;
}

export function SvgPreview({ svgFiles, iconId, state }: SvgPreviewProps) {
  const [svgUrls, setSvgUrls] = React.useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = React.useState(false);

  // Debounce expensive state changes (colors, size) but keep iconId and svgFiles immediate
  // For BackgroundValue, we need to use a custom debounce that works with objects
  const [debouncedBackgroundColor, setDebouncedBackgroundColor] = React.useState<BackgroundValue>(
    state?.backgroundColor ?? DEFAULT_COLORS.BACKGROUND
  );
  
  React.useEffect(() => {
    if (!state?.backgroundColor) return;
    const timer = setTimeout(() => {
      setDebouncedBackgroundColor(state.backgroundColor);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(state?.backgroundColor)]);
  const debouncedIconColor = useDebouncedValue(state?.iconColor ?? "", 300);
  const debouncedIconSize = useDebouncedValue(state?.iconSize ?? 64, 300);
  const debouncedSvgIconSize = useDebouncedValue(state?.svgIconSize ?? 64, 300);

  // Create a debounced state object for rendering
  const debouncedState = React.useMemo(() => {
    if (!state) return undefined;
    return {
      ...state,
      backgroundColor: debouncedBackgroundColor,
      iconColor: debouncedIconColor,
      iconSize: debouncedIconSize,
      svgIconSize: debouncedSvgIconSize,
    };
  }, [state, debouncedBackgroundColor, debouncedIconColor, debouncedIconSize, debouncedSvgIconSize]);

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
          const previewSize = 64; // Half size for preview visibility

          // Map svgIconSize (48-300px) to padding (6px to -6px range)
          // Higher svgIconSize = less padding = larger icon within the artboard
          // Negative padding makes icon larger than artboard (overflow)
          const minSize = 48;
          const maxSize = 300;
          const maxPadding = 6;
          const minPadding = -6; // Allow overflow
          const padding = maxPadding - (debouncedState.svgIconSize - minSize) / (maxSize - minSize) * (maxPadding - minPadding);

          // Check if this is a Zendesk location SVG (top_bar, ticket_editor, nav_bar)
          // These require transparent backgrounds and no hardcoded fill colors
          const isZendeskLocationSvg = ZENDESK_LOCATION_SVG_FILES.includes(filename);

          const svgString = renderSvg({
            icon,
            backgroundColor: debouncedState.backgroundColor,
            iconColor: debouncedState.iconColor,
            size: artboardSize,
            padding,
            outputSize: previewSize, // Use 64px output for preview
            zendeskLocationMode: isZendeskLocationSvg,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- svgUrls and debouncedSvgFiles are intentionally excluded to prevent infinite loops (they are outputs, not inputs)
  }, [iconId, debouncedState, debouncedSvgFilesKey]);

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
          const isZendeskLocationSvg = ZENDESK_LOCATION_SVG_FILES.includes(filename);
          
          return (
            <div key={filename} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium font-mono">{filename}</h3>
                <span className="text-xs text-muted-foreground">
                  {SVG_SPECS.DISPLAY_SIZE}×{SVG_SPECS.DISPLAY_SIZE}
                </span>
              </div>
              {/* Use checkered background for Zendesk location SVGs to show transparency */}
              {/* Container matches SVG output size exactly (64×64) - no padding to avoid clipping */}
              <div 
                className={`flex w-[64px] h-[64px] items-center justify-center rounded-lg border-2 border-dashed ${
                  isZendeskLocationSvg 
                    ? "bg-[repeating-conic-gradient(#e5e5e5_0%_25%,#ffffff_0%_50%)] bg-[length:8px_8px]" 
                    : "bg-muted/20"
                }`}
              >
                {isLoading ? (
                  <span className="text-xs text-muted-foreground text-center px-1">Loading...</span>
                ) : svgUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={svgUrl} alt={filename} className="w-[64px] h-[64px]" />
                ) : (
                  <span className="text-xs text-muted-foreground text-center px-1">Preview</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {isZendeskLocationSvg 
                  ? "Transparent background (Zendesk applies styling)" 
                  : SVG_SPECS.DESCRIPTION}
              </p>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

