/**
 * Main hook for icon generator state management
 */

import * as React from "react";
import type { AppLocation } from "@/src/types/app-location";
import { ICON_PACKS, type IconPack } from "@/src/constants/app";
import { loadIconCatalog } from "@/src/utils/icon-catalog";
import { getUserEmojis } from "@/src/utils/emoji-catalog";

export interface IconGeneratorState {
  selectedLocations: AppLocation[];
  selectedIconId?: string;
  backgroundColor: string;
  iconColor: string;
  searchQuery: string;
  selectedPack: IconPack;
  iconSize: number;
}

export interface IconGeneratorActions {
  setSelectedLocations: (locations: AppLocation[]) => void;
  setSelectedIconId: (id: string | undefined) => void;
  setBackgroundColor: (color: string) => void;
  setIconColor: (color: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedPack: (pack: IconPack) => void;
  setIconSize: (size: number) => void;
}

const DEFAULT_STATE: IconGeneratorState = {
  selectedLocations: [],
  selectedIconId: undefined,
  backgroundColor: "#063940",
  iconColor: "#ffffff",
  searchQuery: "",
  selectedPack: ICON_PACKS.ALL,
  iconSize: 123,
};

export function useIconGenerator() {
  const [state, setState] = React.useState<IconGeneratorState>(DEFAULT_STATE);
  const [hasInitializedRandomIcon, setHasInitializedRandomIcon] = React.useState(false);

  // Initialize with a random icon on first load
  React.useEffect(() => {
    if (hasInitializedRandomIcon || typeof window === "undefined") return;

    async function initializeRandomIcon() {
      try {
        // Load icon catalog
        const catalog = await loadIconCatalog();
        const allIcons = Object.values(catalog.icons);
        
        // Get user emojis if available
        const userEmojis = getUserEmojis();
        
        // Combine all icons
        const combinedIcons = [...allIcons, ...userEmojis];
        
        // Select a random icon if any are available
        if (combinedIcons.length > 0) {
          const randomIndex = Math.floor(Math.random() * combinedIcons.length);
          const randomIcon = combinedIcons[randomIndex];
          setState((prev) => ({ ...prev, selectedIconId: randomIcon.id }));
        }
        
        setHasInitializedRandomIcon(true);
      } catch (error) {
        console.error("Failed to initialize random icon:", error);
        setHasInitializedRandomIcon(true);
      }
    }

    initializeRandomIcon();
  }, [hasInitializedRandomIcon]);

  const actions: IconGeneratorActions = React.useMemo(
    () => ({
      setSelectedLocations: (locations) =>
        setState((prev) => ({ ...prev, selectedLocations: locations })),
      setSelectedIconId: (id) =>
        setState((prev) => ({ ...prev, selectedIconId: id })),
      setBackgroundColor: (color) =>
        setState((prev) => ({ ...prev, backgroundColor: color })),
      setIconColor: (color) =>
        setState((prev) => ({ ...prev, iconColor: color })),
      setSearchQuery: (query) =>
        setState((prev) => ({ ...prev, searchQuery: query })),
      setSelectedPack: (pack) =>
        setState((prev) => ({ ...prev, selectedPack: pack })),
      setIconSize: (size) =>
        setState((prev) => ({ ...prev, iconSize: size })),
    }),
    []
  );

  return { state, actions };
}

