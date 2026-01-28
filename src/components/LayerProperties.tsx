"use client";

/**
 * LayerProperties component for editing selected layer properties
 * Full UI controls for position, scale, rotation, and type-specific properties
 * Uses debouncing to prevent duplicate renders while dragging sliders
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
import { ColorPicker } from "./ColorPicker";
import type { CanvasLayer, IconLayer, TextLayer } from "@/src/types/canvas";
import {
  isIconLayer,
  isImageLayer,
  isTextLayer,
  AVAILABLE_FONTS,
} from "@/src/types/canvas";
import type { CanvasEditorActions } from "@/src/hooks/use-canvas-editor";
import type { ColorPaletteEntry } from "@/src/types/preset";

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

  // Key by layer.id to force remount when switching layers
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
          <IconProperties
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
          <TextProperties
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

/**
 * Transform controls: position, scale, rotation, opacity
 * Uses local state with debounced commits to prevent flickering
 */
function TransformControls({
  layer,
  actions,
}: {
  layer: CanvasLayer;
  actions: CanvasEditorActions;
}) {
  // Local state for smooth slider interaction
  const [posX, setPosX] = React.useState(layer.left);
  const [posY, setPosY] = React.useState(layer.top);
  const [scale, setScale] = React.useState(layer.scaleX * 100);
  const [rotation, setRotation] = React.useState(layer.angle);
  const [opacity, setOpacity] = React.useState(layer.opacity * 100);

  // Track the layer ID to reset state when layer changes
  const layerIdRef = React.useRef(layer.id);

  // Reset local state when layer ID changes (component remounts with key, but just in case)
  React.useEffect(() => {
    if (layerIdRef.current !== layer.id) {
      layerIdRef.current = layer.id;
      setPosX(layer.left);
      setPosY(layer.top);
      setScale(layer.scaleX * 100);
      setRotation(layer.angle);
      setOpacity(layer.opacity * 100);
    }
  }, [
    layer.id,
    layer.left,
    layer.top,
    layer.scaleX,
    layer.angle,
    layer.opacity,
  ]);

  // Debounce timer refs
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Commit changes with debounce
  const commitChanges = React.useCallback(
    (updates: Partial<CanvasLayer>) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        actions.updateLayer(layer.id, updates);
      }, 50);
    },
    [layer.id, actions]
  );

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handlePosXChange = (value: number) => {
    setPosX(value);
    commitChanges({ left: value });
  };

  const handlePosYChange = (value: number) => {
    setPosY(value);
    commitChanges({ top: value });
  };

  const handleScaleChange = (value: number) => {
    setScale(value);
    const s = value / 100;
    commitChanges({ scaleX: s, scaleY: s });
  };

  const handleRotationChange = (value: number) => {
    setRotation(value);
    commitChanges({ angle: value });
  };

  const handleOpacityChange = (value: number) => {
    setOpacity(value);
    commitChanges({ opacity: value / 100 });
  };

  return (
    <div className="space-y-3">
      {/* Position X */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Position X</Label>
          <span className="text-xs text-muted-foreground tabular-nums">
            {Math.round(posX)}
          </span>
        </div>
        <Slider
          min={0}
          max={1024}
          step={1}
          value={[posX]}
          onValueChange={([v]) => handlePosXChange(v)}
        />
      </div>

      {/* Position Y */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Position Y</Label>
          <span className="text-xs text-muted-foreground tabular-nums">
            {Math.round(posY)}
          </span>
        </div>
        <Slider
          min={0}
          max={1024}
          step={1}
          value={[posY]}
          onValueChange={([v]) => handlePosYChange(v)}
        />
      </div>

      {/* Scale */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Scale</Label>
          <span className="text-xs text-muted-foreground tabular-nums">
            {Math.round(scale)}%
          </span>
        </div>
        <Slider
          min={10}
          max={200}
          step={1}
          value={[scale]}
          onValueChange={([v]) => handleScaleChange(v)}
        />
      </div>

      {/* Rotation */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Rotation</Label>
          <span className="text-xs text-muted-foreground tabular-nums">
            {Math.round(rotation)}°
          </span>
        </div>
        <Slider
          min={0}
          max={360}
          step={1}
          value={[rotation]}
          onValueChange={([v]) => handleRotationChange(v)}
        />
      </div>

      {/* Opacity */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Opacity</Label>
          <span className="text-xs text-muted-foreground tabular-nums">
            {Math.round(opacity)}%
          </span>
        </div>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[opacity]}
          onValueChange={([v]) => handleOpacityChange(v)}
        />
      </div>
    </div>
  );
}

/**
 * Icon-specific properties (color)
 */
function IconProperties({
  layer,
  actions,
  paletteColors,
  restrictedColorMode,
}: {
  layer: IconLayer;
  actions: CanvasEditorActions;
  paletteColors?: ColorPaletteEntry[];
  restrictedColorMode?: boolean;
}) {
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

/**
 * Text-specific properties
 */
function TextProperties({
  layer,
  actions,
  paletteColors,
  restrictedColorMode,
}: {
  layer: TextLayer;
  actions: CanvasEditorActions;
  paletteColors?: ColorPaletteEntry[];
  restrictedColorMode?: boolean;
}) {
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
