"use client";

/**
 * LayerProperties component for editing selected layer properties
 * Composes type-specific property components based on layer type
 */

import * as React from "react";
import type { CanvasLayer } from "@/src/types/canvas";
import { isIconLayer, isImageLayer, isTextLayer } from "@/src/types/canvas";
import type { CanvasEditorActions } from "@/src/hooks/use-canvas-editor";
import type { ColorPaletteEntry } from "@/src/types/preset";
import {
  TransformControls,
  IconLayerProperties,
  TextLayerProperties,
} from "./canvas";

interface LayerPropertiesProps {
  layer: CanvasLayer | undefined;
  actions: CanvasEditorActions;
  /** Optional color palette from the active style preset */
  paletteColors?: ColorPaletteEntry[];
  /**
   * When true, only palette colors can be used (no color picker).
   * Used in restricted mode to limit color choices.
   */
  restrictedColorMode?: boolean;
}

export function LayerProperties({
  layer,
  actions,
  paletteColors,
  restrictedColorMode = false,
}: LayerPropertiesProps) {
  if (!layer) {
    return (
      <div className="p-3 border rounded-lg bg-background">
        <p className="text-xs text-muted-foreground text-center">
          Select a layer to edit its properties
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-background">
      <div className="px-3 py-2 border-b">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Properties
        </h3>
      </div>
      <div className="p-3 space-y-4">
        {/* Transform controls - keyed by layer.id */}
        <TransformControls key={layer.id} layer={layer} actions={actions} />

        {/* Type-specific properties */}
        {isIconLayer(layer) && (
          <IconLayerProperties
            key={`icon-${layer.id}`}
            layer={layer}
            actions={actions}
            paletteColors={paletteColors}
            restrictedColorMode={restrictedColorMode}
          />
        )}
        {isImageLayer(layer) && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Image layers don&apos;t have color controls
          </div>
        )}
        {isTextLayer(layer) && (
          <TextLayerProperties
            key={`text-${layer.id}`}
            layer={layer}
            actions={actions}
            paletteColors={paletteColors}
            restrictedColorMode={restrictedColorMode}
          />
        )}
      </div>
    </div>
  );
}
