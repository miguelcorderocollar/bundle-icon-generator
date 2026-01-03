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
import { useDebouncedValue } from "../hooks/use-debounced-value";
import type { BackgroundValue } from "../utils/gradients";
import { DEFAULT_COLORS } from "@/src/constants/app";
import { isCustomImageIcon } from "../utils/locations";

export interface PngPreviewProps {
  iconId?: string;
  state?: IconGeneratorState;
}

export function PngPreview({ iconId, state }: PngPreviewProps) {
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
  const [logoSmallUrl, setLogoSmallUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Debounce expensive state changes (colors) but keep iconId immediate
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

  // Create a debounced state object for rendering
  const debouncedState = React.useMemo(() => {
    if (!state) return undefined;

    return {
      ...state,
      backgroundColor: debouncedBackgroundColor,
      iconColor: debouncedIconColor,
      iconSize: debouncedIconSize,
    };
  }, [
    state,
    debouncedBackgroundColor,
    debouncedIconColor,
    debouncedIconSize,
  ]);

  React.useEffect(() => {
    if (!iconId || !debouncedState) {
      setLogoUrl(null);
      setLogoSmallUrl(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    async function generatePreviews() {
      try {
        if (!iconId || !debouncedState) return;

        // Check if this is a custom image
        const isCustomImage = isCustomImageIcon(iconId);
        
        if (isCustomImage) {
          // Get image data from sessionStorage
          const imageDataUrl = typeof window !== "undefined" 
            ? sessionStorage.getItem(iconId) 
            : null;
          
          if (!imageDataUrl || cancelled) return;

          // Generate logo.png from custom image
          const logoBlob = await renderPngFromImage({
            imageDataUrl,
            backgroundColor: debouncedState.backgroundColor,
            size: debouncedState.iconSize,
            width: PNG_SPECS.LOGO.width,
            height: PNG_SPECS.LOGO.height,
          });

          if (cancelled) return;
          const logoUrl = URL.createObjectURL(logoBlob);
          setLogoUrl(logoUrl);

          // Generate logo-small.png from custom image
          const logoSmallBlob = await renderPngFromImage({
            imageDataUrl,
            backgroundColor: debouncedState.backgroundColor,
            size: debouncedState.iconSize,
            width: PNG_SPECS.LOGO_SMALL.width,
            height: PNG_SPECS.LOGO_SMALL.height,
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
            backgroundColor: debouncedState.backgroundColor,
            iconColor: debouncedState.iconColor,
            size: debouncedState.iconSize,
            width: PNG_SPECS.LOGO.width,
            height: PNG_SPECS.LOGO.height,
          });

          if (cancelled) return;
          const logoUrl = URL.createObjectURL(logoBlob);
          setLogoUrl(logoUrl);

          // Generate logo-small.png
          const logoSmallBlob = await renderPng({
            icon,
            backgroundColor: debouncedState.backgroundColor,
            iconColor: debouncedState.iconColor,
            size: debouncedState.iconSize,
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
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    generatePreviews();

    return () => {
      cancelled = true;
      if (logoUrl) URL.revokeObjectURL(logoUrl);
      if (logoSmallUrl) URL.revokeObjectURL(logoSmallUrl);
    };
  }, [iconId, debouncedState]);

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
            <h3 className="text-sm font-medium font-mono">{PNG_SPECS.LOGO.filename}</h3>
            <span className="text-xs text-muted-foreground">
              {PNG_SPECS.LOGO.width}×{PNG_SPECS.LOGO.height}
            </span>
          </div>
          <div className="flex aspect-square w-full max-w-[320px] items-center justify-center rounded-lg border-2 border-dashed bg-muted/20 p-2">
            {isLoading ? (
              <span className="text-xs text-muted-foreground">Generating preview...</span>
            ) : logoUrl ? (
              <img src={logoUrl} alt={PNG_SPECS.LOGO.filename} className="max-w-full max-h-full" />
            ) : (
              <span className="text-xs text-muted-foreground">Preview will appear here</span>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium font-mono">{PNG_SPECS.LOGO_SMALL.filename}</h3>
            <span className="text-xs text-muted-foreground">
              {PNG_SPECS.LOGO_SMALL.width}×{PNG_SPECS.LOGO_SMALL.height}
            </span>
          </div>
          <div className="flex aspect-square w-full max-w-[128px] items-center justify-center rounded-lg border-2 border-dashed bg-muted/20 p-2">
            {isLoading ? (
              <span className="text-xs text-muted-foreground">Generating preview...</span>
            ) : logoSmallUrl ? (
              <img
                src={logoSmallUrl}
                alt={PNG_SPECS.LOGO_SMALL.filename}
                className="max-w-full max-h-full"
              />
            ) : (
              <span className="text-xs text-muted-foreground">Preview will appear here</span>
            )}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

