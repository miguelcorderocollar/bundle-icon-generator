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
import { BackgroundControls } from "@/src/components/BackgroundControls";
import { APP_LOCATION_OPTIONS } from "@/src/utils/app-location-options";
import { getLocationCountText, getSvgRequiringLocations, isCustomImageIcon } from "@/src/utils/locations";
import { DEFAULT_COLORS, ICON_GRID } from "@/src/constants/app";
import { useDebouncedValue } from "@/src/hooks/use-debounced-value";
import type { AppLocation } from "@/src/types/app-location";
import type { BackgroundValue } from "@/src/utils/gradients";
import { hasSvgRequirements } from "@/src/utils/locations";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImageIcon } from "lucide-react";

export interface CustomizationControlsPaneProps {
  selectedLocations: AppLocation[];
  onLocationsChange: (locations: AppLocation[]) => void;
  backgroundColor?: BackgroundValue;
  onBackgroundColorChange?: (color: BackgroundValue) => void;
  iconColor?: string;
  onIconColorChange?: (color: string) => void;
  iconSize?: number;
  onIconSizeChange?: (size: number) => void;
  svgIconSize?: number;
  onSvgIconSizeChange?: (size: number) => void;
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
  svgIconSize = ICON_GRID.DEFAULT_ICON_SIZE,
  onSvgIconSizeChange,
  selectedIconId,
}: CustomizationControlsPaneProps) {
  // Check if SVG files are required for selected locations
  const hasSvgFiles = hasSvgRequirements(selectedLocations);
  
  // Check if current icon is a custom image (disables SVG locations)
  const isCustomImage = isCustomImageIcon(selectedIconId);
  
  // Get SVG-requiring locations to disable them when custom image is selected
  const svgRequiringLocations = getSvgRequiringLocations();
  
  // Build location options with disabled state for custom images
  const locationOptions = React.useMemo(() => {
    if (!isCustomImage) {
      return APP_LOCATION_OPTIONS;
    }
    
    return APP_LOCATION_OPTIONS.map((option) => {
      // Disable SVG-requiring locations and "all_locations" when custom image is selected
      const isSvgLocation = svgRequiringLocations.includes(option.value as AppLocation) || option.value === "all_locations";
      return {
        ...option,
        disabled: isSvgLocation,
        disabledReason: isSvgLocation ? "Requires SVG (not available for custom images)" : undefined,
      };
    });
  }, [isCustomImage, svgRequiringLocations]);

  // Debounce icon size changes to prevent lag while dragging slider
  const [localIconSize, setLocalIconSize] = React.useState(iconSize);
  const debouncedIconSize = useDebouncedValue(localIconSize, 300);
  const lastPropSizeRef = React.useRef(iconSize);

  // Debounce SVG icon size changes
  const [localSvgIconSize, setLocalSvgIconSize] = React.useState(svgIconSize);
  const debouncedSvgIconSize = useDebouncedValue(localSvgIconSize, 300);
  const lastPropSvgSizeRef = React.useRef(svgIconSize);

  // Update parent when debounced value changes (but only if it's different from prop)
  React.useEffect(() => {
    if (onIconSizeChange && debouncedIconSize !== lastPropSizeRef.current) {
      lastPropSizeRef.current = debouncedIconSize;
      onIconSizeChange(debouncedIconSize);
    }
  }, [debouncedIconSize, onIconSizeChange]);

  // Update parent when debounced SVG size changes
  React.useEffect(() => {
    if (onSvgIconSizeChange && debouncedSvgIconSize !== lastPropSvgSizeRef.current) {
      lastPropSvgSizeRef.current = debouncedSvgIconSize;
      onSvgIconSizeChange(debouncedSvgIconSize);
    }
  }, [debouncedSvgIconSize, onSvgIconSizeChange]);

  // Sync local state when prop changes externally (but only if it's actually different)
  React.useEffect(() => {
    if (iconSize !== lastPropSizeRef.current) {
      lastPropSizeRef.current = iconSize;
      setLocalIconSize(iconSize);
    }
  }, [iconSize]);

  // Sync local SVG size state when prop changes externally
  React.useEffect(() => {
    if (svgIconSize !== lastPropSvgSizeRef.current) {
      lastPropSvgSizeRef.current = svgIconSize;
      setLocalSvgIconSize(svgIconSize);
    }
  }, [svgIconSize]);

  const handleLocationsChange = (values: string[]) => {
    onLocationsChange(values as AppLocation[]);
  };

  const handleIconSizeChange = (value: number) => {
    setLocalIconSize(value);
  };

  const handleSvgIconSizeChange = (value: number) => {
    setLocalSvgIconSize(value);
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
            options={locationOptions}
            selected={selectedLocations}
            onChange={handleLocationsChange}
            placeholder="Select app locations..."
          />
          {isCustomImage && (
            <Alert className="mt-2">
              <ImageIcon className="size-4" />
              <AlertDescription className="text-xs">
                Custom images can only be exported as PNG. Locations requiring SVG icons are disabled.
              </AlertDescription>
            </Alert>
          )}
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
              label={hasSvgFiles ? "PNG Size" : "Size"}
              value={localIconSize}
              onChange={handleIconSizeChange}
              min={ICON_GRID.MIN_ICON_SIZE}
              max={200}
              step={4}
              unit="px"
            />
            <p className="text-xs text-muted-foreground">
              Controls the size of the icon within the PNG canvas. Exported files are 320×320 and 128×128.
            </p>
            
            {/* SVG Icon Size - only shown when SVG locations are selected */}
            {hasSvgFiles && onSvgIconSizeChange && (
              <>
                <EffectSlider
                  id="svg-icon-size"
                  label="SVG Size"
                  value={localSvgIconSize}
                  onChange={handleSvgIconSizeChange}
                  min={ICON_GRID.MIN_ICON_SIZE}
                  max={300}
                  step={4}
                  unit="px"
                />
                <p className="text-xs text-muted-foreground">
                  Controls the size of the icon within SVG files (top bar, ticket editor, nav bar).
                </p>
              </>
            )}
          </div>
        )}

        <Separator />

        {/* Color Controls */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Colors</h3>
          {onIconColorChange && !selectedIconId?.startsWith("emoji-") && (
            <ColorPicker
              id="icon-color"
              label="Icon Color"
              value={iconColor}
              onChange={onIconColorChange}
              colorType="icon"
              isCustomSvg={selectedIconId?.startsWith("custom-svg-")}
            />
          )}
          {onBackgroundColorChange && (
            <BackgroundControls
              value={backgroundColor}
              onChange={onBackgroundColorChange}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
