"use client";

/**
 * Icon-specific properties (color)
 */

import * as React from "react";
import { ColorPicker } from "@/src/components/ColorPicker";
import type { IconLayer } from "@/src/types/canvas";
import type { CanvasEditorActions } from "@/src/hooks/use-canvas-editor";
import type { ColorPaletteEntry } from "@/src/types/preset";

export interface IconLayerPropertiesProps {
  layer: IconLayer;
  actions: CanvasEditorActions;
  /** Optional color palette from the active style preset */
  paletteColors?: ColorPaletteEntry[];
  /**
   * When true, only palette colors can be used (no color picker).
   * Used in restricted mode to limit color choices.
   */
  restrictedColorMode?: boolean;
}

export function IconLayerProperties({
  layer,
  actions,
  paletteColors,
  restrictedColorMode,
}: IconLayerPropertiesProps) {
  const handleColorChange = React.useCallback(
    (color: string) => {
      actions.updateLayer(layer.id, { color });
    },
    [layer.id, actions]
  );

  return (
    <div className="pt-3 border-t">
      <ColorPicker
        id={`icon-layer-color-${layer.id}`}
        label="Icon Color"
        value={layer.color}
        onChange={handleColorChange}
        paletteColors={paletteColors}
        restrictedMode={restrictedColorMode}
      />
    </div>
  );
}
