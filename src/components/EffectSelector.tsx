/**
 * Effect selector component with effect-specific controls
 */

import * as React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { EffectSlider } from "./EffectSlider";
import {
  EFFECT_CONFIGS,
  EFFECT_TYPES,
  type EffectType,
  type Darkening3DSettings,
  type WipGuidelinesSettings,
  DEFAULT_DARKENING_3D,
  DEFAULT_WIP_GUIDELINES,
} from "@/src/constants/effects";
import { EFFECT_DEFAULTS } from "@/src/constants/app";

export interface EffectSelectorProps {
  selectedEffect: EffectType;
  onEffectChange: (effect: EffectType) => void;
  darkening3dSettings?: Darkening3DSettings;
  onDarkening3dSettingsChange?: (settings: Darkening3DSettings) => void;
  wipGuidelinesSettings?: WipGuidelinesSettings;
  onWipGuidelinesSettingsChange?: (settings: WipGuidelinesSettings) => void;
}

export function EffectSelector({
  selectedEffect,
  onEffectChange,
  darkening3dSettings = DEFAULT_DARKENING_3D,
  onDarkening3dSettingsChange,
  wipGuidelinesSettings = DEFAULT_WIP_GUIDELINES,
  onWipGuidelinesSettingsChange,
}: EffectSelectorProps) {
  const handleDarkeningIntensityChange = (value: number) => {
    onDarkening3dSettingsChange?.({
      ...darkening3dSettings,
      intensity: value,
    });
  };

  const handleDarkeningCornerRadiusChange = (value: number) => {
    onDarkening3dSettingsChange?.({
      ...darkening3dSettings,
      cornerRadius: value,
    });
  };

  const handleWipOpacityChange = (value: number) => {
    onWipGuidelinesSettingsChange?.({
      ...wipGuidelinesSettings,
      opacity: value,
    });
  };

  const handleWipGridSizeChange = (value: number) => {
    onWipGuidelinesSettingsChange?.({
      ...wipGuidelinesSettings,
      gridSize: value,
    });
  };

  const handleWipCrosshairChange = (checked: boolean) => {
    onWipGuidelinesSettingsChange?.({
      ...wipGuidelinesSettings,
      showCrosshair: checked,
    });
  };

  const selectedEffectConfig = EFFECT_CONFIGS.find(
    (e) => e.id === selectedEffect
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="effect-selector">Effect</Label>
        <Select value={selectedEffect} onValueChange={onEffectChange}>
          <SelectTrigger id="effect-selector" className="h-auto py-2">
            <SelectValue>
              {selectedEffectConfig ? (
                <div className="text-left">
                  <div className="font-medium">{selectedEffectConfig.label}</div>
                  {selectedEffect !== EFFECT_TYPES.NONE && (
                    <div className="text-xs text-muted-foreground">
                      {selectedEffectConfig.description}
                    </div>
                  )}
                </div>
              ) : (
                "Select an effect"
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {EFFECT_CONFIGS.map((effect) => (
              <SelectItem key={effect.id} value={effect.id}>
                <div>
                  <div className="font-medium">{effect.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {effect.description}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 3D Darkening Settings */}
      {selectedEffect === EFFECT_TYPES.DARKENING_3D && (
        <div className="space-y-4 rounded-lg border p-4">
          <h4 className="text-sm font-medium">3D Darkening Settings</h4>
          <EffectSlider
            id="darkening-intensity"
            label="Intensity"
            value={darkening3dSettings.intensity}
            onChange={handleDarkeningIntensityChange}
            max={EFFECT_DEFAULTS.MAX_VALUE}
            step={EFFECT_DEFAULTS.STEP}
          />
          <EffectSlider
            id="darkening-corner-radius"
            label="Corner Radius"
            value={darkening3dSettings.cornerRadius}
            onChange={handleDarkeningCornerRadiusChange}
            max={50}
            step={1}
            unit="px"
          />
        </div>
      )}

      {/* WIP Guidelines Settings */}
      {selectedEffect === EFFECT_TYPES.WIP_GUIDELINES && (
        <div className="space-y-4 rounded-lg border p-4">
          <h4 className="text-sm font-medium">WIP Guidelines Settings</h4>
          <EffectSlider
            id="wip-opacity"
            label="Opacity"
            value={wipGuidelinesSettings.opacity}
            onChange={handleWipOpacityChange}
            max={EFFECT_DEFAULTS.MAX_VALUE}
            step={EFFECT_DEFAULTS.STEP}
          />
          <EffectSlider
            id="wip-grid-size"
            label="Grid Size"
            value={wipGuidelinesSettings.gridSize}
            onChange={handleWipGridSizeChange}
            min={4}
            max={32}
            step={2}
            unit="px"
          />
          <div className="flex items-center space-x-2">
            <Checkbox
              id="wip-crosshair"
              checked={wipGuidelinesSettings.showCrosshair}
              onCheckedChange={handleWipCrosshairChange}
            />
            <Label
              htmlFor="wip-crosshair"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Show Crosshair
            </Label>
          </div>
        </div>
      )}
    </div>
  );
}

