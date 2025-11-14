/**
 * Hook for loading icon metadata by ID
 */

import * as React from "react";
import { getIconById } from "../utils/icon-catalog";
import type { IconMetadata } from "../types/icon";

/**
 * Load icon metadata for a given icon ID
 */
export function useIconMetadata(iconId?: string): IconMetadata | null {
  const [iconMetadata, setIconMetadata] = React.useState<IconMetadata | null>(null);

  React.useEffect(() => {
    if (!iconId) {
      setIconMetadata(null);
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

