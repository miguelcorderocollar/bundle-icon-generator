import * as React from "react";
import { useDebouncedValue } from "@/src/hooks/use-debounced-value";

const HEX_INPUT_PATTERN = /^#[0-9A-Fa-f]{0,6}$/;

export interface UseDebouncedColorStateOptions {
  value: string;
  onChange: (value: string) => void;
  debounceDelay?: number;
}

export interface UseDebouncedColorStateResult {
  localValue: string;
  debouncedValue: string;
  setColorValue: (value: string) => void;
  setHexValue: (value: string) => void;
  commitValue: (value: string) => void;
}

/**
 * Shared state manager for color controls:
 * - immediate local UI updates
 * - debounced parent updates
 * - sync when parent value changes externally
 */
export function useDebouncedColorState({
  value,
  onChange,
  debounceDelay = 300,
}: UseDebouncedColorStateOptions): UseDebouncedColorStateResult {
  const [localValue, setLocalValue] = React.useState(value);
  const lastPropValueRef = React.useRef(value);

  const debouncedValue = useDebouncedValue(localValue, debounceDelay);

  React.useEffect(() => {
    if (debouncedValue !== lastPropValueRef.current) {
      lastPropValueRef.current = debouncedValue;
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange]);

  React.useEffect(() => {
    if (value !== lastPropValueRef.current) {
      lastPropValueRef.current = value;
      setLocalValue(value);
    }
  }, [value]);

  const setColorValue = React.useCallback((nextValue: string) => {
    setLocalValue(nextValue);
  }, []);

  const setHexValue = React.useCallback((nextValue: string) => {
    if (nextValue === "" || HEX_INPUT_PATTERN.test(nextValue)) {
      setLocalValue(nextValue);
    }
  }, []);

  const commitValue = React.useCallback(
    (nextValue: string) => {
      lastPropValueRef.current = nextValue;
      setLocalValue(nextValue);
      onChange(nextValue);
    },
    [onChange]
  );

  return {
    localValue,
    debouncedValue,
    setColorValue,
    setHexValue,
    commitValue,
  };
}
