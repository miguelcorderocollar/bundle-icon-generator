/**
 * Reusable effect slider component with label and value display
 */

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export interface EffectSliderProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  className?: string;
}

export function EffectSlider({
  id,
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = "%",
  className,
}: EffectSliderProps) {
  const handleValueChange = (values: number[]) => {
    onChange(values[0] ?? 0);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-xs text-muted-foreground">
          {value}
          {unit}
        </span>
      </div>
      <Slider
        id={id}
        value={[value]}
        onValueChange={handleValueChange}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}

