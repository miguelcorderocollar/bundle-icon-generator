/**
 * PNG preview component showing logo.png and logo-small.png
 */

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PreviewPlaceholder } from "./PreviewPlaceholder";
import { PNG_SPECS } from "@/src/constants/app";
import type { IconGeneratorState } from "../hooks/use-icon-generator";
import { renderPng, renderPngFromImage } from "../utils/renderer";
import { getIconById } from "../utils/icon-catalog";
import { isCustomImageIcon } from "../utils/locations";
import {
  getColorOverride,
  getColorAnalysis,
} from "../utils/image-color-analysis";

export interface PngPreviewProps {
  iconId?: string;
  state?: IconGeneratorState;
  /** Key to trigger re-render when color override changes */
  colorOverrideKey?: number;
}

export function PngPreview({
  iconId,
  state,
  colorOverrideKey,
}: PngPreviewProps) {
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
  const [logoSmallUrl, setLogoSmallUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!iconId || !state) {
      setLogoUrl(null);
      setLogoSmallUrl(null);
      return;
    }

    let cancelled = false;

    async function generatePreviews() {
      try {
        if (!iconId || !state) return;

        // Check if this is a custom image
        const isCustomImage = isCustomImageIcon(iconId);

        if (isCustomImage) {
          // Get image data from sessionStorage
          const imageDataUrl =
            typeof window !== "undefined"
              ? sessionStorage.getItem(iconId)
              : null;

          if (!imageDataUrl || cancelled) return;

          // Get color override if available
          const colorOverride = getColorOverride(iconId);
          const colorAnalysis = getColorAnalysis(iconId);
          const originalColor = colorAnalysis?.dominantColor;

          // Generate logo.png from custom image
          const logoBlob = await renderPngFromImage({
            imageDataUrl,
            backgroundColor: state.backgroundColor,
            size: state.iconSize,
            width: PNG_SPECS.LOGO.width,
            height: PNG_SPECS.LOGO.height,
            colorOverride,
            originalColor,
          });

          if (cancelled) return;
          const logoUrl = URL.createObjectURL(logoBlob);
          setLogoUrl(logoUrl);

          // Generate logo-small.png from custom image
          const logoSmallBlob = await renderPngFromImage({
            imageDataUrl,
            backgroundColor: state.backgroundColor,
            size: state.iconSize,
            width: PNG_SPECS.LOGO_SMALL.width,
            height: PNG_SPECS.LOGO_SMALL.height,
            colorOverride,
            originalColor,
          });

          if (cancelled) return;
          const logoSmallUrl = URL.createObjectURL(logoSmallBlob);
          setLogoSmallUrl(logoSmallUrl);
        } else {
          // Standard icon rendering
          const icon = await getIconById(iconId);
          if (!icon || cancelled) return;

          // Generate logo.png
          const logoBlob = await renderPng({
            icon,
            backgroundColor: state.backgroundColor,
            iconColor: state.iconColor,
            size: state.iconSize,
            width: PNG_SPECS.LOGO.width,
            height: PNG_SPECS.LOGO.height,
          });

          if (cancelled) return;
          const logoUrl = URL.createObjectURL(logoBlob);
          setLogoUrl(logoUrl);

          // Generate logo-small.png
          const logoSmallBlob = await renderPng({
            icon,
            backgroundColor: state.backgroundColor,
            iconColor: state.iconColor,
            size: state.iconSize,
            width: PNG_SPECS.LOGO_SMALL.width,
            height: PNG_SPECS.LOGO_SMALL.height,
          });

          if (cancelled) return;
          const logoSmallUrl = URL.createObjectURL(logoSmallBlob);
          setLogoSmallUrl(logoSmallUrl);
        }
      } catch (error) {
        console.error("Error generating PNG previews:", error);
      } finally {
        // No loading state needed
      }
    }

    generatePreviews();

    return () => {
      cancelled = true;
      if (logoUrl) URL.revokeObjectURL(logoUrl);
      if (logoSmallUrl) URL.revokeObjectURL(logoSmallUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- logoUrl and logoSmallUrl are intentionally excluded to prevent infinite loops (they are outputs, not inputs)
  }, [iconId, state, colorOverrideKey]);

  if (!iconId || !state) {
    return (
      <ScrollArea className="h-full">
        <div className="space-y-6 pr-4">
          <PreviewPlaceholder
            filename={PNG_SPECS.LOGO.filename}
            dimensions={`${PNG_SPECS.LOGO.width}×${PNG_SPECS.LOGO.height}`}
            size="large"
          />
          <PreviewPlaceholder
            filename={PNG_SPECS.LOGO_SMALL.filename}
            dimensions={`${PNG_SPECS.LOGO_SMALL.width}×${PNG_SPECS.LOGO_SMALL.height}`}
            size="medium"
          />
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 pr-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium font-mono">
              {PNG_SPECS.LOGO.filename}
            </h3>
            <span className="text-xs text-muted-foreground">
              {PNG_SPECS.LOGO.width}×{PNG_SPECS.LOGO.height}
            </span>
          </div>
          <div className="flex aspect-square w-full max-w-[320px] items-center justify-center rounded-lg border-2 border-dashed bg-muted/20 p-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={PNG_SPECS.LOGO.filename}
                className="max-w-full max-h-full"
              />
            ) : null}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium font-mono">
              {PNG_SPECS.LOGO_SMALL.filename}
            </h3>
            <span className="text-xs text-muted-foreground">
              {PNG_SPECS.LOGO_SMALL.width}×{PNG_SPECS.LOGO_SMALL.height}
            </span>
          </div>
          <div className="flex aspect-square w-full max-w-[128px] items-center justify-center rounded-lg border-2 border-dashed bg-muted/20 p-2">
            {logoSmallUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoSmallUrl}
                alt={PNG_SPECS.LOGO_SMALL.filename}
                className="max-w-full max-h-full"
              />
            ) : null}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
