/**
 * Preview header component showing selected icon information
 */

import * as React from "react";
import type { IconMetadata } from "../types/icon";
import { prepareSvgForDisplay } from "../utils/icon-display";
import { formatPackName } from "../utils/icon-pack";

export interface PreviewHeaderProps {
  iconMetadata: IconMetadata | null;
}

export function PreviewHeader({ iconMetadata }: PreviewHeaderProps) {
  // Render icon SVG for display - preserve original structure to respect theme
  const iconSvgContent = React.useMemo(() => {
    if (!iconMetadata) return null;
    
    // For custom SVGs, preserve aspect ratio
    const isCustomSvg = iconMetadata.pack === "custom-svg";
    const displayOptions = isCustomSvg
      ? {
          width: 48,
          height: 48,
          className: "icon-preview-svg",
          preserveAspectRatio: true,
        }
      : {
          width: 48,
          height: 48,
          className: "icon-preview-svg",
        };
    
    return prepareSvgForDisplay(iconMetadata.svg, displayOptions);
  }, [iconMetadata]);

  if (!iconMetadata) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center gap-4 rounded-lg border bg-muted/30 p-3">
      {/* Icon Display */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-background border overflow-hidden">
        {iconSvgContent ? (
          <div
            className="flex h-full w-full items-center justify-center p-2 [&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:w-auto [&_svg]:h-auto text-foreground"
            dangerouslySetInnerHTML={{ __html: iconSvgContent }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-xs text-muted-foreground">...</span>
          </div>
        )}
      </div>

      {/* Icon Info */}
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold truncate">{iconMetadata.name}</p>
        <p className="text-sm text-muted-foreground">
          {formatPackName(iconMetadata.pack)}
        </p>
      </div>
    </div>
  );
}

