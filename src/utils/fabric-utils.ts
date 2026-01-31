/**
 * Fabric.js utility functions
 *
 * Helper functions for creating fabric.js objects and gradients.
 */

import * as fabric from "fabric";
import type { BackgroundValue } from "@/src/utils/gradients";
import { isLinearGradient, isRadialGradient } from "@/src/utils/gradients";
import type { CanvasLayer } from "@/src/types/canvas";
import { isIconLayer, isImageLayer, isTextLayer } from "@/src/types/canvas";
import { getIconById } from "@/src/utils/icon-catalog";
import { applySvgColor, normalizeSvgDimensions } from "@/src/utils/svg-utils";

/**
 * Create fabric gradient from BackgroundValue
 *
 * @param bg - Background value (solid color or gradient)
 * @param size - Canvas size for gradient calculations
 * @returns Fabric gradient object or color string
 */
export function createFabricGradient(
  bg: BackgroundValue,
  size: number
): fabric.Gradient<"linear"> | fabric.Gradient<"radial"> | string {
  if (typeof bg === "string") {
    return bg;
  }

  if (isLinearGradient(bg)) {
    const angleRad = ((bg.angle - 90) * Math.PI) / 180;
    const x1 = 0.5 - Math.cos(angleRad) * 0.5;
    const y1 = 0.5 - Math.sin(angleRad) * 0.5;
    const x2 = 0.5 + Math.cos(angleRad) * 0.5;
    const y2 = 0.5 + Math.sin(angleRad) * 0.5;

    return new fabric.Gradient({
      type: "linear",
      coords: {
        x1: x1 * size,
        y1: y1 * size,
        x2: x2 * size,
        y2: y2 * size,
      },
      colorStops: bg.stops.map((stop) => ({
        offset: stop.offset / 100,
        color: stop.color,
      })),
    });
  }

  if (isRadialGradient(bg)) {
    const centerX = (bg.centerX / 100) * size;
    const centerY = (bg.centerY / 100) * size;
    const radius = (bg.radius / 100) * size;

    return new fabric.Gradient({
      type: "radial",
      coords: {
        x1: centerX,
        y1: centerY,
        x2: centerX,
        y2: centerY,
        r1: 0,
        r2: radius,
      },
      colorStops: bg.stops.map((stop) => ({
        offset: stop.offset / 100,
        color: stop.color,
      })),
    });
  }

  return "#063940";
}

/** Canvas internal coordinate size */
export const INTERNAL_SIZE = 1024;

/**
 * Configuration for creating fabric objects
 */
export interface CreateFabricObjectOptions {
  /** Scale factor for display */
  scale: number;
  /** Internal coordinate size */
  internalSize: number;
}

/**
 * Create fabric object from a canvas layer
 * Icons/images are sized to 50% of canvas and centered by default
 *
 * @param layer - The canvas layer to render
 * @param options - Configuration options
 * @returns Promise resolving to fabric object or null on error
 */
export async function createFabricObject(
  layer: CanvasLayer,
  options: CreateFabricObjectOptions
): Promise<fabric.FabricObject | null> {
  const { scale, internalSize } = options;

  if (isIconLayer(layer)) {
    try {
      const icon = await getIconById(layer.iconId);
      if (!icon?.svg) return null;

      const coloredSvg = applySvgColor(icon.svg, layer.color);

      // Normalize SVG to have explicit dimensions
      const {
        svg: normalizedSvg,
        width,
        height,
      } = normalizeSvgDimensions(coloredSvg);
      const svgSize = Math.max(width, height);

      const svgBlob = new Blob([normalizedSvg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(svgBlob);

      try {
        const img = await fabric.FabricImage.fromURL(url);

        // Default size: 50% of internal canvas = 512px
        const baseScale = (internalSize * 0.5) / svgSize;
        const finalScale = baseScale * layer.scaleX * scale;

        img.set({
          left: layer.left * scale,
          top: layer.top * scale,
          scaleX: finalScale,
          scaleY: baseScale * layer.scaleY * scale,
          angle: layer.angle,
          opacity: layer.opacity,
          originX: "center",
          originY: "center",
        });

        return img;
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error creating icon:", error);
      return null;
    }
  }

  if (isImageLayer(layer)) {
    try {
      // If the layer has SVG content, use normalizeSvgDimensions for proper sizing
      if (layer.svgContent) {
        const {
          svg: normalizedSvg,
          width,
          height,
        } = normalizeSvgDimensions(layer.svgContent);
        const svgSize = Math.max(width, height);

        const svgBlob = new Blob([normalizedSvg], { type: "image/svg+xml" });
        const url = URL.createObjectURL(svgBlob);

        try {
          const img = await fabric.FabricImage.fromURL(url);

          // Default size: 50% of internal canvas = 512px
          const baseScale = (internalSize * 0.5) / svgSize;
          const finalScale = baseScale * layer.scaleX * scale;

          img.set({
            left: layer.left * scale,
            top: layer.top * scale,
            scaleX: finalScale,
            scaleY: baseScale * layer.scaleY * scale,
            angle: layer.angle,
            opacity: layer.opacity,
            originX: "center",
            originY: "center",
          });

          return img;
        } finally {
          URL.revokeObjectURL(url);
        }
      }

      // For non-SVG images, use the data URL directly
      const img = await fabric.FabricImage.fromURL(layer.imageDataUrl);
      const imgSize = Math.max(img.width || 1, img.height || 1);

      // Default size: 50% of canvas
      const baseScale = (internalSize * 0.5) / imgSize;
      const finalScale = baseScale * layer.scaleX * scale;

      img.set({
        left: layer.left * scale,
        top: layer.top * scale,
        scaleX: finalScale,
        scaleY: baseScale * layer.scaleY * scale,
        angle: layer.angle,
        opacity: layer.opacity,
        originX: "center",
        originY: "center",
      });

      return img;
    } catch (error) {
      console.error("Error creating image:", error);
      return null;
    }
  }

  if (isTextLayer(layer)) {
    const text = new fabric.FabricText(layer.text, {
      left: layer.left * scale,
      top: layer.top * scale,
      scaleX: layer.scaleX * scale,
      scaleY: layer.scaleY * scale,
      angle: layer.angle,
      opacity: layer.opacity,
      originX: "center",
      originY: "center",
      fontFamily: layer.fontFamily,
      fontSize: layer.fontSize,
      fill: layer.color,
      fontWeight: layer.bold ? "bold" : "normal",
      fontStyle: layer.italic ? "italic" : "normal",
    });

    return text;
  }

  return null;
}
