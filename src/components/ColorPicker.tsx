/**
 * Reusable color picker component with hex input
 */

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface ColorPickerProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ColorPicker({
  id,
  label,
  value,
  onChange,
  className,
}: ColorPickerProps) {
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    // Basic validation - allow partial input
    if (hex === "" || /^#[0-9A-Fa-f]{0,6}$/.test(hex)) {
      onChange(hex);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={handleColorChange}
          className="h-10 w-20 cursor-pointer rounded-md border"
        />
        <Input
          id={`${id}-hex`}
          value={value}
          onChange={handleHexChange}
          className="flex-1 font-mono"
          placeholder="#ffffff"
          maxLength={7}
        />
      </div>
    </div>
  );
}

