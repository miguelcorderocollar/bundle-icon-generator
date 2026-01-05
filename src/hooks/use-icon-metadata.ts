/**
 * Hook for loading icon metadata by ID
 */

import * as React from "react";
import { getIconById } from "../utils/icon-catalog";
import type { IconMetadata } from "../types/icon";
import { isCustomImageIcon } from "../utils/locations";

/**
 * Load icon metadata for a given icon ID
 */
export function useIconMetadata(iconId?: string): IconMetadata | null {
  const [iconMetadata, setIconMetadata] = React.useState<IconMetadata | null>(
    null
  );

  React.useEffect(() => {
    if (!iconId) {
      setIconMetadata(null);
      return;
    }

    // Handle custom images - create metadata from sessionStorage
    if (isCustomImageIcon(iconId)) {
      const imageDataUrl =
        typeof window !== "undefined" ? sessionStorage.getItem(iconId) : null;

      if (imageDataUrl) {
        setIconMetadata({
          id: iconId,
          name: "Custom Image",
          pack: "custom-image",
          svg: "", // No SVG for custom images
          keywords: [],
          isCustomImage: true,
          imageDataUrl,
        });
      } else {
        setIconMetadata(null);
      }
      return;
    }

    let cancelled = false;
    getIconById(iconId)
      .then((icon) => {
        if (!cancelled && icon) {
          setIconMetadata(icon);
        }
      })
      .catch((error) => {
        console.error("Error loading icon metadata:", error);
        if (!cancelled) {
          setIconMetadata(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [iconId]);

  return iconMetadata;
}
