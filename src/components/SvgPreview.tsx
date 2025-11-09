/**
 * SVG preview component showing location-specific SVG files
 */

import { ScrollArea } from "@/components/ui/scroll-area";
import { PreviewPlaceholder } from "./PreviewPlaceholder";
import { SVG_SPECS } from "@/src/constants/app";

export interface SvgPreviewProps {
  svgFiles: string[];
}

export function SvgPreview({ svgFiles }: SvgPreviewProps) {
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
        {svgFiles.map((filename) => (
          <div key={filename} className="space-y-2">
            <PreviewPlaceholder
              filename={filename}
              dimensions={`${SVG_SPECS.DISPLAY_SIZE}×${SVG_SPECS.DISPLAY_SIZE}`}
              size="small"
            />
            <p className="text-xs text-muted-foreground">
              {SVG_SPECS.DESCRIPTION}
            </p>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

