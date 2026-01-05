/**
 * SVG preview component showing location-specific SVG files
 */

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SVG_SPECS } from "@/src/constants/app";
import type { IconGeneratorState } from "../hooks/use-icon-generator";
import { renderSvg } from "../utils/renderer";
import { getIconById } from "../utils/icon-catalog";

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

  React.useEffect(() => {
    if (!iconId || !state || svgFiles.length === 0) {
      setSvgUrls(new Map());
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    async function generatePreviews() {
      try {
        if (!iconId || !state) return;
        const icon = await getIconById(iconId);
        if (!icon || cancelled) return;

        const newUrls = new Map<string, string>();

        for (const filename of svgFiles) {
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
          const padding = maxPadding - (state.svgIconSize - minSize) / (maxSize - minSize) * (maxPadding - minPadding);

          // Check if this is a Zendesk location SVG (top_bar, ticket_editor, nav_bar)
          // These require transparent backgrounds and no hardcoded fill colors
          const isZendeskLocationSvg = ZENDESK_LOCATION_SVG_FILES.includes(filename);

          const svgString = renderSvg({
            icon,
            backgroundColor: state.backgroundColor,
            iconColor: state.iconColor,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- svgUrls is intentionally excluded to prevent infinite loops (it's an output, not an input)
  }, [iconId, state, svgFiles]);

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

