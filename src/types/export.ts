/**
 * Export variant definitions and helpers
 */

import type { AppLocation } from "./app-location";
import type { BackgroundValue } from "../utils/gradients";

/**
 * Export variant specification
 */
export interface ExportVariant {
  filename: string;
  width: number;
  height: number;
  format: "png" | "svg";
  description: string;
  required: boolean;
  requiredFor?: AppLocation[];
}

/**
 * Base export variants
 */
export const EXPORT_VARIANTS: ExportVariant[] = [
  {
    filename: "logo.png",
    width: 320,
    height: 320,
    format: "png",
    description: "Large icon displayed in Zendesk admin pages",
    required: true,
  },
  {
    filename: "logo-small.png",
    width: 128,
    height: 128,
    format: "png",
    description: "Small icon displayed in Zendesk headers",
    required: true,
  },
  {
    filename: "icon_nav_bar.svg",
    width: 18,
    height: 18,
    format: "svg",
    description: "Icon for navigation bar (18×18 display)",
    required: false,
    requiredFor: ["nav_bar"],
  },
  {
    filename: "icon_top_bar.svg",
    width: 18,
    height: 18,
    format: "svg",
    description: "Icon for top bar (18×18 display)",
    required: false,
    requiredFor: ["top_bar"],
  },
  {
    filename: "icon_ticket_editor.svg",
    width: 18,
    height: 18,
    format: "svg",
    description: "Icon for ticket editor toolbar (18×18 display)",
    required: false,
    requiredFor: ["ticket_editor"],
  },
];

/**
 * Calculate which export variants are required given selected locations
 */
export function getRequiredExportVariants(
  selectedLocations: AppLocation[]
): ExportVariant[] {
  const variants: ExportVariant[] = [];
  const seen = new Set<string>();

  const addVariant = (variant: ExportVariant) => {
    if (!seen.has(variant.filename)) {
      variants.push(variant);
      seen.add(variant.filename);
    }
  };

  // Always include required variants
  for (const variant of EXPORT_VARIANTS) {
    if (variant.required) {
      addVariant(variant);
    }
  }

  if (selectedLocations.length === 0) {
    return variants;
  }

  const hasAllLocations = selectedLocations.includes("all_locations");

  for (const variant of EXPORT_VARIANTS) {
    if (!variant.requiredFor) {
      continue;
    }

    const isRequired =
      hasAllLocations ||
      variant.requiredFor.some((location) =>
        selectedLocations.includes(location)
      );

    if (isRequired) {
      addVariant(variant);
    }
  }

  return variants;
}

/**
 * Export metadata stored alongside generated ZIP files
 */
export interface ExportMetadata {
  exportedAt: string;
  iconId: string;
  iconName: string;
  customization: {
    backgroundColor: BackgroundValue;
    iconColor: string;
    iconSize: number;
  };
  locations: AppLocation[];
  variants: string[];
}
