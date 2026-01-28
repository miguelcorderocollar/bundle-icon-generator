"use client";

/**
 * Canvas Editor component using fabric.js for layer preview
 * All manipulation is done via UI controls (LayerProperties), not on canvas
 */

import * as React from "react";
import * as fabric from "fabric";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, RotateCcw } from "lucide-react";
import type { CanvasLayer, CanvasEditorState } from "@/src/types/canvas";
import { isIconLayer, isImageLayer, isTextLayer } from "@/src/types/canvas";
import { getIconById } from "@/src/utils/icon-catalog";
import type { BackgroundValue } from "@/src/utils/gradients";
import { isLinearGradient, isRadialGradient } from "@/src/utils/gradients";
import type { CanvasEditorActions } from "@/src/hooks/use-canvas-editor";

/**
 * Serialize a layer to capture all render-affecting properties
 */
function serializeLayerForHash(layer: CanvasLayer): object {
  const base = {
    id: layer.id,
    type: layer.type,
    left: layer.left,
    top: layer.top,
    scaleX: layer.scaleX,
    scaleY: layer.scaleY,
    angle: layer.angle,
    opacity: layer.opacity,
    visible: layer.visible,
  };

  if (isIconLayer(layer)) {
    return { ...base, iconId: layer.iconId, color: layer.color };
  }
  if (isImageLayer(layer)) {
    return { ...base, imageDataUrl: layer.imageDataUrl };
  }
  if (isTextLayer(layer)) {
    return {
      ...base,
      text: layer.text,
      fontFamily: layer.fontFamily,
      fontSize: layer.fontSize,
      color: layer.color,
      bold: layer.bold,
      italic: layer.italic,
    };
  }
  return base;
}

// Canvas sizes
const CANVAS_SIZE = 400; // Display size
const INTERNAL_SIZE = 1024; // Internal coordinate system
const SCALE = CANVAS_SIZE / INTERNAL_SIZE;

interface CanvasEditorProps {
  state: CanvasEditorState;
  actions: CanvasEditorActions;
  onAddLayerClick: () => void;
}

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
 * Canvas Editor Component
 */
export function CanvasEditor({
  state,
  actions,
  onAddLayerClick,
}: CanvasEditorProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = React.useRef<fabric.StaticCanvas | null>(null);

  // Create a stable hash of all render-affecting state for proper change detection
  const stateHash = React.useMemo(() => {
    return JSON.stringify({
      layers: state.layers.map(serializeLayerForHash),
      selectedLayerId: state.selectedLayerId,
      backgroundColor: state.backgroundColor,
    });
  }, [state.layers, state.selectedLayerId, state.backgroundColor]);

  // Initialize static canvas (no interaction, preview only)
  React.useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    const canvas = new fabric.StaticCanvas(canvasRef.current, {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
    });

    fabricCanvasRef.current = canvas;

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  // Rebuild canvas when state changes
  React.useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const renderCanvas = async () => {
      // Clear canvas
      canvas.clear();

      // Set background
      const bg = createFabricGradient(state.backgroundColor, CANVAS_SIZE);
      canvas.backgroundColor = bg;

      // Add layers in order (first = bottom)
      for (const layer of state.layers) {
        if (!layer.visible) continue;

        const obj = await createFabricObject(layer);
        if (obj) {
          // Highlight selected layer
          if (state.selectedLayerId === layer.id) {
            obj.set({
              stroke: "#3b82f6",
              strokeWidth: 3 / SCALE,
              strokeUniform: true,
            });
          }
          canvas.add(obj);
        }
      }

      canvas.renderAll();
    };

    renderCanvas();
  }, [stateHash, state.layers, state.selectedLayerId, state.backgroundColor]);

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onAddLayerClick}>
                <Plus className="size-4 mr-1" />
                Add Layer
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add icon, image, or text</TooltipContent>
          </Tooltip>

          {state.layers.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => actions.clearCanvas()}
                >
                  <RotateCcw className="size-4 mr-1" />
                  Clear
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear all layers</TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </div>

      {/* Canvas Preview */}
      <div className="flex justify-center">
        <div
          className="border border-border rounded-lg overflow-hidden shadow-lg"
          style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
        >
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* Layer count */}
      <div className="text-xs text-muted-foreground text-center">
        {state.layers.length === 0
          ? "Click 'Add Layer' to start"
          : `${state.layers.length} layer${state.layers.length === 1 ? "" : "s"}`}
      </div>
    </div>
  );
}

/**
 * Create fabric object from layer
 * Icons/images are sized to 50% of canvas and centered by default
 */
async function createFabricObject(
  layer: CanvasLayer
): Promise<fabric.FabricObject | null> {
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
        // Use parsed SVG dimensions instead of fabric's reported dimensions
        const baseScale = (INTERNAL_SIZE * 0.5) / svgSize;
        const finalScale = baseScale * layer.scaleX * SCALE;

        img.set({
          left: layer.left * SCALE,
          top: layer.top * SCALE,
          scaleX: finalScale,
          scaleY: baseScale * layer.scaleY * SCALE,
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
      const img = await fabric.FabricImage.fromURL(layer.imageDataUrl);
      const imgSize = Math.max(img.width || 1, img.height || 1);

      // Default size: 50% of canvas
      const baseScale = (INTERNAL_SIZE * 0.5) / imgSize;
      const finalScale = baseScale * layer.scaleX * SCALE;

      img.set({
        left: layer.left * SCALE,
        top: layer.top * SCALE,
        scaleX: finalScale,
        scaleY: baseScale * layer.scaleY * SCALE,
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
      left: layer.left * SCALE,
      top: layer.top * SCALE,
      scaleX: layer.scaleX * SCALE,
      scaleY: layer.scaleY * SCALE,
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

// Export constants for use in canvas-export
export { INTERNAL_SIZE };
