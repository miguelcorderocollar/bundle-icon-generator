"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { ColorPicker } from "@/src/components/ColorPicker";
import { EffectSlider } from "@/src/components/EffectSlider";
import { APP_LOCATION_OPTIONS } from "@/src/utils/app-location-options";
import { getLocationCountText } from "@/src/utils/locations";
import { DEFAULT_COLORS, ICON_GRID } from "@/src/constants/app";
import { useDebouncedValue } from "@/src/hooks/use-debounced-value";
import type { AppLocation } from "@/src/types/app-location";

export interface CustomizationControlsPaneProps {
  selectedLocations: AppLocation[];
  onLocationsChange: (locations: AppLocation[]) => void;
  backgroundColor?: string;
  onBackgroundColorChange?: (color: string) => void;
  iconColor?: string;
  onIconColorChange?: (color: string) => void;
  iconSize?: number;
  onIconSizeChange?: (size: number) => void;
  selectedIconId?: string;
}

export function CustomizationControlsPane({
  selectedLocations,
  onLocationsChange,
  backgroundColor = DEFAULT_COLORS.BACKGROUND,
  onBackgroundColorChange,
  iconColor = DEFAULT_COLORS.ICON,
  onIconColorChange,
  iconSize = ICON_GRID.DEFAULT_ICON_SIZE,
  onIconSizeChange,
  selectedIconId,
}: CustomizationControlsPaneProps) {
  // Debounce icon size changes to prevent lag while dragging slider
  const [localIconSize, setLocalIconSize] = React.useState(iconSize);
  const debouncedIconSize = useDebouncedValue(localIconSize, 300);
  const lastPropSizeRef = React.useRef(iconSize);

  // Update parent when debounced value changes (but only if it's different from prop)
  React.useEffect(() => {
    if (onIconSizeChange && debouncedIconSize !== lastPropSizeRef.current) {
      lastPropSizeRef.current = debouncedIconSize;
      onIconSizeChange(debouncedIconSize);
    }
  }, [debouncedIconSize, onIconSizeChange]);

  // Sync local state when prop changes externally (but only if it's actually different)
  React.useEffect(() => {
    if (iconSize !== lastPropSizeRef.current) {
      lastPropSizeRef.current = iconSize;
      setLocalIconSize(iconSize);
    }
  }, [iconSize]);

  const handleLocationsChange = (values: string[]) => {
    onLocationsChange(values as AppLocation[]);
  };

  const handleIconSizeChange = (value: number) => {
    setLocalIconSize(value);
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

        {/* Icon Size */}
        {onIconSizeChange && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Icon Size</h3>
            <EffectSlider
              id="icon-size"
              label="Size"
              value={localIconSize}
              onChange={handleIconSizeChange}
              min={ICON_GRID.MIN_ICON_SIZE}
              max={200}
              step={4}
              unit="px"
            />
            <p className="text-xs text-muted-foreground">
              Controls the size of the icon within the canvas. The exported PNG files will still be the correct dimensions (320×320 and 128×128).
            </p>
          </div>
        )}

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
              colorType="background"
            />
          )}
          {onIconColorChange && !selectedIconId?.startsWith("emoji-") && (
            <ColorPicker
              id="icon-color"
              label="Icon Color"
              value={iconColor}
              onChange={onIconColorChange}
              colorType="icon"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
