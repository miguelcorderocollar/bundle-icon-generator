/**
 * Preview component that shows all variants from the selected export preset
 */

"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { IconGeneratorState } from "../hooks/use-icon-generator";
import type { ExportPreset, ExportVariantConfig } from "@/src/types/preset";
import {
  renderPng,
  renderPngFromImage,
  renderRaster,
  renderSvg,
} from "../utils/renderer";
import { getIconById } from "../utils/icon-catalog";
import { isCustomImageIcon } from "../utils/locations";
import { isGradient, gradientToCss } from "../utils/gradients";

export interface PresetPreviewProps {
  preset: ExportPreset;
  iconId?: string;
  state?: IconGeneratorState;
  isCanvasMode?: boolean;
}

interface PreviewItem {
  variant: ExportVariantConfig;
  url: string | null;
  isSkipped: boolean;
  skipReason?: string;
}

export function PresetPreview({
  preset,
  iconId,
  state,
  isCanvasMode = false,
}: PresetPreviewProps) {
  const [previews, setPreviews] = React.useState<PreviewItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const isCustomImage = isCustomImageIcon(iconId);

  // Extract individual state values to track changes properly
  const backgroundColor = state?.backgroundColor;
  const iconColor = state?.iconColor;
  const iconSize = state?.iconSize;

  // Serialize variants to detect content changes (not just length)
  const variantsHash = React.useMemo(
    () => JSON.stringify(preset.variants),
    [preset.variants]
  );

  // Calculate skipped variants
  const skippedCount = React.useMemo(() => {
    return preset.variants.filter((v) => {
      if (isCanvasMode && (v.format === "svg" || v.format === "ico"))
        return true;
      if (isCustomImage && (v.format === "svg" || v.format === "ico"))
        return true;
      return false;
    }).length;
  }, [preset.variants, isCanvasMode, isCustomImage]);

  React.useEffect(() => {
    if (!iconId || !state) {
      setPreviews([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    async function generatePreviews() {
      try {
        if (!iconId || !state) return;

        const newPreviews: PreviewItem[] = [];
        const isCustomImg = isCustomImageIcon(iconId);

        // Get icon data
        let icon = null;
        let imageDataUrl: string | null = null;

        if (isCustomImg) {
          imageDataUrl =
            typeof window !== "undefined"
              ? sessionStorage.getItem(iconId)
              : null;
          if (!imageDataUrl || cancelled) return;
        } else {
          icon = await getIconById(iconId);
          if (!icon || cancelled) return;
        }

        for (const variant of preset.variants) {
          if (cancelled) break;

          // Check if variant should be skipped
          const isSvgOrIco =
            variant.format === "svg" || variant.format === "ico";
          const shouldSkip =
            (isCanvasMode && isSvgOrIco) || (isCustomImg && isSvgOrIco);

          if (shouldSkip) {
            newPreviews.push({
              variant,
              url: null,
              isSkipped: true,
              skipReason: isCanvasMode
                ? "Canvas mode only supports raster formats"
                : "Custom images cannot be exported as SVG/ICO",
            });
            continue;
          }

          try {
            let url: string | null = null;

            if (variant.format === "svg" && icon) {
              // SVG rendering
              const svgString = renderSvg({
                icon,
                backgroundColor: state.backgroundColor,
                iconColor: state.iconColor,
                size: Math.min(variant.width, variant.height),
                padding: 4,
              });
              const blob = new Blob([svgString], { type: "image/svg+xml" });
              url = URL.createObjectURL(blob);
            } else if (isCustomImg && imageDataUrl) {
              // Custom image raster rendering
              const blob = await renderPngFromImage({
                imageDataUrl,
                backgroundColor: state.backgroundColor,
                size: state.iconSize,
                width: variant.width,
                height: variant.height,
              });
              url = URL.createObjectURL(blob);
            } else if (icon) {
              // Standard icon raster rendering
              if (variant.format === "png") {
                const blob = await renderPng({
                  icon,
                  backgroundColor: state.backgroundColor,
                  iconColor: state.iconColor,
                  size: state.iconSize,
                  width: variant.width,
                  height: variant.height,
                });
                url = URL.createObjectURL(blob);
              } else if (
                variant.format === "jpeg" ||
                variant.format === "webp"
              ) {
                const blob = await renderRaster({
                  icon,
                  backgroundColor: state.backgroundColor,
                  iconColor: state.iconColor,
                  size: state.iconSize,
                  width: variant.width,
                  height: variant.height,
                  format: variant.format,
                  quality: variant.quality,
                });
                url = URL.createObjectURL(blob);
              }
            }

            newPreviews.push({
              variant,
              url,
              isSkipped: false,
            });
          } catch (error) {
            console.error(
              `Error generating preview for ${variant.filename}:`,
              error
            );
            newPreviews.push({
              variant,
              url: null,
              isSkipped: false,
            });
          }
        }

        if (!cancelled) {
          setPreviews(newPreviews);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error generating previews:", error);
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    generatePreviews();

    return () => {
      cancelled = true;
      previews.forEach((p) => {
        if (p.url) URL.revokeObjectURL(p.url);
      });
    };
    // Using individual state values and variantsHash for proper change detection
  }, [
    iconId,
    backgroundColor,
    iconColor,
    iconSize,
    preset.id,
    variantsHash,
    isCanvasMode,
    state,
  ]);

  if (!iconId || !state) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <p className="text-sm">Select an icon to see previews</p>
      </div>
    );
  }

  const getBackgroundStyle = (): React.CSSProperties => {
    if (!state) return {};
    if (isGradient(state.backgroundColor)) {
      return { background: gradientToCss(state.backgroundColor) };
    }
    return { backgroundColor: state.backgroundColor };
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 pr-4">
        {/* Warning for skipped variants */}
        {skippedCount > 0 && (
          <Alert
            variant="default"
            className="border-amber-500/50 bg-amber-500/10"
          >
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-xs">
              {skippedCount} variant{skippedCount !== 1 ? "s" : ""} will be
              skipped
              {isCanvasMode
                ? " (Canvas mode only supports raster formats)"
                : " (Custom images cannot export as SVG/ICO)"}
            </AlertDescription>
          </Alert>
        )}

        {/* Preset info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{preset.name}</span>
          <span>
            {preset.variants.length - skippedCount} of {preset.variants.length}{" "}
            files
          </span>
        </div>

        {/* Preview grid - sorted from biggest to smallest */}
        <div className="grid grid-cols-2 gap-4">
          {(previews.length > 0
            ? previews
            : preset.variants.map(
                (v): PreviewItem => ({
                  variant: v,
                  url: null,
                  isSkipped: false,
                })
              )
          )
            .slice()
            .sort(
              (a, b) =>
                b.variant.width * b.variant.height -
                a.variant.width * a.variant.height
            )
            .map((item, index) => {
              const { variant, url, isSkipped, skipReason } = item;
              const maxPreviewSize = 160;
              const scale = Math.min(
                maxPreviewSize / variant.width,
                maxPreviewSize / variant.height,
                1
              );
              const previewWidth = Math.round(variant.width * scale);
              const previewHeight = Math.round(variant.height * scale);

              return (
                <div
                  key={`${variant.filename}-${index}`}
                  className={`space-y-2 ${isSkipped ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono truncate flex-1">
                      {variant.filename}
                    </span>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {variant.format.toUpperCase()}
                    </Badge>
                  </div>

                  <div
                    className={`flex items-center justify-center rounded-lg border-2 border-dashed p-2 ${
                      isSkipped
                        ? "bg-muted/10"
                        : variant.format === "svg"
                          ? "bg-[repeating-conic-gradient(#e5e5e5_0%_25%,#ffffff_0%_50%)] bg-[length:8px_8px]"
                          : "bg-muted/20"
                    }`}
                    style={{
                      width: previewWidth + 16,
                      height: previewHeight + 16,
                      minHeight: 48,
                    }}
                  >
                    {isSkipped ? (
                      <div className="flex flex-col items-center gap-1 text-center px-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span className="text-[10px] text-muted-foreground">
                          Skipped
                        </span>
                      </div>
                    ) : isLoading ? (
                      <span className="text-xs text-muted-foreground">
                        Loading...
                      </span>
                    ) : url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={url}
                        alt={variant.filename}
                        style={{
                          width: previewWidth,
                          height: previewHeight,
                        }}
                        className="object-contain"
                      />
                    ) : (
                      <div
                        className="rounded"
                        style={{
                          width: previewWidth,
                          height: previewHeight,
                          ...getBackgroundStyle(),
                        }}
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>
                      {variant.width}×{variant.height}
                    </span>
                    {variant.quality && <span>Q: {variant.quality}%</span>}
                  </div>

                  {isSkipped && skipReason && (
                    <p className="text-[10px] text-amber-600">{skipReason}</p>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </ScrollArea>
  );
}
