/**
 * Convert app locations to MultiSelect options format
 */

import { APP_LOCATIONS } from "@/src/types/app-location";
import type { MultiSelectOption } from "@/components/ui/multi-select";

/**
 * Convert APP_LOCATIONS to MultiSelectOption format
 * This is memoized at module level since the data is static
 */
export const APP_LOCATION_OPTIONS: MultiSelectOption[] = APP_LOCATIONS.map(
  (loc) => ({
    label: loc.label,
    value: loc.value,
    description: loc.description,
  })
);
