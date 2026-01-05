/**
 * Component for editing linear gradient properties
 */

import * as React from "react";
import { Label } from "@/components/ui/label";
import { EffectSlider } from "./EffectSlider";
import { ColorPicker } from "./ColorPicker";
import { useDebouncedValue } from "@/src/hooks/use-debounced-value";
import type { LinearGradient } from "@/src/utils/gradients";

export interface LinearGradientEditorProps {
  gradient: LinearGradient;
  onGradientChange: (gradient: LinearGradient) => void;
  className?: string;
}

export function LinearGradientEditor({
  gradient,
  onGradientChange,
  className,
}: LinearGradientEditorProps) {
  // Local state for immediate UI updates
  const [localGradient, setLocalGradient] = React.useState(gradient);
  const lastPropGradientRef = React.useRef(gradient);

  // Debounce gradient changes to avoid excessive re-renders while adjusting
  const gradientKey = React.useMemo(
    () => JSON.stringify(localGradient),
    [localGradient]
  );
  const debouncedGradientKey = useDebouncedValue(gradientKey, 300);

  // Update parent when debounced gradient changes
  React.useEffect(() => {
    const debouncedGradient = JSON.parse(
      debouncedGradientKey
    ) as LinearGradient;
    if (
      JSON.stringify(debouncedGradient) !==
      JSON.stringify(lastPropGradientRef.current)
    ) {
      lastPropGradientRef.current = debouncedGradient;
      onGradientChange(debouncedGradient);
    }
  }, [debouncedGradientKey, onGradientChange]);

  // Sync local state when prop changes externally
  React.useEffect(() => {
    if (
      JSON.stringify(gradient) !== JSON.stringify(lastPropGradientRef.current)
    ) {
      lastPropGradientRef.current = gradient;
      setLocalGradient(gradient);
    }
  }, [gradient]);

  const handleAngleChange = (angle: number) => {
    setLocalGradient((prev) => ({ ...prev, angle }));
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
          id="gradient-angle"
          label="Angle"
          value={localGradient.angle}
          onChange={handleAngleChange}
          min={0}
          max={360}
          step={1}
          unit="°"
        />

        <div className="space-y-3">
          <Label className="text-xs">Colors</Label>
          {localGradient.stops.map((stop, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground min-w-[60px]">
                  {index === 0
                    ? "From"
                    : index === localGradient.stops.length - 1
                      ? "To"
                      : `Stop ${index + 1}`}
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
