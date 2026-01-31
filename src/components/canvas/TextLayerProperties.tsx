"use client";

/**
 * Text-specific properties
 */

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { Bold, Italic } from "lucide-react";
import { ColorPicker } from "@/src/components/ColorPicker";
import type { TextLayer } from "@/src/types/canvas";
import { AVAILABLE_FONTS } from "@/src/types/canvas";
import type { CanvasEditorActions } from "@/src/hooks/use-canvas-editor";
import type { ColorPaletteEntry } from "@/src/types/preset";

export interface TextLayerPropertiesProps {
  layer: TextLayer;
  actions: CanvasEditorActions;
  /** Optional color palette from the active style preset */
  paletteColors?: ColorPaletteEntry[];
  /**
   * When true, only palette colors can be used (no color picker).
   * Used in restricted mode to limit color choices.
   */
  restrictedColorMode?: boolean;
}

export function TextLayerProperties({
  layer,
  actions,
  paletteColors,
  restrictedColorMode,
}: TextLayerPropertiesProps) {
  const [fontSize, setFontSize] = React.useState(layer.fontSize);
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Reset when layer changes
  React.useEffect(() => {
    setFontSize(layer.fontSize);
  }, [layer.id, layer.fontSize]);

  // Cleanup
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleTextChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      actions.updateLayer(layer.id, { text: e.target.value });
    },
    [layer.id, actions]
  );

  const handleFontSizeChange = (value: number) => {
    setFontSize(value);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      actions.updateLayer(layer.id, { fontSize: value });
    }, 50);
  };

  const handleColorChange = React.useCallback(
    (color: string) => {
      actions.updateLayer(layer.id, { color });
    },
    [layer.id, actions]
  );

  return (
    <div className="space-y-3 pt-3 border-t">
      {/* Text Content */}
      <div className="space-y-1">
        <Label htmlFor={`text-content-${layer.id}`} className="text-xs">
          Text
        </Label>
        <Input
          id={`text-content-${layer.id}`}
          value={layer.text}
          onChange={handleTextChange}
          className="text-sm h-8"
        />
      </div>

      {/* Font Family */}
      <div className="space-y-1">
        <Label htmlFor={`font-family-${layer.id}`} className="text-xs">
          Font
        </Label>
        <Select
          value={layer.fontFamily}
          onValueChange={(value) =>
            actions.updateLayer(layer.id, { fontFamily: value })
          }
        >
          <SelectTrigger id={`font-family-${layer.id}`} className="text-sm h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_FONTS.map((font) => (
              <SelectItem
                key={font.value}
                value={font.value}
                style={{ fontFamily: font.value }}
              >
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Font Size */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Font Size</Label>
          <span className="text-xs text-muted-foreground tabular-nums">
            {fontSize}px
          </span>
        </div>
        <Slider
          min={12}
          max={200}
          step={1}
          value={[fontSize]}
          onValueChange={([v]) => handleFontSizeChange(v)}
        />
      </div>

      {/* Bold / Italic */}
      <div className="flex items-center gap-2">
        <Toggle
          aria-label="Toggle bold"
          pressed={layer.bold}
          onPressedChange={(pressed) =>
            actions.updateLayer(layer.id, { bold: pressed })
          }
          size="sm"
        >
          <Bold className="size-4" />
        </Toggle>
        <Toggle
          aria-label="Toggle italic"
          pressed={layer.italic}
          onPressedChange={(pressed) =>
            actions.updateLayer(layer.id, { italic: pressed })
          }
          size="sm"
        >
          <Italic className="size-4" />
        </Toggle>
      </div>

      {/* Text Color */}
      <ColorPicker
        id={`text-layer-color-${layer.id}`}
        label="Text Color"
        value={layer.color}
        onChange={handleColorChange}
        paletteColors={paletteColors}
        restrictedMode={restrictedColorMode}
      />
    </div>
  );
}
