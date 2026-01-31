/**
 * Hook for managing icon pack selection in the share page
 *
 * Handles icon pack toggling and default pack selection.
 */

import * as React from "react";
import type { RestrictionConfig } from "@/src/types/restriction";
import { ICON_PACKS, type IconPack } from "@/src/constants/app";

/**
 * Icon pack display configuration
 */
export const ICON_PACK_OPTIONS: { value: IconPack; label: string }[] = [
  { value: ICON_PACKS.ALL, label: "All Icons" },
  { value: ICON_PACKS.GARDEN, label: "Garden" },
  { value: ICON_PACKS.FEATHER, label: "Feather" },
  { value: ICON_PACKS.REMIXICON, label: "RemixIcon" },
  { value: ICON_PACKS.EMOJI, label: "Emoji" },
  { value: ICON_PACKS.CUSTOM_SVG, label: "Custom SVG" },
  { value: ICON_PACKS.CUSTOM_IMAGE, label: "Custom Image" },
  { value: ICON_PACKS.CANVAS, label: "Canvas Editor" },
];

export interface UseIconPackSelectorReturn {
  /** Toggle an icon pack on/off */
  toggleIconPack: (pack: IconPack) => void;
  /** Toggle all icon packs */
  toggleAllPacks: () => void;
  /** Set the default icon pack */
  setDefaultIconPack: (pack: IconPack) => void;
  /** Check if a pack is currently selected */
  isPackSelected: (pack: IconPack) => boolean;
  /** Check if a pack is the default */
  isDefaultPack: (pack: IconPack) => boolean;
}

export function useIconPackSelector(
  config: RestrictionConfig,
  setConfig: (config: RestrictionConfig) => void
): UseIconPackSelectorReturn {
  // Toggle an icon pack
  const toggleIconPack = React.useCallback(
    (pack: IconPack) => {
      const currentPacks = config.allowedIconPacks || [];
      let newPacks: IconPack[];

      if (currentPacks.includes(pack)) {
        newPacks = currentPacks.filter((p) => p !== pack);
      } else {
        newPacks = [...currentPacks, pack];
      }

      // If empty, set to undefined (all allowed)
      setConfig({
        ...config,
        allowedIconPacks: newPacks.length > 0 ? newPacks : undefined,
      });
    },
    [config, setConfig]
  );

  // Toggle all icon packs
  const toggleAllPacks = React.useCallback(() => {
    const allPacks = ICON_PACK_OPTIONS.map((o) => o.value);
    const currentPacks = config.allowedIconPacks || [];

    if (currentPacks.length === allPacks.length) {
      // All selected - deselect all (undefined means all allowed)
      setConfig({ ...config, allowedIconPacks: undefined });
    } else {
      // Select all
      setConfig({ ...config, allowedIconPacks: allPacks });
    }
  }, [config, setConfig]);

  // Set the default icon pack
  const setDefaultIconPack = React.useCallback(
    (pack: IconPack) => {
      // Toggle: if already default, clear it
      if (config.defaultIconPack === pack) {
        setConfig({ ...config, defaultIconPack: undefined });
      } else {
        // Set as default (also ensure it's in allowed packs if we have restrictions)
        const currentPacks = config.allowedIconPacks || [];
        if (currentPacks.length > 0 && !currentPacks.includes(pack)) {
          // Add it to allowed packs
          setConfig({
            ...config,
            allowedIconPacks: [...currentPacks, pack],
            defaultIconPack: pack,
          });
        } else {
          setConfig({ ...config, defaultIconPack: pack });
        }
      }
    },
    [config, setConfig]
  );

  // Check if a pack is selected
  const isPackSelected = React.useCallback(
    (pack: IconPack) => {
      return !config.allowedIconPacks || config.allowedIconPacks.includes(pack);
    },
    [config.allowedIconPacks]
  );

  // Check if a pack is the default
  const isDefaultPack = React.useCallback(
    (pack: IconPack) => {
      return config.defaultIconPack === pack;
    },
    [config.defaultIconPack]
  );

  return {
    toggleIconPack,
    toggleAllPacks,
    setDefaultIconPack,
    isPackSelected,
    isDefaultPack,
  };
}
