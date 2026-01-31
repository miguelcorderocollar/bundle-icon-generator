"use client";

/**
 * Transform controls: position, scale, rotation, opacity
 * Uses local state with debounced commits to prevent flickering
 */

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { CanvasLayer } from "@/src/types/canvas";
import type { CanvasEditorActions } from "@/src/hooks/use-canvas-editor";

export interface TransformControlsProps {
  layer: CanvasLayer;
  actions: CanvasEditorActions;
}

export function TransformControls({ layer, actions }: TransformControlsProps) {
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
