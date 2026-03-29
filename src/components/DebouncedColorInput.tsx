/**
 * Debounced color input component for native color picker with text input
 * Provides immediate UI feedback while debouncing parent updates
 */

import { Input } from "@/components/ui/input";
import { useDebouncedColorState } from "@/src/hooks/use-debounced-color-state";

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
  colorInputClassName = "h-9 w-9 cursor-pointer rounded-md border border-input bg-background p-0",
  textInputClassName = "h-9 w-24 px-2.5 font-mono text-xs",
}: DebouncedColorInputProps) {
  const { localValue, setColorValue, setHexValue } = useDebouncedColorState({
    value,
    onChange,
    debounceDelay,
  });

  if (!showTextInput) {
    return (
      <input
        id={id}
        type="color"
        value={localValue}
        onChange={(e) => setColorValue(e.target.value)}
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
        onChange={(e) => setColorValue(e.target.value)}
        className={colorInputClassName}
        aria-label={ariaLabel}
      />
      <Input
        value={localValue}
        onChange={(e) => setHexValue(e.target.value)}
        placeholder="#ffffff"
        className={textInputClassName}
        maxLength={7}
      />
    </>
  );
}
