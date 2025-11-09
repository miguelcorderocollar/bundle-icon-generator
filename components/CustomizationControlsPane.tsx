"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { ColorPicker } from "@/src/components/ColorPicker";
import { EffectSelector } from "@/src/components/EffectSelector";
import { APP_LOCATION_OPTIONS } from "@/src/utils/app-location-options";
import { getLocationCountText } from "@/src/utils/locations";
import { DEFAULT_COLORS } from "@/src/constants/app";
import {
  type EffectType,
  type Darkening3DSettings,
  type WipGuidelinesSettings,
  DEFAULT_DARKENING_3D,
  DEFAULT_WIP_GUIDELINES,
  EFFECT_TYPES,
} from "@/src/constants/effects";
import type { AppLocation } from "@/src/types/app-location";

export interface CustomizationControlsPaneProps {
  selectedLocations: AppLocation[];
  onLocationsChange: (locations: AppLocation[]) => void;
  backgroundColor?: string;
  onBackgroundColorChange?: (color: string) => void;
  iconColor?: string;
  onIconColorChange?: (color: string) => void;
  selectedEffect?: EffectType;
  onEffectChange?: (effect: EffectType) => void;
  darkening3dSettings?: Darkening3DSettings;
  onDarkening3dSettingsChange?: (settings: Darkening3DSettings) => void;
  wipGuidelinesSettings?: WipGuidelinesSettings;
  onWipGuidelinesSettingsChange?: (settings: WipGuidelinesSettings) => void;
}

export function CustomizationControlsPane({
  selectedLocations,
  onLocationsChange,
  backgroundColor = DEFAULT_COLORS.BACKGROUND,
  onBackgroundColorChange,
  iconColor = DEFAULT_COLORS.ICON,
  onIconColorChange,
  selectedEffect = EFFECT_TYPES.NONE,
  onEffectChange,
  darkening3dSettings = DEFAULT_DARKENING_3D,
  onDarkening3dSettingsChange,
  wipGuidelinesSettings = DEFAULT_WIP_GUIDELINES,
  onWipGuidelinesSettingsChange,
}: CustomizationControlsPaneProps) {
  const handleLocationsChange = (values: string[]) => {
    onLocationsChange(values as AppLocation[]);
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Customization</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-6 overflow-y-auto">
        {/* App Location Selection */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="app-locations">App Locations</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="size-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Select where your app will appear in Zendesk. Some locations require SVG icons.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <MultiSelect
            options={APP_LOCATION_OPTIONS}
            selected={selectedLocations}
            onChange={handleLocationsChange}
            placeholder="Select app locations..."
          />
          {selectedLocations.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {getLocationCountText(selectedLocations.length)}
            </p>
          )}
        </div>

        <Separator />

        {/* Color Controls */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Colors</h3>
          {onBackgroundColorChange && (
            <ColorPicker
              id="background-color"
              label="Background Color"
              value={backgroundColor}
              onChange={onBackgroundColorChange}
            />
          )}
          {onIconColorChange && (
            <ColorPicker
              id="icon-color"
              label="Icon Color"
              value={iconColor}
              onChange={onIconColorChange}
            />
          )}
        </div>

        <Separator />

        {/* Effects */}
        {onEffectChange && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Effects</h3>
            <EffectSelector
              selectedEffect={selectedEffect}
              onEffectChange={onEffectChange}
              darkening3dSettings={darkening3dSettings}
              onDarkening3dSettingsChange={onDarkening3dSettingsChange}
              wipGuidelinesSettings={wipGuidelinesSettings}
              onWipGuidelinesSettingsChange={onWipGuidelinesSettingsChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
