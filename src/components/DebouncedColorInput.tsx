/**
 * Debounced color input component for native color picker with text input
 * Provides immediate UI feedback while debouncing parent updates
 */

import * as React from "react";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/src/hooks/use-debounced-value";

/** Default debounce delay in milliseconds */
const DEFAULT_DEBOUNCE_DELAY = 300;

export interface DebouncedColorInputProps {
  /** Current color value (hex format) */
  value: string;
  /** Callback when color changes (debounced) */
  onChange: (value: string) => void;
  /** Optional ID for the color input */
  id?: string;
  /** Optional aria-label for the color input */
  ariaLabel?: string;
  /** Debounce delay in milliseconds (default: 300ms) */
  debounceDelay?: number;
  /** Whether to show the text input alongside the color picker */
  showTextInput?: boolean;
  /** CSS class name for the color input */
  colorInputClassName?: string;
  /** CSS class name for the text input */
  textInputClassName?: string;
}

export function DebouncedColorInput({
  value,
  onChange,
  id,
  ariaLabel,
  debounceDelay = DEFAULT_DEBOUNCE_DELAY,
  showTextInput = true,
  colorInputClassName = "h-8 w-10 cursor-pointer rounded-md border flex-shrink-0",
  textInputClassName = "w-24 font-mono text-xs",
}: DebouncedColorInputProps) {
  // Local state for immediate UI updates
  const [localValue, setLocalValue] = React.useState(value);
  const lastPropValueRef = React.useRef(value);

  // Debounce value changes to avoid excessive re-renders
  const debouncedLocalValue = useDebouncedValue(localValue, debounceDelay);

  // Update parent when debounced value changes (but only if it's different from prop)
  React.useEffect(() => {
    if (debouncedLocalValue !== lastPropValueRef.current) {
      lastPropValueRef.current = debouncedLocalValue;
      onChange(debouncedLocalValue);
    }
  }, [debouncedLocalValue, onChange]);

  // Sync local state when prop changes externally
  React.useEffect(() => {
    if (value !== lastPropValueRef.current) {
      lastPropValueRef.current = value;
      setLocalValue(value);
    }
  }, [value]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    // Basic validation - allow partial input
    if (hex === "" || /^#[0-9A-Fa-f]{0,6}$/.test(hex)) {
      setLocalValue(hex);
    }
  };

  if (!showTextInput) {
    return (
      <input
        id={id}
        type="color"
        value={localValue}
        onChange={handleColorChange}
        className={colorInputClassName}
        aria-label={ariaLabel}
      />
    );
  }

  return (
    <>
      <input
        id={id}
        type="color"
        value={localValue}
        onChange={handleColorChange}
        className={colorInputClassName}
        aria-label={ariaLabel}
      />
      <Input
        value={localValue}
        onChange={handleHexChange}
        placeholder="#ffffff"
        className={textInputClassName}
        maxLength={7}
      />
    </>
  );
}
