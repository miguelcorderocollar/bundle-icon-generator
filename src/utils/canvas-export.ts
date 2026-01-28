/**
 * Canvas export utilities for rendering canvas state to PNG
 * Uses the same sizing logic as CanvasEditor for consistency
 */

import * as fabric from "fabric";
import type {
  CanvasEditorState,
  CanvasLayer,
  IconLayer,
  ImageLayer,
  TextLayer,
} from "@/src/types/canvas";
import { isIconLayer, isImageLayer, isTextLayer } from "@/src/types/canvas";
import { getIconById } from "./icon-catalog";
import type { BackgroundValue } from "./gradients";
import { isLinearGradient, isRadialGradient } from "./gradients";

// Internal canvas size (must match CanvasEditor)
const INTERNAL_SIZE = 1024;

/**
 * Apply SVG color replacement
 */
function applySvgColor(svgContent: string, color: string): string {
  let result = svgContent.replace(
    /fill="(?!none|url)([^"]*)"/gi,
    `fill="${color}"`
  );
  result = result.replace(
    /stroke="(?!none|url)([^"]*)"/gi,
    `stroke="${color}"`
  );
  result = result.replace(/currentColor/gi, color);
  return result;
}

/**
 * Normalize SVG to have explicit width/height from viewBox
 * This fixes issues with SVGs that only have viewBox (like RemixIcon)
 */
function normalizeSvgDimensions(svgContent: string): {
  svg: string;
  width: number;
  height: number;
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, "image/svg+xml");
  const svgEl = doc.querySelector("svg");

  if (!svgEl) {
    return { svg: svgContent, width: 24, height: 24 };
  }

  // Try to get dimensions from viewBox first
  const viewBox = svgEl.getAttribute("viewBox");
  let width = 24;
  let height = 24;

  if (viewBox) {
    const parts = viewBox.split(/\s+|,/).map(Number);
    if (parts.length >= 4) {
      width = parts[2] || 24;
      height = parts[3] || 24;
    }
  }

  // Check for explicit width/height attributes
  const attrWidth = svgEl.getAttribute("width");
  const attrHeight = svgEl.getAttribute("height");

  if (attrWidth && !attrWidth.includes("%")) {
    width = parseFloat(attrWidth) || width;
  }
  if (attrHeight && !attrHeight.includes("%")) {
    height = parseFloat(attrHeight) || height;
  }

  // Set explicit width/height on the SVG element
  svgEl.setAttribute("width", String(width));
  svgEl.setAttribute("height", String(height));

  // Ensure viewBox is set
  if (!viewBox) {
    svgEl.setAttribute("viewBox", `0 0 ${width} ${height}`);
  }

  return {
    svg: new XMLSerializer().serializeToString(svgEl),
    width,
    height,
  };
}

/**
 * Create fabric gradient from BackgroundValue
 */
function createFabricGradient(
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

/**
 * Create fabric object from layer
 * Uses same sizing logic as CanvasEditor: 50% of canvas for icons/images
 */
async function createFabricObject(
  layer: CanvasLayer,
  outputSize: number
): Promise<fabric.FabricObject | null> {
  const scale = outputSize / INTERNAL_SIZE;

  if (isIconLayer(layer)) {
    return createIconObject(layer, scale);
  }

  if (isImageLayer(layer)) {
    return createImageObject(layer, scale);
  }

  if (isTextLayer(layer)) {
    return createTextObject(layer, scale);
  }

  return null;
}

async function createIconObject(
  layer: IconLayer,
  scale: number
): Promise<fabric.FabricObject | null> {
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
      // Use parsed SVG dimensions instead of fabric's reported dimensions
      const baseScale = (INTERNAL_SIZE * 0.5) / svgSize;
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
    console.error("Error creating icon for export:", error);
    return null;
  }
}

async function createImageObject(
  layer: ImageLayer,
  scale: number
): Promise<fabric.FabricObject | null> {
  try {
    const img = await fabric.FabricImage.fromURL(layer.imageDataUrl);
    const imgSize = Math.max(img.width || 1, img.height || 1);

    // Default size: 50% of canvas
    const baseScale = (INTERNAL_SIZE * 0.5) / imgSize;
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
    console.error("Error creating image for export:", error);
    return null;
  }
}

function createTextObject(
  layer: TextLayer,
  scale: number
): fabric.FabricObject {
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

/**
 * Render canvas state to a PNG blob at the specified size
 */
export async function renderCanvasToPng(
  canvasState: CanvasEditorState,
  outputSize: number
): Promise<Blob> {
  // Create canvas element for StaticCanvas
  const canvasEl = document.createElement("canvas");
  canvasEl.width = outputSize;
  canvasEl.height = outputSize;

  const canvas = new fabric.StaticCanvas(canvasEl, {
    width: outputSize,
    height: outputSize,
  });

  // Set background
  const bg = createFabricGradient(canvasState.backgroundColor, outputSize);
  canvas.backgroundColor = bg;

  // Add all visible layers
  for (const layer of canvasState.layers) {
    if (!layer.visible) continue;

    const obj = await createFabricObject(layer, outputSize);
    if (obj) {
      canvas.add(obj);
    }
  }

  canvas.renderAll();

  // Export to blob
  const blob = await canvas.toBlob({ format: "png", multiplier: 1 });
  if (!blob) {
    throw new Error("Failed to generate PNG from canvas");
  }

  canvas.dispose();
  return blob;
}

/**
 * Generate canvas export assets (PNG files only)
 */
export async function generateCanvasExportAssets(
  canvasState: CanvasEditorState,
  variants: Array<{ filename: string; width: number; height: number }>
): Promise<Map<string, Blob>> {
  const assets = new Map<string, Blob>();

  for (const variant of variants) {
    const blob = await renderCanvasToPng(canvasState, variant.width);
    assets.set(variant.filename, blob);
  }

  return assets;
}
