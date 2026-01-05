/**
 * Component for editing radial gradient properties
 */

import * as React from "react";
import { Label } from "@/components/ui/label";
import { EffectSlider } from "./EffectSlider";
import { ColorPicker } from "./ColorPicker";
import { useDebouncedValue } from "@/src/hooks/use-debounced-value";
import type { RadialGradient } from "@/src/utils/gradients";

export interface RadialGradientEditorProps {
  gradient: RadialGradient;
  onGradientChange: (gradient: RadialGradient) => void;
  className?: string;
}

export function RadialGradientEditor({
  gradient,
  onGradientChange,
  className,
}: RadialGradientEditorProps) {
  // Local state for immediate UI updates
  const [localGradient, setLocalGradient] = React.useState(gradient);
  const lastPropGradientRef = React.useRef(gradient);

  // Debounce gradient changes to avoid excessive re-renders while adjusting
  const gradientKey = React.useMemo(() => JSON.stringify(localGradient), [localGradient]);
  const debouncedGradientKey = useDebouncedValue(gradientKey, 300);

  // Update parent when debounced gradient changes
  React.useEffect(() => {
    const debouncedGradient = JSON.parse(debouncedGradientKey) as RadialGradient;
    if (JSON.stringify(debouncedGradient) !== JSON.stringify(lastPropGradientRef.current)) {
      lastPropGradientRef.current = debouncedGradient;
      onGradientChange(debouncedGradient);
    }
  }, [debouncedGradientKey, onGradientChange]);

  // Sync local state when prop changes externally
  React.useEffect(() => {
    if (JSON.stringify(gradient) !== JSON.stringify(lastPropGradientRef.current)) {
      lastPropGradientRef.current = gradient;
      setLocalGradient(gradient);
    }
  }, [gradient]);

  const handleCenterXChange = (centerX: number) => {
    setLocalGradient((prev) => ({ ...prev, centerX }));
  };

  const handleCenterYChange = (centerY: number) => {
    setLocalGradient((prev) => ({ ...prev, centerY }));
  };

  const handleRadiusChange = (radius: number) => {
    setLocalGradient((prev) => ({ ...prev, radius }));
  };

  const handleStopColorChange = (index: number, color: string) => {
    setLocalGradient((prev) => {
      const newStops = [...prev.stops];
      newStops[index] = { ...newStops[index], color };
      return { ...prev, stops: newStops };
    });
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        <EffectSlider
          id="gradient-center-x"
          label="Center X"
          value={localGradient.centerX}
          onChange={handleCenterXChange}
          min={0}
          max={100}
          step={1}
          unit="%"
        />

        <EffectSlider
          id="gradient-center-y"
          label="Center Y"
          value={localGradient.centerY}
          onChange={handleCenterYChange}
          min={0}
          max={100}
          step={1}
          unit="%"
        />

        <EffectSlider
          id="gradient-radius"
          label="Radius"
          value={localGradient.radius}
          onChange={handleRadiusChange}
          min={0}
          max={100}
          step={1}
          unit="%"
        />

        <div className="space-y-3">
          <Label className="text-xs">Colors</Label>
          {localGradient.stops.map((stop, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground min-w-[60px]">
                  {index === 0 ? "Center" : index === localGradient.stops.length - 1 ? "Edge" : `Stop ${index + 1}`}
                </span>
                <ColorPicker
                  id={`gradient-stop-${index}`}
                  label=""
                  value={stop.color}
                  onChange={(color) => handleStopColorChange(index, color)}
                  colorType="background"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

