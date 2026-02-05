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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, RotateCcw } from "lucide-react";
import type { CanvasLayer, CanvasEditorState } from "@/src/types/canvas";
import { isIconLayer, isImageLayer, isTextLayer } from "@/src/types/canvas";
import type { CanvasEditorActions } from "@/src/hooks/use-canvas-editor";
import {
  createFabricGradient,
  createFabricObject,
  INTERNAL_SIZE,
} from "@/src/utils/fabric-utils";

// Re-export INTERNAL_SIZE for use in canvas-export
export { INTERNAL_SIZE };

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
    return {
      ...base,
      imageDataUrl: layer.imageDataUrl,
      svgContent: layer.svgContent,
    };
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
const SCALE = CANVAS_SIZE / INTERNAL_SIZE;

interface CanvasEditorProps {
  state: CanvasEditorState;
  actions: CanvasEditorActions;
  onAddLayerClick: () => void;
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

        const obj = await createFabricObject(layer, {
          scale: SCALE,
          internalSize: INTERNAL_SIZE,
        });
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
            <AlertDialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <RotateCcw className="size-4 mr-1" />
                      Clear
                    </Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>Clear all layers</TooltipContent>
              </Tooltip>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear canvas?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all layers from the canvas. This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => actions.clearCanvas()}>
                    Clear
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
